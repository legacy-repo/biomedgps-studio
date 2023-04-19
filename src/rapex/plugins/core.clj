(ns rapex.plugins.core
  (:require [rapex.plugins.core-specs :as specs]
            [ring.util.http-response :refer [ok not-found]]
            [rapex.plugins.rapex.chart-sepcs :as cs]
            [clojure.spec.alpha :as s]
            [rapex.config :refer [memorized-get-dataset-metadata]]
            ;; Plugin
            [rapex.plugins.rapex.core :as rapex]))

(def ^:private chart-manifests (atom (concat [] rapex/chart-manifests)))

(def ^:private chart-ui-schemas (atom (merge {} rapex/chart-ui-schemas)))

(defn list-charts
  []
  {:summary    "Get all the available charts."
   :parameters {}
   :responses  {200 {:body specs/list-chart-response}
                404 {:body {:msg string?
                            :context any?}}
                400 {:body {:msg string?
                            :context any?}}
                500 {:body {:msg string?
                            :context any?}}}
   :handler    (fn [{{{:keys [page page_size]} :query} :parameters}]
                 (let [page     (if (nil? page) 1 page)
                       page_size (if (nil? page_size) 10 page_size)]
                   (ok {:total (count @chart-manifests)
                        :page page
                        :page_size page_size
                        :data (->> (drop (* (- page 1) page_size) @chart-manifests)
                                   (take page_size))})))})

(def schema (s/keys :req-un [::cs/dataset]
                    :opt-un []))

(defn get-chart-ui-schema
  []
  {:summary    "Get the ui schema of a chart."
   :parameters {:path {:chart_name string?}
                :query schema}
   :responses  {200 {:body any?}
                404 {:body {:msg string?
                            :context any?}}
                400 {:body {:msg string?
                            :context any?}}
                500 {:body {:msg string?
                            :context any?}}}
   :handler    (fn [{{{:keys [chart_name]} :path
                      {:keys [dataset]} :query} :parameters}]
                 (let [ui-schema-fn (get @chart-ui-schemas (keyword chart_name))]
                   (if ui-schema-fn
                     (ok (ui-schema-fn dataset))
                     (not-found {:msg "No such chart."
                                 :context nil}))))})

(defn gen-dataset-map
  "Generate dataset map for ui schema.
   
   Output: {:key \"000000\" :text \"000000-GSE000000\"} 
  "
  [& {:keys [dataset]}]
  (let [dataset-metadata (memorized-get-dataset-metadata)
        dataset-metadata (if dataset
                           (filter #(= (:dataset_abbr %) dataset) dataset-metadata)
                           dataset-metadata)]
    (map (fn [dataset] {:key (:dataset_abbr dataset)
                        :text (format "PMID:%s-%s" (:dataset_abbr dataset) (:external_db_id dataset))})
         dataset-metadata)))

(defn get-datasets
  []
  {:summary "Get datasets"
   :parameters {:query ::specs/DatasetsQueryParams}
   :responses {200 {:body ::specs/DatasetSchema}}
   :handler (fn [{{{:keys [show_details]} :query} :parameters}]
              (if show_details
                (ok (memorized-get-dataset-metadata))
                (ok (gen-dataset-map))))})

(def routes
  [[""
    {:swagger {:tags ["Visualization for Omics Data"]}}

    ["/datasets"
     {:get (get-datasets)}]

    ["/charts"
     {:get (list-charts)}]

    ["/charts/ui-schema/:chart_name"
     {:get (get-chart-ui-schema)}]]

   rapex/routes])
