(ns rapex.routes.task-specs
  (:require [clojure.spec.alpha :as s]
            [spec-tools.core :as st]))

;; More Details for `:type`: https://cljdoc.org/d/metosin/spec-tools/0.6.1/doc/readme#type-based-conforming
(s/def ::id
  (st/spec
   {:spec                #(some? (re-matches #"[a-f0-9]{8}(-[a-f0-9]{4}){4}[a-f0-9]{8}" %))
    :description         "Task ID"
    :swagger/default     "40644dec-1abd-489f-a7a8-1011a86f40b0"
    :swagger/type        "string"
    :reason              "Not valid a task id"}))

(s/def ::page
  (st/spec
   {:spec                nat-int?
    :type                :long
    :description         "Page, From 1."
    :swagger/default     1
    :reason              "The page parameter can't be none."}))

(s/def ::page_size
  (st/spec
   {:spec                nat-int?
    :type                :long
    :description         "Num of items per page."
    :swagger/default     10
    :reason              "The page_size parameter can't be none."}))

;; -------------------------------- Task Spec --------------------------------
(s/def ::name
  (st/spec
   {:spec                string?
    :description         "The name of the plugin"
    :swagger/default     ""
    :swagger/type        "string"
    :reason              "Not a valid plugin name"}))

(s/def ::description
  (st/spec
   {:spec                string?
    :description         "Description of the task"
    :swagger/default     ""
    :swagger/type        "string"
    :reason              "Not a valid description."}))

(s/def ::payload
  (st/spec
   {:spec                map?
    :type                :map
    :description         "Payload of the task"
    :swagger/default     ""
    :reason              "Not a valid payload"}))

(s/def ::owner
  (st/spec
   {:spec                #(re-find #"^.*$" %) 
    :description         "Owner name that you want to query."
    :swagger/default     "huangyechao"
    :swagger/type        "string"
    :reason              "Not a valid owner name, regex: '^[a-zA-Z_][a-zA-Z0-9_]{4,31}$'."}))

(s/def ::plugin_name
  (st/spec
   {:spec                string?
    :description         "The name of the plugin"
    :swagger/default     ""
    :swagger/type        "string"
    :reason              "Not a valid plugin name"}))

(s/def ::plugin_type
  (st/spec
   {:spec                (or #(some? (re-matches #"[A-Za-z_\-]+" %)) #{"ReportPlugin" "StatPlugin" "DataPlugin" "ToolPlugin", "ChartPlugin"})
    :description         "Filter tasks by plugin_type field."
    :swagger/default     "ReportPlugin"
    :swagger/type        "string"
    :reason              "Not valid plugin-type, only support `ReportPlugin`, `StatPlugin`, `DataPlugin`, `ToolPlugin`, `ChartPlugin` or your customized type."}))

(s/def ::plugin_version
  (st/spec
   {:spec                string?
    :description         "The version of the plugin"
    :swagger/default     ""
    :swagger/type        "string"
    :reason              "Not a valid plugin version"}))

(s/def ::response
  (st/spec
   {:spec                map?
    :type                :map
    :description         "Response of the task"
    :swagger/default     ""
    :reason              "Not a valid response"}))

(s/def ::started_time
  (st/spec
   {:spec                nat-int?
    :type                :integer
    :description         "Started time of the record"
    :swagger/default     ""
    :reason              "Not a valid started_time"}))

(s/def ::finished_time
  (st/spec
   {:spec                nat-int?
    :type                :integer
    :description         "Finished time of the record"
    :swagger/default     ""
    :reason              "Not a valid finished_time"}))

(s/def ::status
  (st/spec
   {:spec                #{"Started" "Finished" "Failed"}
    :type                :set
    :description         "Filter results by status field."
    :swagger/default     "Started"
    :reason              "Not valid status, only support Started, Finished, Archived, Failed."}))

(s/def ::percentage
  (st/spec
   {:spec                int?
    :type                :long
    :description         "Percentage, From 0."
    :swagger/default     0
    :reason              "The percentage parameter can't be none."}))

(def task-id
  (s/keys :req-un [::id]
          :opt-un []))

(def task-params-query
  "A spec for the query parameters."
  (s/keys :req-un []
          :opt-un [::page ::page_size ::owner ::plugin_type ::status ::plugin_name]))

(def task-body
  "A spec for the task body."
  (s/keys :req-un [::name ::plugin_name ::plugin_type ::plugin_version]
          :opt-un [::description ::payload ::owner ::response ::started_time ::finished_time ::status ::percentage]))
