(ns rapex.routes.graph
  (:require [ring.util.http-response :refer [ok no-content not-found bad-request internal-server-error]]
            [rapex.routes.graph-specs :as specs]
            [clojure.spec.alpha :as s]
            [rapex.db.neo4j.core :as db]
            [rapex.db.query-data :as qd]
            [clojure.string :as clj-str]
            [rapex.db.query-gdata :as gdb]
            [rapex.config :refer [get-datadir]]
            [clojure.tools.logging :as log]))

(defn to-snake-case
  [s]
  (-> s
      (clj-str/replace #"[^a-zA-Z0-9]+" " ")
      (clj-str/split #" ")
      ((fn [s] (map clj-str/lower-case s)))
      ((fn [s] (interpose "_" s)))
      ((fn [s] (apply str s)))))

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

   ["/labels"
    {:get {:summary    "Query the labels."
           :parameters {:query ::specs/DBQueryParams}
           :responses  {200 {:body ::specs/DBDataItems}
                        404 {:body specs/database-error-body}
                        400 {:body specs/database-error-body}
                        500 {:body specs/database-error-body}}
           :handler    (fn [{{{:keys [page page_size query_str label_type]} :query} :parameters
                             {:as headers} :headers}]
                         (try
                           (let [page (or page 1)
                                 page_size (or page_size 50)
                                 query-map (qd/read-string-as-map query_str)
                                 query-map (merge query-map {:limit page_size
                                                             :offset (* (- page 1) page_size)
                                                             :from (keyword (to-snake-case label_type))})
                                 dbpath (qd/get-db-path "graph_metadata" :datadir (get-datadir))]
                             (log/info "database:" dbpath "query-map:" query-map)
                             (ok {:total (qd/get-total dbpath query-map)
                                  :page page
                                  :page_size page_size
                                  :data (qd/get-results dbpath query-map)}))
                           (catch Exception e
                             (log/error "Error: " e)
                             (get-error-response e))))}}]

   ["/relationships"
    {:get {:summary    "Query the relationships"
           :parameters {:query ::specs/DBQueryParams}
           :responses  {200 {:body ::specs/DBDataItems}
                        404 {:body specs/database-error-body}
                        400 {:body specs/database-error-body}
                        500 {:body specs/database-error-body}}
           :handler    (fn [{{{:keys [page page_size query_str]} :query} :parameters
                             {:as headers} :headers}]
                         (try
                           (let [page (or page 1)
                                 page_size (or page_size 50)
                                 query-map (qd/read-string-as-map query_str)
                                 query-map (merge query-map {:limit page_size
                                                             :offset (* (- page 1) page_size)
                                                             :from :relationships})
                                 dbpath (qd/get-db-path "graph_metadata" :datadir (get-datadir))]
                             (log/info "database:" dbpath "query-map:" query-map)
                             (ok {:total (qd/get-total dbpath query-map)
                                  :page page
                                  :page_size page_size
                                  :data (qd/get-results dbpath query-map)}))
                           (catch Exception e
                             (log/error "Error: " e)
                             (get-error-response e))))}}]

   ["/statistics"
    {:get {:summary    "Query the statistics table."
           :parameters {}
           :responses  {200 {:body ::specs/DBStatDataItems}
                        404 {:body specs/database-error-body}
                        400 {:body specs/database-error-body}
                        500 {:body specs/database-error-body}}
           :handler    (fn [_]
                         (try
                           (let [node-stat-query-map {:from :graph_node_metadata
                                                      :select [:*]}
                                 rel-stat-query-map {:from :graph_relationship_metadata
                                                     :select [:*]}
                                 dbpath (qd/get-db-path "graph_metadata" :datadir (get-datadir))]
                             (log/info "database:" dbpath "node-stat-query-map:" node-stat-query-map "rel-stat-query-map:" rel-stat-query-map)
                             (ok {:node_stat (qd/get-results dbpath node-stat-query-map)
                                  :relationship_stat (qd/get-results dbpath rel-stat-query-map)}))
                           (catch Exception e
                             (log/error "Error: " e)
                             (get-error-response e))))}}]

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
    {:post  {:summary    "Get the nodes which matched the query conditions."
             :parameters {:query {:query_str string?}
                          :body specs/nodes-query-spec}
             :responses  {200 {:body {:nodes (s/coll-of any?)
                                      :edges (s/coll-of any?)}}
                          404 {:body specs/database-error-body}
                          400 {:body specs/database-error-body}
                          500 {:body specs/database-error-body}}
             :handler    (fn
                           ^{:doc "An example of query string
                                  {:match \"(n)-[r]-(m)\"
                                   :return \"n, r, m\"
                                   :where (format \"id(n) = %s\" id)
                                   :limit 10}"}
                           [{{{:keys [query_str]} :query
                              {:keys [source_id relation_types topk enable_prediction]} :body} :parameters}]
                           (try
                             (log/info (format "Get the nodes which matched the query conditions: %s" query_str))
                             (let [query-map (qd/read-string-as-map query_str)]
                               (log/info "Graph Query Map: " query-map)
                               (log/info "Prediction Payload" source_id relation_types topk enable_prediction)
                               (ok (gdb/query&predict query-map {:source_id source_id
                                                                 :relation_types relation_types
                                                                 :topk topk
                                                                 :enable_prediction enable_prediction})))
                             (catch Exception e
                               (log/error "Error: " e)
                               (get-error-response e))))}}]])
