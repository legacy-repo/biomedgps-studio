(ns rapex.routes.duckdb-specs
  (:require [clojure.spec.alpha :as s]
            [spec-tools.core :as st]))

;; More Details for `:type`: https://cljdoc.org/d/metosin/spec-tools/0.6.1/doc/readme#type-based-conforming
(s/def ::query_str
  (st/spec
   {:spec                string?
    :description         "Query string with honeysql specification."
    :swagger/default     "{:select [:*] :from :gut_000000_fpkm}"
    :swagger/type        "string"
    :reason              "Not a valid query string."}))

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

(s/def ::DuckDBQueryParams
  (st/spec
   (s/keys :req-un [::query_str]
           :opt-un [::page ::page_size])))

(s/def ::total
  (st/spec
   {:spec                nat-int?
    :type                :long
    :description         "How many records."
    :swagger/default     1
    :reason              "The total parameter can't be none."}))

(s/def ::data
  (st/spec
   {:spec                (s/coll-of map? :into #{})
    :type                :array
    :description         "Records."
    :swagger/type        "array"
    :swagger/default     []
    :reason              "The data parameter can't be none."}))

(s/def ::context
  (st/spec
   {:spec                map?
    :type                :map
    :description         "Error context"
    :swagger/type        "object"
    :swagger/default     []
    :reason              "The context parameter can't be none."}))

(s/def ::msg
  (st/spec
   {:spec                string?
    :type                :string
    :description         "Error message"
    :swagger/type        "string"
    :swagger/default     ""
    :reason              "The msg parameter can't be none."}))

(s/def ::DuckDBItems
  (st/spec
   (s/keys :req-un [::page ::page_size ::data ::total ::data]
           :opt-un [])))

(def duckdb-error-body
  "A spec for the body."
  (s/keys :req-un [::context ::msg]
          :opt-un []))
