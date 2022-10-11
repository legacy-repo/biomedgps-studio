(ns rapex.tasks.boxplot
  (:require [ring.util.http-response :refer [ok not-found bad-request internal-server-error]]
            [clojure.tools.logging :as log]
            [clojure.data.json :as json]
            [tservice-core.plugins.env :refer [get-workdir create-task! make-remote-link update-task!]]
            [tservice-core.tasks.async :refer [publish-event! make-events-init]]
            [local-fs.core :as fs-lib]
            [rapex.rwrapper.opencpu :as ocpu]
            [local-fs.core :as fs]))

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
                 (let [workdir (get-workdir)
                       uuid (fs-lib/basename workdir)
                       log-path (fs-lib/join-paths workdir "log.json")
                       plot-path (fs-lib/join-paths workdir "boxplot.json")]
                   (try
                     (let [response {:results []
                                     :charts [(make-remote-link plot-path)]
                                     :log (make-remote-link log-path)
                                     :response_type :data2chart}
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
                                       {:plot-path plot-path
                                        :task-id task-id
                                        :log-path log-path})
                       (ok (merge response {:task_id task-id})))
                     (catch Exception e
                       (log/debug "Error: " e)
                       (spit log-path (json/write-str {:status "Failed" :msg (.toString e)}))
                       (get-error-response e)))))})

(def routes
  [""
   {:swagger {:tags ["Visualization for Omics Data"]}}

   ["/boxplot"
    {:post  (create-boxplot "Basic Plots")}]])

(defn boxplot-demo-data
  []
  (let [d1 (map (fn [gene] {:gene_symbol gene :group "Control" :value (first (repeatedly #(rand-int 100)))}) (repeat 12 "TP53"))
        d2 (map (fn [gene] {:gene_symbol gene :group "Test" :value (first (repeatedly #(rand-int 100)))}) (repeat 12 "TP53"))]
    (concat d1 d2)))

(defn draw-boxplot!
  [{:keys [plot-path task-id log-path]}]
  (try
    (let [resp (ocpu/draw-plot! "boxplot" :params {:d (boxplot-demo-data)})
          out-json (json/write-str (ocpu/read-plot! resp))
          log (ocpu/read-log! resp)
          out-log (json/write-str {:status "Success" :msg log})]
      (spit plot-path out-json)
      (spit log-path out-log)
      (update-task! {:id task-id :status "Finished"}))
    (catch Exception e
      (spit log-path {:status "Failed" :msg (.toString e)})
      (update-task! {:id task-id :status "Failed"}))))

(def events-init
  "Automatically called during startup; start event listener for boxplot events.
   
   Known Issue: The instance will generate several same async tasks when you reload the jar."
  (make-events-init "boxplot" draw-boxplot!))
