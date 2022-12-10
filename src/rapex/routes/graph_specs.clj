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
