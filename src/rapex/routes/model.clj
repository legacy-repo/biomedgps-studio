(ns rapex.routes.model
  (:require [ring.util.http-response :refer [ok not-found bad-request internal-server-error]]
            [rapex.routes.model-specs :as specs]
            [clojure.tools.logging :as log]
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
                           (ok (gnn/predict source_id relation_types :topk (or topk 100))))}}]])
