(ns rapex.routes.model-specs
  (:require [clojure.spec.alpha :as s]
            [spec-tools.core :as st]))

(s/def ::source_id
  (st/spec
   {:spec                string?
    :description         "Node Id."
    :swagger/default     "MESH:D015673"
    :swagger/type        "string"
    :reason              "Not a valid node id"}))

(s/def ::topk
  (st/spec
   {:spec                pos-int?
    :description         "Top k."
    :swagger/default     100
    :swagger/type        "number"
    :reason              "Not a valid number"}))

(s/def ::relation_types
  (st/spec
   {:spec                (s/coll-of string?)
    :type                :array
    :description         "The type of relations"
    :swagger/default     ["Hetionet::CtD::Compound:Disease",
                          "GNBR::T::Compound:Disease",
                          "DRUGBANK::treats::Compound:Disease"]
    :reason              "Not valid relation types"}))

(s/def ::source_type
  (st/spec
   {:spec                string?
    :description         "Node Type."
    :swagger/default     "Disease, Gene, etc."
    :swagger/type        "string"
    :reason              "Not a valid node type."}))

(s/def ::target_types
  (st/spec
   {:spec                (s/coll-of string?)
    :type                :array
    :description         "The type of target nodes"
    :swagger/default     ["Compound", "Disease"]
    :reason              "Not valid target types"}))

(s/def ::target_ids
  (st/spec
   {:spec                (s/coll-of string?)
    :type                :array
    :description         "The id of target nodes"
    :swagger/default     ["DB00843" "MESH:D015673"]
    :reason              "Not valid target ids"}))

(def query-relations-spec
  (s/keys :req-un [::source_id ::relation_types]
          :opt-un [::topk]))

(def query-similarity-spec
  (s/keys :req-un [::source_id ::source_type]
          :opt-un [::topk ::target_types ::target_ids]))