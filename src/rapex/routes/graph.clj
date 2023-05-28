(ns rapex.routes.graph
  (:require [ring.util.http-response :refer [ok no-content not-found created
                                             bad-request internal-server-error]]
            [rapex.routes.graph-specs :as specs]
            [clojure.spec.alpha :as s]
            [rapex.db.neo4j.core :as db]
            [clojure.string :as clj-str]
            [rapex.db.query-gdata :as gdb]
            [clojure.tools.logging :as log]
            [rapex.db.query-gdata :as qgd]))

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

   ["/knowledges"
    {:get {:summary     "Get the knowledges from custom curation database."
           :parameters  {:query ::specs/knowledge-query-params}
           :responses   {200 {:body ::specs/DBDataItems}}
           :handler     (fn [{{{:keys [page page_size]} :query} :parameters
                              {:as headers} :headers}]
                          (try
                            (let [page (or page 1)
                                  page_size (or page_size 50)
                                  auth-users (get headers "x-auth-users")
                                  curator (if auth-users (clj-str/split auth-users #",") nil)
                                  results (qgd/get-knowledges curator :page page :page-size page_size)]
                              (log/info "page:" page "page_size:" page_size "curator: " curator)
                              (ok results))
                            (catch Exception e
                              (log/error "Error: " e)
                              (get-error-response e))))}

     :post {:summary     "Create a knowledge."
            :parameters  {:body qgd/custom-knowledge-spec}
            :responses   {200 {:body qgd/custom-knowledge-spec}}
            :handler     (fn [{{{:as payload} :body} :parameters
                               {:as headers} :headers}]
                           (try
                             (log/info "payload:" payload)
                             (let [curator (get headers "x-auth-users")
                                   ;; TODO: How to deal with multiple users?
                                   payload (assoc payload :curator curator)]
                               (log/info "payload:" payload)
                               (ok (qgd/create-knowledge! payload)))
                             (catch Exception e
                               (log/error "Error: " e)
                               (get-error-response e))))}}]

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
                                 query-map (gdb/read-string-as-map query_str)
                                 query-map (merge query-map {:limit page_size
                                                             :offset (* (- page 1) page_size)
                                                             :from (keyword (to-snake-case label_type))})]
                             (log/info "query-map:" query-map)
                             (ok {:total (gdb/get-total query-map)
                                  :page page
                                  :page_size page_size
                                  :data (gdb/get-results query-map)}))
                           (catch Exception e
                             (log/error "Error: " e)
                             (get-error-response e))))}}]

   ["/relationships"
    {:get {:summary    "Query the relationships"
           :parameters {:query ::specs/RelationshipsQueryParams}
           :responses  {200 {:body ::specs/DBDataItems}
                        404 {:body specs/database-error-body}
                        400 {:body specs/database-error-body}
                        500 {:body specs/database-error-body}}
           :handler    (fn [{{{:keys [page page_size query_str
                                      only_total disable_total]} :query} :parameters
                             {:as headers} :headers}]
                         (try
                           (let [page (or page 1)
                                 page_size (or page_size 100)
                                 query-map (gdb/read-string-as-map query_str)
                                 query-map (merge query-map {:limit page_size
                                                             :offset (* (- page 1) page_size)
                                                             :from :relationships})]
                             (log/info "query-map:" query-map)
                             (if (= only_total "true")
                               (ok {:total (gdb/get-total query-map)})
                               (if (= disable_total "true")
                                 (ok {:data (gdb/get-results query-map)})
                                 (ok {:total (gdb/get-total query-map)
                                      :page page
                                      :page_size page_size
                                      :data (gdb/get-results query-map)}))))
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
                                                     :select [:*]}]
                             (log/info "node-stat-query-map:" node-stat-query-map "rel-stat-query-map:" rel-stat-query-map)
                             (ok {:node_stat (gdb/get-results node-stat-query-map)
                                  :relationship_stat (gdb/get-results rel-stat-query-map)}))
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
             :parameters {:body specs/nodes-query-spec}
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
                           [{{{:keys [query_map source_id relation_types target_ids topk enable_prediction]} :body} :parameters}]
                           (try
                             (log/info "Graph Query Map: " query_map)
                             (log/info "Prediction Payload" source_id relation_types target_ids topk enable_prediction)
                             (ok (gdb/query&predict query_map {:source_id source_id
                                                               :relation_types relation_types
                                                               :target_ids target_ids
                                                               :topk topk
                                                               :enable_prediction enable_prediction}))
                             (catch Exception e
                               (log/error "Error: " e)
                               (get-error-response e))))}}]])
