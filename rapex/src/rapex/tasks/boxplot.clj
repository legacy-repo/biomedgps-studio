(ns rapex.tasks.boxplot
  (:require [ring.util.http-response :refer [ok not-found bad-request internal-server-error]]
            [rapex.R.core :as rcore]
            [clojure.tools.logging :as log]
            [clojure.data.json :as json]
            [tservice-core.plugins.env :refer [get-workdir create-task! make-remote-link update-task!]]
            [tservice-core.tasks.async :refer [publish-event! make-events-init]]
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

(defn create-boxplot
  [title]
  {:summary    title
   :parameters {}
   :responses  {201 {:body {:task_id string?}}
                404 {:body {:msg string?
                            :context any?}}
                400 {:body {:msg string?
                            :context any?}}
                500 {:body {:msg string?
                            :context any?}}}
   :handler    (fn [payload]
                 (log/debug "Create boxplot: " payload)
                 (try
                   (let [workdir (get-workdir)
                         uuid (fs-lib/basename workdir)
                         log-path (fs-lib/join-paths workdir "log.json")
                         response {:results []
                                   :charts [(make-remote-link (fs-lib/join-paths workdir "boxplot.json"))]
                                   :log (make-remote-link log-path)
                                   :response-type :data2chart}
                         task-id (create-task! {:id uuid
                                                :name "boxplot"
                                                :description "A boxplot"
                                                :payload {}
                                                :plugin-name "boxplot"
                                                :plugin-type "ChartPlugin"
                                                :plugin-version "v0.1.0"
                                                :response response})]
                     (fs-lib/mkdirs workdir)
                     (spit log-path (json/write-str {:status "Running" :msg ""}))
                     (publish-event! "boxplot"
                                     {:dest-dir workdir
                                      :task-id task-id
                                      :log-path log-path})
                     (ok {:task_id task-id}))
                   (catch Exception e
                     (log/debug "Error: " e)
                     (get-error-response e))))})

(def routes
  [""
   {:swagger {:tags ["Visualization for Omics Data"]}}

   ["/boxplot"
    {:post  (create-boxplot "Basic Plots")}]])

(defn draw-boxplot!
  [{:keys [dest-dir task-id log-path]}]
  (try
    (rcore/test-rcode dest-dir log-path)
    (update-task! {:id task-id :status "Finished"})
    (catch Exception e
      (update-task! {:id task-id :status "Failed"}))))

(def events-init
  "Automatically called during startup; start event listener for boxplot events.
   
   Known Issue: The instance will generate several same async tasks when you reload the jar."
  (make-events-init "boxplot" draw-boxplot!))
