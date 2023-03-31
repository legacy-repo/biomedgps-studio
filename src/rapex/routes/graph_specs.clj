(ns rapex.routes.graph-specs
  (:require [clojure.spec.alpha :as s]
            [spec-tools.core :as st]))

;; More Details for `:type`: https://cljdoc.org/d/metosin/spec-tools/0.6.1/doc/readme#type-based-conforming
(s/def ::node_types
  (st/spec
   {:spec                (s/coll-of string?)
    :description         "Labels"
    :swagger/default     []
    :swagger/type        "array"
    :reason              "Not a valid node types"}))

(s/def ::relationship_types
  (st/spec
   {:spec                (s/coll-of string?)
    :description         "Labels"
    :swagger/default     []
    :swagger/type        "array"
    :reason              "Not a valid relationship types"}))

(s/def ::node_name
  (st/spec
   {:spec                string?
    :description         "Node name"
    :swagger/default     []
    :swagger/type        "string"
    :reason              "Not a valid node name"}))

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

(s/def ::required
  (st/spec
   {:spec                boolean?
    :type                :bool
    :description         "Is required?"
    :swagger/default     true
    :reason              "Not a valid boolean value."}))

(s/def ::node_name
  (st/spec
   {:spec                string?
    :type                :string
    :description         "Node name"
    :swagger/default     ""
    :reason              "Not a valid node name."}))

(s/def ::node_type
  (st/spec
   {:spec                string?
    :type                :string
    :description         "Node type"
    :swagger/default     ""
    :reason              "Not a valid node type"}))

(s/def ::attribute
  (st/spec
   {:spec                string?
    :type                :string
    :description         "Node's attribute name"
    :swagger/default     ""
    :reason              "Not a valid attribute name"}))

(s/def ::attribute_type
  (st/spec
   {:spec                map?
    :type                :map
    :description         "Node's attribute type"
    :swagger/default     {}
    :reason              "Not a valid attribute type"}))

;; -------------------------------- Spec --------------------------------
(def node-types-resp-spec
  (s/keys :req-un []
          :opt-un [::node_types]))

(def relationship-types-resp-spec
  (s/keys :req-un []
          :opt-un [::relationship_types]))

(s/def ::property
  (s/keys :req-un [::required ::node_name ::node_type ::attribute ::attribute_type]
          :opt-un []))

(s/def ::properties (s/map-of string? (s/coll-of ::property)))

(def node-properties-resp-spec
  (s/keys :req-un []
          :opt-un [::properties]))

(def node-properties-query-spec
  (s/keys :req-un []
          :opt-un [::node_name]))


;; More Details for `:type`: https://cljdoc.org/d/metosin/spec-tools/0.6.1/doc/readme#type-based-conforming
(s/def ::label_type
  (st/spec
   {:spec                (s/and string? #(some? (re-matches #"[0-9A-Za-z]+" %)))  ;; such as 00000000
    :description         "Label type."
    :swagger/default     "Gene"
    :swagger/type        "string"
    :reason              "Not a valid label type."}))

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

(s/def ::DBQueryParams
  (st/spec
   (s/keys :req-un [::query_str ::label_type]
           :opt-un [::page ::page_size])))

(s/def ::DBItems
  (st/spec
   (s/keys :req-un [::page ::page_size ::data ::total]
           :opt-un [])))

(s/def ::DBDataItems
  (st/spec
   (s/keys :req-un [::data]
           :opt-un [])))

(def database-error-body
  "A spec for the body."
  (s/keys :req-un [::context ::msg]
          :opt-un []))

(s/def ::source_id
  (st/spec
   {:spec                string?
    :type                :string
    :description         "Soure id"
    :swagger/type        "string"
    :swagger/default     ""
    :reason              "The source_id parameter can't be none."}))

(s/def ::relation_types
  (st/spec
   {:spec                (s/coll-of string?)
    :type                :array
    :description         "Relation types"
    :swagger/type        "array"
    :swagger/default     []
    :reason              "The relation_types parameter can't be none."}))

(s/def ::topk
  (st/spec
   {:spec                nat-int?
    :type                :long
    :description         "Topk"
    :swagger/default     10
    :reason              "The topk parameter can't be none."}))

(s/def ::enable_prediction
  (st/spec
   {:spec                boolean?
    :type                :boolean
    :description         "Enable prediction"
    :swagger/default     true
    :reason              "The enable_prediction parameter can't be none."}))

(def nodes-query-spec
  (s/keys :req-un []
          :opt-un [::source_id ::relation_types ::topk ::enable_prediction]))