(ns rapex.tasks.core-specs
  (:require [clojure.spec.alpha :as s]
            [spec-tools.core :as st]))

(s/def ::total
  (st/spec
   {:spec                nat-int?
    :type                :long
    :description         "Total number."
    :swagger/default     1
    :reason              "The total parameter can't be none."}))

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

(s/def ::name
  (st/spec
   {:spec                string?
    :type                :string
    :description         "The name of the chart"
    :swagger/default     ""
    :reason              "Not a valid chart name"}))

(s/def ::description
  (st/spec
   {:spec                string?
    :type                :string
    :description         "Description of the task"
    :swagger/default     ""
    :reason              "Not a valid description."}))

(s/def ::version
  (st/spec
   {:spec                string?
    :type                :string
    :description         "The version of the chart"
    :swagger/default     ""
    :reason              "Not a valid chart version"}))

(s/def ::category
  (st/spec
   {:spec                string?
    :type                :string
    :description         "The category of the chart"
    :swagger/default     ""
    :reason              "Not a valid chart category"}))

(s/def ::home
  (st/spec
   {:spec                string?
    :type                :string
    :description         "The home of the chart"
    :swagger/default     ""
    :reason              "Not a valid chart home"}))

(s/def ::source
  (st/spec
   {:spec                string?
    :type                :string
    :description         "The source of the chart"
    :swagger/default     ""
    :reason              "Not a valid chart source"}))

(s/def ::short_name
  (st/spec
   {:spec                string?
    :type                :string
    :description         "The short_name of the chart"
    :swagger/default     ""
    :reason              "Not a valid chart short_name"}))

(s/def ::icons
  (st/spec
   {:spec                vector?
    :type                :vector
    :description         "The icons of the chart"
    :swagger/default     ""
    :reason              "Not a valid chart icons"}))

(s/def ::author
  (st/spec
   {:spec                string?
    :type                :string
    :description         "The author of the chart"
    :swagger/default     ""
    :reason              "Not a valid chart author"}))

(s/def ::maintainers
  (st/spec
   {:spec                vector?
    :type                :vector
    :description         "The maintainers of the chart"
    :swagger/default     ""
    :reason              "Not a valid chart maintainers"}))

(s/def ::tags
  (st/spec
   {:spec                vector?
    :type                :vector
    :description         "The tags of the chart"
    :swagger/default     ""
    :reason              "Not a valid chart tags"}))

(s/def ::readme
  (st/spec
   {:spec                string?
    :type                :string
    :description         "The readme of the chart"
    :swagger/default     ""
    :reason              "Not a valid chart readme"}))

(s/def ::id
  (st/spec
   {:spec                string?
    :type                :string
    :description         "The id of the chart"
    :swagger/default     ""
    :reason              "Not a valid chart id"}))

(s/def ::chart-item
  (s/keys :req-un [::name ::version ::description ::category
                   ::home ::source ::short_name ::icons
                   ::author ::maintainers ::tags ::readme ::id]))

(s/def ::data
  (s/coll-of ::chart-item))

(def list-chart-response
  (s/keys :req-un [::total ::page ::page_size ::data]))

(s/def ::show_details boolean)

(s/def ::DatasetsQueryParams
  (st/spec
   (s/keys :req-un []
           :opt-un [::show_details])))

(s/def ::key string?)
(s/def ::text string?)

(s/def ::DatasetSchema (s/or :summary (s/coll-of (s/keys :req-un [::key ::text]))
                             :details (s/coll-of map?)))

(s/def ::dataset string?)

(s/def ::MenuParams (s/keys :req-un [::dataset]))

(s/def ::path string?)
(s/def ::name string?)
(s/def ::icon string?)
(s/def ::component string?)
(s/def ::hideInMenu boolean)
(s/def ::redirect string?)
(s/def ::menu-item (s/keys :req-un []
                           :opt-un [::hideInMenu ::path ::name ::routes
                                    ::icon ::component ::redirect]))
(s/def ::routes (s/coll-of ::menu-item))
(s/def ::Menus (s/keys :req-un [::routes]))