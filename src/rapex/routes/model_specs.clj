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

(def query-relations-spec
  (s/keys :req-un [::source_id ::relation_types]
          :opt-un [::topk]))