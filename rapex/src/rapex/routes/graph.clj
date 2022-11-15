(ns rapex.routes.graph
  (:require [ring.util.http-response :refer [ok no-content not-found bad-request internal-server-error]]
            [rapex.routes.graph-specs :as specs]
            [clojure.spec.alpha :as s]
            [rapex.db.neo4j.core :as db]
            [rapex.db.query-data :as qd]
            [rapex.routes.database-specs :as ds]
            [rapex.db.query-gdata :as gdb]
            [clojure.tools.logging :as log]))

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

   ["/node-types"
    {:get  {:summary    "Get the type of all nodes."
            :parameters {}
            :responses  {200 {:body specs/node-types-resp-spec}}
            :handler    (fn [{{:as headers} :headers}]
                          (log/info "Get the type of all nodes from Neo4j database...")
                          (with-open [session (db/get-session @gdb/gdb-conn)]
                            (ok {:node_types (gdb/list-labels session)})))}}]

   ["/relationship-types"
    {:get  {:summary    "Get the type of all relationships."
            :parameters {}
            :responses  {200 {:body specs/relationship-types-resp-spec}}
            :handler    (fn [{{:as headers} :headers}]
                          (log/info "Get the type of all relationships from Neo4j database...")
                          (with-open [session (db/get-session @gdb/gdb-conn)]
                            (ok {:relationship_types (gdb/list-relationships session)})))}}]

   ["/node-properties"
    {:get  {:summary    "Get the properties of node(s)."
            :parameters {:query specs/node-properties-query-spec}
            :responses  {200 {:body specs/node-properties-resp-spec}}
            :handler    (fn [{{{:keys [node_name]} :query} :parameters
                              {:as headers} :headers}]
                          (log/info "Get the properties of node(s) from Neo4j database...")
                          (with-open [session (db/get-session @gdb/gdb-conn)]
                            (ok {:properties (gdb/list-properties session :node-name node_name)})))}}]

   ["/nodes"
    {:get  {:summary    "Get the nodes which matched the query conditions."
            :parameters {:query {:query_str string?}}
            :responses  {200 {:body {:nodes (s/coll-of any?)
                                     :edges (s/coll-of any?)}}
                         404 {:body ds/database-error-body}
                         400 {:body ds/database-error-body}
                         500 {:body ds/database-error-body}}
            :handler    (fn [{{{:keys [query_str]} :query} :parameters}]
                          "An example of query string
                           {:match \"(n)-[r]-(m)\"
                            :return \"n, r, m\"
                            :where (format \"id(n) = %s\" id)
                            :limit 10}"
                          (try
                            (log/info "Get the nodes which matched the query conditions")
                            (with-open [session (db/get-session @gdb/gdb-conn)]
                              (let [r (gdb/query-gdb session (qd/read-string-as-map query_str))]
                                (ok (if (empty? r)
                                      {:nodes []
                                       :edges []}
                                      r))))
                            (catch Exception e
                              (log/error "Error: " e)
                              (get-error-response e))))}}]])
