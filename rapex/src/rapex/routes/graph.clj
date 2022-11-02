(ns rapex.routes.graph
  (:require [ring.util.http-response :refer [ok no-content not-found]]
            [rapex.routes.graph-specs :as specs]
            [rapex.db.neo4j.core :as db]
            [rapex.db.query-gdata :as gdb]
            [clojure.tools.logging :as log]))

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
                            (ok {:properties (gdb/list-properties session :node_name node_name)})))}}]

   ["/nodes"
    {:get  {:summary    "Get the nodes which matched the query conditions."
            :parameters {}
            :responses  {200 {:body {:nodes any?
                                     :edges any?}}}
            :handler    (fn [{{{:keys []} :query} :parameters}]
                          (log/info "Get the nodes which matched the query conditions")
                          (with-open [session (db/get-session @gdb/gdb-conn)]
                            (ok (gdb/search-node-relationships session 50))))}}]

   ["/nodes/:id"
    {:get  {:summary    "Get the nodes which matched the query conditions."
            :parameters {:path {:id integer?}}
            :responses  {200 {:body {:nodes any?
                                     :edges any?}}}
            :handler    (fn [{{{:keys [id]} :path} :parameters}]
                          (log/info "Get the nodes which matched the query conditions" id)
                          (with-open [session (db/get-session @gdb/gdb-conn)]
                            (ok (gdb/search-node-relationships-by-id session id 10))))}}]])
