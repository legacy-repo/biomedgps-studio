(ns rapex.routes.task
  (:require [ring.util.http-response :refer [ok created no-content]]
            [rapex.db.handler :as db-handler]
            [rapex.routes.task-specs :as specs]
            [clojure.string :as clj-str]
            [honey.sql :as sql]
            [clojure.tools.logging :as log]))

(def routes
  [""
   {:swagger {:tags ["Task"]}}

   ["/tasks"
    {:get  {:summary    "Get tasks."
            :parameters {:query specs/task-params-query}
            :responses  {200 {:body {:total    nat-int?
                                     :page     pos-int?
                                     :page_size pos-int?
                                     :data     any?}}}
            :handler    (fn [{{{:keys [page page_size owner status plugin_type plugin_name]} :query} :parameters
                              {:as headers} :headers}]
                          (let [query-map {:status      status
                                           :owner       owner
                                           :plugin_type plugin_type
                                           :plugin_name plugin_name}
                                auth-users (get headers "x-auth-users")
                                owners (if auth-users (clj-str/split auth-users #",") nil)
                                where-clause (db-handler/make-where-clause "tservice-task"
                                                                           query-map
                                                                           [:in :tservice-task.owner owners])
                                query-clause (if owners
                                               {:where-clause
                                                (sql/format {:where where-clause})}
                                               {:query-map query-map})]
                            (log/info "page: " page, "page_size: " page_size, "query-map: " query-clause)
                            (ok (db-handler/convert-records
                                 (db-handler/search-tasks query-clause
                                                          (or page 1)
                                                          (or page_size 10))))))}

     :post {:summary    "Create an task."
            :parameters {:body specs/task-body}
            :responses  {201 {:body {:message specs/task-id}}}
            :handler    (fn [{{:keys [body]} :parameters}]
                          (log/debug "Create an task: " body)
                          (created (str "/tasks/" (:id body))
                                   {:message (db-handler/create-task! body)}))}}]

   ["/tasks/:id"
    {:get    {:summary    "Get a task by id."
              :parameters {:path specs/task-id}
              :responses  {200 {:body map?}}
              :handler    (fn [{{{:keys [id]} :path} :parameters}]
                            (log/debug "Get task: " id)
                            (ok (db-handler/convert-record (db-handler/search-task id))))}

     :delete {:summary    "Delete a task."
              :parameters {:path specs/task-id}
              :responses  {204 nil}
              :handler    (fn [{{{:keys [id]} :path} :parameters}]
                            (db-handler/delete-task! id)
                            (no-content))}}]])
