(ns rapex.routes.core-specs
  (:require [clojure.spec.alpha :as s]
            [spec-tools.core :as st]))

(s/def ::version
  (st/spec {:spec            string?
            :description     "Version of rapex instance."
            :swagger/default "0.6.0-1-39ac444-SNAPSHOT"
            :swagger/type    "string"
            :reason          "Version number is not valid."}))

(s/def ::id
  (st/spec {:spec            number?
            :type            :number
            :description     "Migration Id."
            :swagger/default 2021081501
            :reason          "Migration id is not valid."}))

(s/def ::applied
  (st/spec {:spec            string?
            :description     "Applied Id."
            :swagger/default "1631880547270"
            :swagger/type    "string"
            :reason          "Applied id is not valid."}))

(s/def ::description
  (st/spec {:spec            string? 
            :description     "The description of database migration."
            :swagger/default "init-tables"
            :swagger/type    "string"
            :reason          "The description is not valid."}))

(def db-version
  "A spec for the db version."
  (s/keys :req-un [::id ::applied ::description]
          :opt-un []))

(s/def ::db_version (s/coll-of db-version))

(def instance-version
  "A spec for the version"
  (s/keys :req-un [::version ::db_version]
          :opt-un []))

(s/def ::filelink
  (st/spec
   {:spec                #(some? (re-matches #"^\/.*" %))
    :description         "File link, such as /40644dec-1abd-489f-a7a8-1011a86f40b0/log"
    :swagger/default     ""
    :swagger/type        "string"
    :reason              "The filelink must be a string."}))

(def filelink-params-query
  "A spec for the query parameters of the download endpoint."
  (s/keys :req-un [::filelink]
          :opt-un []))
