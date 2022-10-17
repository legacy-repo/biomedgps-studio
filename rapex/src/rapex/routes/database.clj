(ns rapex.routes.database
  (:require [ring.util.http-response :refer [ok not-found bad-request internal-server-error]]
            [rapex.db.query-data :as qd]
            [clojure.tools.logging :as log]
            [rapex.routes.database-specs :as ds]))

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

(defn get-results
  [title dbname]
  {:summary    title
   :parameters {:query ::ds/DBQueryParams}
   :responses  {200 {:body ::ds/DBItems}
                404 {:body ds/database-error-body}
                400 {:body ds/database-error-body}
                500 {:body ds/database-error-body}}
   :handler    (fn [{{{:keys [page page_size query_str]} :query} :parameters
                     {:as headers} :headers}]
                 (try
                   (let [page (or page 1)
                         page_size (or page_size 10)
                         query-map (qd/read-string-as-map query_str)
                         query-map (merge query-map {:limit page_size :offset (* (- page 1) page_size)})
                         dbpath (qd/get-db-path dbname)]
                     (log/info "database:" dbpath "page:" page, "page_size:" page_size, "query-map:" query-map)
                     (ok {:total (qd/get-total dbpath query-map)
                          :page page
                          :page_size page_size
                          :data (qd/get-results dbpath query-map)}))
                   (catch Exception e
                     (log/error "Error: " e)
                     (get-error-response e))))})

(defn fetch-genes
  [title dbname]
  {:summary    title
   :parameters {:query ::ds/DBDataQueryParams}
   :responses  {200 {:body ::ds/DBDataItems}
                404 {:body ds/database-error-body}
                400 {:body ds/database-error-body}
                500 {:body ds/database-error-body}}
   :handler    (fn [{{{:keys [query_str]} :query} :parameters
                     {:as headers} :headers}]
                 (try
                   (let [query-map (qd/read-string-as-map query_str)
                         dbpath (qd/get-db-path dbname)]
                     (log/info "database:" dbpath "query-map:" query-map)
                     (ok {:data (qd/get-results dbpath query-map)}))
                   (catch Exception e
                     (log/error "Error: " e)
                     (get-error-response e))))})


(def routes
  [""
   {:swagger {:tags ["Omics Data"]}}

   ["/omics-data"
    {:get  (get-results "Get Omics Data" "rapex_expr")}]

   ["/degs"
    {:get  (get-results "Get DEGs" "rapex_degs")}]

   ["/genes"
    {:get (fetch-genes "Get Genes" "rapex_genes")}]

   ["/pathways"
    {:get  (get-results "Get Pathways" "rapex_pathway")}]])
