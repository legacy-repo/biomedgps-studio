(ns rapex.routes.database
  (:require [ring.util.http-response :refer [ok not-found bad-request internal-server-error]]
            [rapex.db.query-data :as qd]
            [clojure.tools.logging :as log]
            [rapex.routes.database-specs :as ds]
            [rapex.config :refer [get-default-dataset memorized-get-dataset-metadata]]
            [rapex.tasks.common-sepcs :as cs]))

(defn get-error-response
  [e]
  (let [code (:code (.getData e))]
    (cond
      (= code :not-found) (not-found {:msg (.getMessage e)
                                      :context (.getData e)})
      (= code :bad-request) (bad-request {:msg (.getMessage e)
                                          :context (.getData e)})
      :else (internal-server-error {:msg (.getMessage e)
                                    :context (.getData e)}))))

(def get-default-organ (first cs/organ-sets))

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

(defn get-results
  [title table]
  {:summary    title
   :parameters {:query ::ds/DBQueryParams}
   :responses  {200 {:body ::ds/DBItems}
                404 {:body ds/database-error-body}
                400 {:body ds/database-error-body}
                500 {:body ds/database-error-body}}
   :handler    (fn [{{{:keys [page page_size query_str dataset]} :query} :parameters
                     {:as headers} :headers}]
                 (try
                   (let [page (or page 1)
                         page_size (or page_size 10)
                         dataset (or dataset (get-default-dataset))
                         query-map (qd/read-string-as-map query_str)
                         query-map (merge query-map {:limit page_size
                                                     :offset (* (- page 1) page_size)
                                                     :from table})
                         dbpath (qd/get-db-path dataset)]
                     (log/info "database:" dbpath "page:" page, "page_size:" page_size, "query-map:" query-map)
                     (ok {:total (qd/get-total dbpath query-map)
                          :page page
                          :page_size page_size
                          :data (qd/get-results dbpath query-map)}))
                   (catch Exception e
                     (log/error "Error: " e)
                     (get-error-response e))))})

(defn fetch-genes
  [title]
  {:summary    title
   :parameters {:query ::ds/DBDataQueryParams}
   :responses  {200 {:body ::ds/DBDataItems}
                404 {:body ds/database-error-body}
                400 {:body ds/database-error-body}
                500 {:body ds/database-error-body}}
   :handler    (fn [{{{:keys [page page_size query_str dataset]} :query} :parameters
                     {:as headers} :headers}]
                 (try
                   (let [page (or page 1)
                         page_size (or page_size 50)
                         dataset (or dataset (get-default-dataset))
                         query-map (qd/read-string-as-map query_str)
                         query-map (merge query-map {:limit page_size
                                                     :offset (* (- page 1) page_size)
                                                     :from :genes})
                         dbpath (qd/get-db-path dataset)]
                     (log/info "database:" dbpath "query-map:" query-map)
                     (ok {:total (qd/get-total dbpath query-map)
                          :page page
                          :page_size page_size
                          :data (qd/get-results dbpath query-map)}))
                   (catch Exception e
                     (log/error "Error: " e)
                     (get-error-response e))))})

(defn fetch-similar-genes
  []
  {:summary    "Fetch similar genes"
   :parameters {:query ::ds/SimilarGenesQueryParams}
   :responses  {200 {:body ::ds/DBDataItems}
                404 {:body ds/database-error-body}
                400 {:body ds/database-error-body}
                500 {:body ds/database-error-body}}
   :handler    (fn [{{{:keys [page page_size query_str organ dataset]} :query} :parameters
                     {:as headers} :headers}]
                 (try
                   (let [page (or page 1)
                         page_size (or page_size 50)
                         dataset (or dataset (get-default-dataset))
                         organ   (or organ (get-default-organ))
                         query-map (qd/read-string-as-map query_str)
                         ;; How to handle the exception when the table doesn't exist.
                         ;;  query-map {:select [:*]
                         ;;             :limit page_size
                         ;;             :offset (* (- page 1) page_size)
                         ;;             :from (keyword (format "%s_similar_genes" organ))
                         ;;             :where [:= :queried_ensembl_id queried_ensembl_id]
                         ;;             :order-by [[:PCC :desc]]}
                         query-map (merge query-map {:limit page_size
                                                     :offset (* (- page 1) page_size)
                                                     :from (keyword (format "%s_similar_genes" organ))})
                         dbpath (qd/get-db-path dataset)]
                     (log/info "database:" dbpath "query-map:" query-map)
                     (ok {:total (qd/get-total dbpath query-map)
                          :page page
                          :page_size page_size
                          :data (qd/get-results dbpath query-map)}))
                   (catch Exception e
                     (log/error "Error: " e)
                     (get-error-response e))))})

(defn get-datasets
  []
  {:summary "Get datasets"
   :parameters {:query ::ds/DatasetsQueryParams}
   :responses {200 {:body ::ds/DatasetSchema}}
   :handler (fn [{{{:keys [show_details]} :query} :parameters}]
              (if show_details
                (ok (memorized-get-dataset-metadata))
                (ok (gen-dataset-map))))})


(def routes
  [""
   {:swagger {:tags ["Omics Data"]}}

   ["/datasets"
    {:get (get-datasets)}]

   ["/degs"
    {:get  (get-results "Get DEGs" :degs)}]

   ["/genes"
    {:get (fetch-genes "Get Genes")}]

   ["/similar-genes"
    {:get (fetch-similar-genes)}]

   ["/pathways"
    {:get  (get-results "Get Pathways" :pathways)}]])
