(ns rapex.tasks.core
  (:require [rapex.tasks.core-specs :as specs]
            [ring.util.http-response :refer [ok not-found]]
            [rapex.tasks.common-sepcs :as cs]
            [clojure.string :as clj-str]
            [clojure.spec.alpha :as s]
            [rapex.tasks.util :refer [gen-organ-map]]
            ;; Chats
            [rapex.tasks.boxplot :as boxplot]
            [rapex.tasks.boxplot-multiple-organs :as boxplot-multiple-organs]
            [rapex.tasks.barplot :as barplot]
            [rapex.tasks.barplot-multiple-organs :as barplot-multiple-organs]
            [rapex.tasks.corrplot :as corrplot]
            [rapex.tasks.heatmap :as heatmap]))

(def ^:private chart-manifests (atom [boxplot/manifest
                                      boxplot-multiple-organs/manifest
                                      barplot/manifest
                                      barplot-multiple-organs/manifest
                                      corrplot/manifest
                                      heatmap/manifest]))


(def ^:private chart-ui-schemas (atom {:boxplot boxplot/ui-schema-fn
                                       :boxplot-organs boxplot-multiple-organs/ui-schema-fn
                                       :barplot barplot/ui-schema-fn
                                       :barplot-organs barplot-multiple-organs/ui-schema-fn
                                       :corrplot corrplot/ui-schema-fn
                                       :multiple-genes-comparison heatmap/ui-schema-fn}))

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

(def schema (s/keys :req-un []
                    :opt-un [::cs/dataset]))

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
                     (if dataset
                       (ok (ui-schema-fn {:organ-map (gen-organ-map :dataset dataset)
                                          :datatype-map {:fpkm {:text (clj-str/upper-case "fpkm")}}}))
                       (ok (ui-schema-fn {})))
                     (not-found {:msg "No such chart."
                                 :context nil}))))})

(def routes
  [""
   {:swagger {:tags ["Visualization for Omics Data"]}}

   ["/charts"
    {:get (list-charts)}]

   ["/charts/ui-schema/:chart_name"
    {:get (get-chart-ui-schema)}]

   ["/charts/boxplot"
    {:post (boxplot/post-boxplot!)}]

   ["/charts/boxplot-organs"
    {:post (boxplot-multiple-organs/post-boxplot!)}]

   ["/charts/barplot"
    {:post (barplot/post-barplot!)}]

   ["/charts/barplot-organs"
    {:post (barplot-multiple-organs/post-barplot!)}]

   ["/charts/corrplot"
    {:post (corrplot/post-corrplot!)}]

   ["/charts/multiple-genes-comparison"
    {:post (heatmap/post-heatmap!)}]])
