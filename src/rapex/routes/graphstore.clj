(ns rapex.routes.graphstore
  (:require [ring.util.http-response :refer [ok created no-content not-found]]
            [rapex.db.handler :as db-handler]
            [rapex.routes.graphstore-specs :as specs]
            [clojure.string :as clj-str]
            [honey.sql :as sql]
            [clojure.tools.logging :as log]))

(def routes
  [""
   {:swagger {:tags ["GraphStore"]}}

   ["/graphs"
    {:get  {:summary    "Get all stored graphs."
            :parameters {:query specs/graph-params-query}
            :responses  {200 {:body {:total    nat-int?
                                     :page     pos-int?
                                     :page_size pos-int?
                                     :data     any?}}}
            :handler    (fn [{{{:keys [page page_size owner db_version version]} :query} :parameters
                              {:as headers} :headers}]
                          (let [query-map {:owner       owner
                                           :db_version  db_version
                                           :version     version}
                                auth-users (get headers "x-auth-users")
                                owners (if auth-users (clj-str/split auth-users #",") nil)
                                where-clause (db-handler/make-where-clause "rapex-graph"
                                                                           query-map
                                                                           [:in :rapex-graph.owner owners])
                                query-clause (if owners
                                               {:where-clause
                                                (sql/format {:where where-clause})}
                                               {:query-map query-map})]
                            (log/info "page: " page, "page_size: " page_size, "query-map: " query-clause)
                            (ok (db-handler/convert-records
                                 (db-handler/search-graphs query-clause
                                                           (or page 1)
                                                           (or page_size 10))))))}

     :post {:summary    "Create a graph."
            :parameters {:body specs/graph-body}
            :responses  {201 {:body specs/graph-id}}
            :handler    (fn [{{:keys [body]} :parameters
                              {:as headers} :headers}]
                          (log/info "Create a graph: " body)
                          (let [auth-user (get headers "x-auth-users")
                                body (assoc body :owner auth-user)
                                id (db-handler/create-graph! body)]
                            (created (str "/graphs/" id)
                                     {:id id})))}}]

   ["/graphs/:id"
    {:get    {:summary    "Get a graph by id."
              :parameters {:path specs/graph-id}
              :responses  {200 {:body map?}
                           404 {:body {:msg string?}}}
              :handler    (fn [{{{:keys [id]} :path} :parameters}]
                            (log/info "Get graph: " id)
                            (let [resp (db-handler/convert-record (db-handler/search-graph id))]
                              (if (seq (:payload resp))
                                (ok resp)
                                (not-found {:msg (format "Not found the graph: %s" id)}))))}

     :delete {:summary    "Delete a graph."
              :parameters {:path specs/graph-id}
              :responses  {204 nil}
              :handler    (fn [{{{:keys [id]} :path} :parameters}]
                            (db-handler/delete-graph! id)
                            (no-content))}}]])
