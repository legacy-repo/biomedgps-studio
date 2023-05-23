(ns rapex.routes.model
  (:require [ring.util.http-response :refer [ok not-found bad-request internal-server-error]]
            [rapex.routes.model-specs :as specs]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]
            [rapex.db.query-gdata :as query-gdb]
            [rapex.models.gnn :as gnn]))

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

(def routes
  [""
   {:swagger {:tags ["Knowledge Graph"]}}

   ["/relations"
    {:post  {:summary    "Get the predicted relations of one node."
             :parameters {:body specs/query-relations-spec}
             :responses  {201 {:body any?}
                          404 {:body any?}
                          400 {:body any?}
                          500 {:body any?}}
             :handler    (fn [{{{:keys [source_id relation_types topk]} :body} :parameters}]
                           (log/debug source_id relation_types topk)
                           (ok (gnn/predict source_id relation_types :topk (or topk 100))))}}]

   ["/dimension"
    {:post  {:summary    "Get the dimension of the embedding."
             :parameters {:body specs/query-similarity-spec}
             :responses  {200 {:body {:data any?}}
                          404 {:body any?}
                          400 {:body any?}
                          500 {:body any?}}
             :handler    (fn [{{{:keys [source_type source_id topk target_ids target_types]} :body} :parameters}]
                           (log/debug "Get the nearest neighbor nodes: " source_type source_id topk target_ids target_types)
                           (try
                             (let [results (if (and source_type source_id target_ids target_types)
                                             (do
                                               (when (not= (count target_ids) (count target_types))
                                                 (throw (Exception. "The number of target_ids and target_types should be the same.")))
                                               (gnn/dim-reduction source_type source_id target_types target_ids))
                                             (throw (Exception. "Invalid parameters.")))]
                               (ok results))
                             (catch Exception e
                               (log/error e)
                               (get-error-response e))))}}]

   ["/similarity"
    {:post  {:summary    "Get the nearest neighbor nodes."
             :parameters {:body specs/query-similarity-spec}
             :responses  {200 {:body any?}
                          404 {:body any?}
                          400 {:body any?}
                          500 {:body any?}}
             :handler    (fn [{{{:keys [source_type source_id topk target_ids target_types]} :body} :parameters}]
                           (log/debug "Get the nearest neighbor nodes: " source_type source_id topk target_ids target_types)
                           (try
                             (let [results (cond (and source_type source_id target_ids target_types)
                                                 (do
                                                   (when (not= (count target_ids) (count target_types))
                                                     (throw (Exception. "The number of target_ids and target_types should be the same.")))
                                                   (query-gdb/evaluate-similarities source_type source_id target_types target_ids))

                                                 (and source_type source_id)
                                                 (query-gdb/find-nearest-neighbors source_type source_id (or topk 100))

                                                 :else
                                                 (throw (Exception. "Invalid parameters.")))]
                               (ok results))
                             (catch Exception e
                               (log/error e)
                               (get-error-response e))))}}]])
