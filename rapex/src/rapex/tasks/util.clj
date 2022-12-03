(ns rapex.tasks.util
  (:require [ring.util.http-response :refer [created not-found bad-request internal-server-error]]
            [clojure.tools.logging :as log]
            [clojure.data.json :as json]
            [tservice-core.plugins.util :as util]
            [rapex.config :refer [memorized-get-dataset-metadata]]
            [tservice-core.plugins.env :refer [update-task! get-workdir create-task! make-remote-link]]
            [tservice-core.tasks.async :refer [publish-event!]]
            [local-fs.core :as fs-lib]))

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

(defn draw-chart-fn
  [chart_name payload & {:keys [owner] :or {owner "default"}}]
  (log/info (format "Create %s: %s" chart_name payload))
  (let [workdir (get-workdir)
        uuid (fs-lib/basename workdir)
        log-path (fs-lib/join-paths workdir "log.json")
        plot-path (fs-lib/join-paths workdir (format "%s.png" chart_name))
        plot-data-path (fs-lib/join-paths workdir (format "%s.data.json" chart_name))
        plot-json-path (fs-lib/join-paths workdir (format "%s.json" chart_name))]
    (try
      (let [response {:results [(make-remote-link plot-data-path)]
                      :charts [(make-remote-link plot-json-path)]
                      :log (make-remote-link log-path)
                      :response_type :data2chart
                      :task_id uuid}
            task-id (create-task! {:id uuid
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
        (get-error-response e)))))

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
