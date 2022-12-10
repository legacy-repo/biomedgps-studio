(ns rapex.routes.database-specs
  (:require [clojure.spec.alpha :as s]
            [spec-tools.core :as st]
            [rapex.tasks.common-sepcs :as cs]))

;; More Details for `:type`: https://cljdoc.org/d/metosin/spec-tools/0.6.1/doc/readme#type-based-conforming
(s/def ::dataset
  (st/spec
   {:spec                (s/and string? #(some? (re-matches #"[0-9]+" %)))  ;; such as 00000000
    :description         "Dataset id."
    :swagger/default     "000000"
    :swagger/type        "string"
    :reason              "Not a valid dataset id."}))

(s/def ::query_str
  (st/spec
   {:spec                string?
    :description         "Query string with honeysql specification."
    :swagger/default     "{:select [:*] :from :xxx}"
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

(s/def ::DBQueryParams
  (st/spec
   (s/keys :req-un [::query_str]
           :opt-un [::page ::page_size ::dataset])))

(s/def ::DBDataQueryParams
  (st/spec
   (s/keys :req-un [::query_str]
           :opt-un [::dataset ::page ::page_size])))

(s/def ::queried_ensembl_id
  (st/spec
   {:spec                string?
    :type                :string
    :description         "Ensembl id for querying similar genes."
    :swagger/default     "ENSMUSG00000001"
    :reason              "The ensembl id is invalid."}))

(s/def ::organ
  (st/spec
   {:spec                cs/organ-sets
    :type                :string
    :description         "Organ name."
    :swagger/default     (first cs/organ-sets)
    :reason              "The organ name is invalid"}))

(s/def ::SimilarGenesQueryParams
  (st/spec
   (s/keys :req-un [::query_str]
           :opt-un [::page ::page_size ::dataset ::organ])))

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

(s/def ::DBItems
  (st/spec
   (s/keys :req-un [::page ::page_size ::data ::total ::data]
           :opt-un [])))

(s/def ::DBDataItems
  (st/spec
   (s/keys :req-un [::data]
           :opt-un [])))

(s/def ::key string?)
(s/def ::text string?)

(s/def ::DatasetSchema (s/or :summary (s/coll-of (s/keys :req-un [::key ::text]))
                             :details (s/coll-of map?)))

(def database-error-body
  "A spec for the body."
  (s/keys :req-un [::context ::msg]
          :opt-un []))


(s/def ::show_details boolean)

(s/def ::DatasetsQueryParams
  (st/spec
   (s/keys :req-un []
           :opt-un [::show_details])))