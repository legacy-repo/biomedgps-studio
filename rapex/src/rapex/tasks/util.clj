(ns rapex.tasks.util
  (:require [ring.util.http-response :refer [created ok not-found bad-request internal-server-error]]
            [clojure.tools.logging :as log]
            [clojure.data.json :as json]
            [tservice-core.plugins.env :refer [get-workdir create-task! make-remote-link]]
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
        plot-json-path (fs-lib/join-paths workdir (format "%s.json" chart_name))]
    (try
      (let [response {:results [(make-remote-link plot-path)]
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
                         :plot-json-path plot-json-path
                         :task-id task-id
                         :log-path log-path
                         :payload payload})
        (created "" {:task_id task-id}))
      (catch Exception e
        (log/error "Error: " e)
        (spit log-path (json/write-str {:status "Failed" :msg (.toString e)}))
        (get-error-response e)))))
