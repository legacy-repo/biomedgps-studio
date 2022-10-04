(ns rapex.db.handler
  (:require
   [clojure.spec.alpha :as s]
   [clojure.data.json :as json]
   [clojure.test :refer [function?]]
   [rapex.db.core :as db]
   [clojure.tools.logging :as log]
   [rapex.util :as util]))

;; -------------------------------- Spec --------------------------------
;; Where Map
(s/def ::query-map map?)
(s/def ::where-clause any?)
(s/def ::where-map (s/keys :opt-un [::query-map ::where-clause]))

;; Function Map
(s/def ::query-func function?)
(s/def ::count-func function?)
(s/def ::func-map (s/keys :req-un [::query-func ::count-func]))

;; Searching Results
(s/def ::page number?)
(s/def ::page_size number?)
(s/def ::total number?)
(s/def ::offset number?)
(s/def ::id (or string? number?))
(s/def ::data any?)
(s/def ::search-results (s/keys :req-un [::total ::page ::page_size ::data]))

;; Task Record
(s/def ::name string?)
(s/def ::description string?)
(s/def ::payload (s/or :map map? :string string?))
(s/def ::plugin-name string?)
(s/def ::plugin-version string?)
(s/def ::plugin-type string?)
(s/def ::response (s/or :map map? :string string?))
(s/def ::started-time integer?)
(s/def ::finished-time (s/nilable integer?))
(s/def ::owner string?)
(s/def ::status string?)
(s/def ::percentage integer?)
(s/def ::task (s/keys :req-un [::name ::plugin-name ::plugin-version ::plugin-type]
                      :opt-un [::id ::description ::payload ::owner ::response ::finished-time ::started-time ::status ::percentage]))

;; ----------------------------- Function -------------------------------
(defn- filter-query-map
  "Filter unqualified attribute or value.

   Change Log:
   1. Fix bug: PSQLException
      `filter-query-map` need to return nil when query-map is nil
  "
  [query-map]
  {:pre [(or (s/valid? map? query-map) (s/valid? nil? query-map))]
   :post [(or (s/valid? map? %) (s/valid? nil? %))]}
  (let [query-map (into {} (filter (comp some? val) query-map))]
    (if (empty? query-map)
      nil
      query-map)))

(defn make-where-clause
  [table-name query-map & more]
  (let [clauses (map (fn [key] [:is (keyword (str table-name "." (name key))) (get query-map key)])
                     (keys (filter-query-map query-map)))
        all (concat clauses more)]
    (if (> (count all) 1)
      (cons :and all)
      (first all))))

(defn- page->offset
  "Tranform page to offset."
  [page page-size]
  {:pre [(s/valid? ::page page)
         (s/valid? ::page_size page-size)]
   :post [(s/valid? ::offset %)]}
  (* (- page 1) page-size))

(defn- make-query-map
  [where-map]
  {:pre [(s/valid? ::where-map where-map)]
   :post [(s/valid? ::where-map where-map)]}
  (-> where-map
      (assoc :query-map (filter-query-map (:query-map where-map)))
      (assoc :where-clause (:where-clause where-map))))

(defn- search-entities
  "Query database using query-map, page and page-size.
   
   Arguments:
     func-map[map]: query and count function from the specified database.
     page[number]: which page?
     page-size[number]: how many items in one page?
     where-map[map]: query map.

   Examples:
     (search-entities {:query-func db/search-tasks
                       :count-func db/count-tasks}
                      {:query-map {:id \"XXXX\"}}
                      1 10)
  "
  ([func-map] (search-entities func-map nil 1 10))
  ([func-map page] (search-entities func-map nil page 10))
  ([func-map page page-size] (search-entities func-map nil page page-size))
  ([func-map where-map page page-size]
   {:pre [(s/valid? ::func-map func-map)
          (s/valid? ::where-map where-map)
          (s/valid? ::page page)
          (s/valid? ::page_size page-size)]
    :post [(s/valid? ::search-results %)]}
   (let [page     (if (nil? page) 1 page)
         page-size (if (nil? page-size) 10 page-size)
         params   {:limit  page-size
                   :offset (page->offset page page-size)}
         params   (merge params (make-query-map where-map))
         metadata {:total     (or (:count ((:count-func func-map) params)) 0)
                   :page      page
                   :page_size page-size}]
     (log/debug "Query db by: " params, (merge metadata {:data ((:query-func func-map) params)}))
     (merge metadata {:data ((:query-func func-map) params)}))))

(defn- search-entity
  [func-map id]
  {:pre [(s/valid? ::func-map func-map)
         (s/valid? ::id id)]
   :post [(s/valid? map? %)]}
  (let [data   (:data (search-entities func-map {:query-map {:id id}} 1 10))
        record (first data)]
    (if record
      record
      {})))

(defn- update-entity!
  "Update record using the specified function."
  [func id record]
  {:pre [(s/valid? function? func)
         (s/valid? ::id id)
         (s/valid? map? record)]}
  (when record
    (func {:updates record
           :id      id})))

;; --------------------- Task Record ---------------------
(def search-tasks
  (partial
   search-entities
   {:query-func db/search-tasks
    :count-func db/count-tasks}))

(defn convert-record
  [record]
  (-> record
      (assoc :response (json/read-str (:response record)))
      (assoc :payload (json/read-str (:payload record)))))

(defn convert-records
  [results]
  (assoc results :data (map convert-record (:data results))))

(def search-task
  (partial
   search-entity
   {:query-func db/search-tasks
    :count-func db/count-tasks}))

(defn get-task-count
  [where-map]
  (db/count-tasks (make-query-map where-map)))

(defn update-task!
  [record]
  {:pre [(s/valid? map? record)]}
  (update-entity! db/update-task! (:id record) (dissoc record :id)))

(defn delete-task!
  [id]
  {:pre [(s/valid? ::id id)]}
  (db/delete-task! {:id id}))

(defn create-task!
  [{:keys [id
           name
           description
           payload
           owner
           plugin-name
           plugin-version
           plugin-type
           response
           started-time
           finished-time
           status
           percentage]
    :or {id (util/uuid)
         description ""
         payload {}
         response {}
         started-time (util/time->int (util/now))
         finished-time nil
         status "Started"
         percentage 0}
    :as task}]
  {:pre [(s/valid? ::task task)]
   :post [(s/valid? ::id %)]}
  (println "Create Task: %s" task)
  (db/create-task! {:id id
                    :name name
                    :description description
                    :payload (json/write-str payload)
                    :owner owner
                    :plugin_name plugin-name
                    :plugin_version plugin-version
                    :plugin_type plugin-type
                    :response (json/write-str response)
                    :started_time started-time
                    :finished_time finished-time
                    :status status
                    :percentage percentage})
  id)
