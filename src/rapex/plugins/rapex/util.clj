(ns rapex.plugins.rapex.util
  (:require [ring.util.http-response :refer [created not-found bad-request internal-server-error]]
            [clojure.tools.logging :as log]
            [clojure.data.json :as json]
            [tservice-core.plugins.util :as util]
            [rapex.config :refer [memorized-get-dataset-metadata memorized-get-version]]
            [tservice-core.plugins.env :refer [update-task! get-workdir create-task! make-remote-link]]
            [tservice-core.tasks.async :refer [publish-event!]]
            [local-fs.core :as fs-lib])
  (:import [java.security MessageDigest]
           [clojure.lang Keyword]
           [java.math BigInteger]))

(defn get-error-response
  [e]
  (let [code (:code (.getData e))]
    (cond
      (= code :not-found) (not-found {:msg (.getMessage e)
                                      :context (.getData e)})
      (= code :bad-request) (bad-request {:msg (.getMessage e)
                                          :context (.getData e)})
      :else (internal-server-error {:msg (.getMessage e)
                                    :context (.getData e)}))))

(defn md5
  [^String s]
  (->> s
       .getBytes
       (.digest (MessageDigest/getInstance "MD5"))
       (BigInteger. 1)
       (format "%032x")))

(defn remove-field
  [coll ^Keyword field]
  (map #(dissoc % field) coll))

(defn string2uuid
  [string]
  (-> (.replaceFirst string
                     "(\\p{XDigit}{8})(\\p{XDigit}{4})(\\p{XDigit}{4})(\\p{XDigit}{4})(\\p{XDigit}+)"
                     "$1-$2-$3-$4-$5")
      java.util.UUID/fromString
      (.toString)))

(defn draw-chart-fn
  [chart_name payload & {:keys [owner] :or {owner "default"}}]
  (log/info (format "Create %s: %s" chart_name payload))
  (let [version (memorized-get-version)
        ;; Add a version number for avoiding result's conflict when the rapex instance was updated.
        payload (merge payload {:version version})
        uuid (-> (md5 (str chart_name (sort payload)))
                 string2uuid)
        workdir (get-workdir :uuid uuid)
        log-path (fs-lib/join-paths workdir "log.json")
        plot-path (fs-lib/join-paths workdir (format "%s.png" chart_name))
        plot-data-path (fs-lib/join-paths workdir (format "%s.data.json" chart_name))
        plot-json-path (fs-lib/join-paths workdir (format "%s.json" chart_name))
        response {:results [(make-remote-link plot-data-path)]
                  :charts [(make-remote-link plot-json-path)]
                  :log (make-remote-link log-path)
                  :response_type :data2chart
                  :task_id uuid}]
    (if (and (fs-lib/exists? log-path)
             (fs-lib/exists? plot-path)
             (fs-lib/exists? plot-data-path)
             (fs-lib/exists? plot-json-path))
      (created "" {:task_id uuid})
      (try
        (let [task-id (create-task! {:id uuid
                                     :name chart_name
                                     :description ""
                                     :payload payload
                                     :owner owner
                                     :plugin-name chart_name
                                     :plugin-type "ChartPlugin"
                                     :plugin-version "v0.1.0"
                                     :response response})]
          (fs-lib/mkdirs workdir)
          (spit log-path (json/write-str {:status "Running" :msg ""}))
          (publish-event! chart_name
                          {:plot-path plot-path
                           :plot-data-path plot-data-path
                           :plot-json-path plot-json-path
                           :task-id task-id
                           :log-path log-path
                           :payload payload})
          (created "" {:task_id task-id}))
        (catch Exception e
          (log/error "Error: " e)
          (spit log-path (json/write-str {:status "Failed" :msg (.toString e)}))
          (get-error-response e))))))

(defn update-process!
  [^String task-id ^Integer percentage]
  (let [record (cond
                 (= percentage 100) {:status "Finished"
                                     :percentage 100
                                     :finished_time (util/time->int (util/now))}
                 (= percentage -1) {:status "Failed"
                                    :finished_time (util/time->int (util/now))}
                 :else {:percentage percentage})
        record (merge {:id task-id} record)]
    (update-task! record)))

(defn gen-organ-map
  "Generate organ map for ui schema.
   
   Output: {:gut {:text \"Gut\"} :hrt {:text \"Heart\"}} 
  "
  [& {:keys [dataset]}]
  (let [dataset-metadata (memorized-get-dataset-metadata)
        dataset-metadata (if dataset
                           (filter #(= (:dataset_abbr %) dataset) dataset-metadata)
                           dataset-metadata)
        organs (apply concat (map (fn [dataset] (:organs dataset)) dataset-metadata))]
    (log/info "Organs: " organs)
    (->> organs
         (map (fn [item] (select-keys item [:key :text])))
         set
         vec
         (sort-by :key)
         (map (fn [item] {(keyword (:key item)) {:text (:text item)}}))
         (into {}))))
