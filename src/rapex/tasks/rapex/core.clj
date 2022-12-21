(ns rapex.tasks.rapex.core
  (:require [rapex.tasks.rapex.boxplot :as boxplot]
            [rapex.tasks.rapex.boxplot-multiple-organs :as boxplot-multiple-organs]
            [rapex.tasks.rapex.barplot :as barplot]
            [rapex.tasks.rapex.barplot-multiple-organs :as barplot-multiple-organs]
            [rapex.tasks.rapex.corrplot :as corrplot]
            [rapex.tasks.rapex.heatmap :as heatmap]
            [ring.util.http-response :refer [ok not-found bad-request internal-server-error]]
            [rapex.db.query-data :as qd]
            [clojure.tools.logging :as log]
            [rapex.tasks.rapex.db-specs :as ds]
            [rapex.tasks.rapex.chart-sepcs :as cs]))

(def chart-manifests [boxplot/manifest
                      boxplot-multiple-organs/manifest
                      barplot/manifest
                      barplot-multiple-organs/manifest
                      corrplot/manifest
                      heatmap/manifest])


(def chart-ui-schemas {:rapex-boxplot boxplot/ui-schema-fn
                       :rapex-boxplot-organs boxplot-multiple-organs/ui-schema-fn
                       :rapex-barplot barplot/ui-schema-fn
                       :rapex-barplot-organs barplot-multiple-organs/ui-schema-fn
                       :rapex-corrplot corrplot/ui-schema-fn
                       :rapex-multiple-genes-comparison heatmap/ui-schema-fn})


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

(def routes
  [""
   {:swagger {:tags ["Visualization for Rapex Omics Dataset"]}}

   ["/chart/rapex-boxplot"
    {:post (boxplot/post-boxplot!)}]

   ["/chart/rapex-boxplot-organs"
    {:post (boxplot-multiple-organs/post-boxplot!)}]

   ["/chart/rapex-barplot"
    {:post (barplot/post-barplot!)}]

   ["/chart/rapex-barplot-organs"
    {:post (barplot-multiple-organs/post-barplot!)}]

   ["/chart/rapex-corrplot"
    {:post (corrplot/post-corrplot!)}]

   ["/chart/rapex-multiple-genes-comparison"
    {:post (heatmap/post-heatmap!)}]

   ["/dataset/rapex-degs"
    {:get  (get-results "Get DEGs" :degs)}]

   ["/dataset/rapex-genes"
    {:get (fetch-genes "Get Genes")}]

   ["/dataset/rapex-similar-genes"
    {:get (fetch-similar-genes)}]

   ["/dataset/rapex-pathways"
    {:get  (get-results "Get Pathways" :pathways)}]])