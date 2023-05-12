(ns rapex.routes.graphstore-specs
  (:require [clojure.spec.alpha :as s]
            [spec-tools.core :as st]))

;; More Details for `:type`: https://cljdoc.org/d/metosin/spec-tools/0.6.1/doc/readme#type-based-conforming
(s/def ::id
  (st/spec
   {:spec                #(some? (re-matches #"[a-f0-9]{8}(-[a-f0-9]{4}){4}[a-f0-9]{8}" %))
    :description         "Graph ID"
    :swagger/default     "40644dec-1abd-489f-a7a8-1011a86f40b0"
    :swagger/type        "string"
    :reason              "Not valid a graph id"}))

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

;; -------------------------------- Graph Spec --------------------------------
(s/def ::name
  (st/spec
   {:spec                string?
    :description         "The name of the graph"
    :swagger/default     ""
    :swagger/type        "string"
    :reason              "Not a valid graph name"}))

(s/def ::description
  (st/spec
   {:spec                string?
    :description         "Description of the graph"
    :swagger/default     ""
    :swagger/type        "string"
    :reason              "Not a valid description."}))

(s/def ::payload
  (st/spec
   {:spec                map?
    :type                :map
    :description         "Payload of the graph"
    :swagger/default     ""
    :reason              "Not a valid payload"}))

(s/def ::owner
  (st/spec
   {:spec                #(re-find #"^.*$" %)
    :description         "Owner name that you want to query."
    :swagger/default     "huangyechao"
    :swagger/type        "string"
    :reason              "Not a valid owner name, regex: '^[a-zA-Z_][a-zA-Z0-9_]{4,31}$'."}))

(s/def ::db_version
  (st/spec
   {:spec                string?
    :description         "The version of the graph database"
    :swagger/default     ""
    :swagger/type        "string"
    :reason              "Not a valid version of the graph database"}))

(s/def ::version
  (st/spec
   {:spec                string?
    :description         "The version of the rapex instance."
    :swagger/default     ""
    :swagger/type        "string"
    :reason              "Not a valid version of the rapex instance."}))

(s/def ::created_time
  (st/spec
   {:spec                nat-int?
    :type                :integer
    :description         "Creation time of the record"
    :swagger/default     ""
    :reason              "Not a valid created_time"}))

(s/def ::parent
  (st/spec
   {:spec                #(some? (re-matches #"[a-f0-9]{8}(-[a-f0-9]{4}){4}[a-f0-9]{8}" %))
    :description         "Parent graph ID"
    :swagger/default     ""
    :swagger/type        "string"
    :reason              "Not valid a graph id"}))

(def graph-id
  (s/keys :req-un [::id]
          :opt-un []))

(def graph-params-query
  "A spec for the query parameters."
  (s/keys :req-un []
          :opt-un [::page ::page_size ::owner ::db_version ::version]))

(def graph-body
  "A spec for the task body."
  (s/keys :req-un [::name]
          :opt-un [::description ::payload ::owner ::created_time ::db_version ::version ::parent]))
