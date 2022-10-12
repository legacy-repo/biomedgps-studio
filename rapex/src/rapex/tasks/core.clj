(ns rapex.tasks.core
  (:require [rapex.tasks.core-specs :as specs]
            [ring.util.http-response :refer [created ok not-found bad-request internal-server-error]]
            [clojure.tools.logging :as log]
            [clojure.data.json :as json]
            [tservice-core.plugins.env :refer [get-workdir create-task! make-remote-link]]
            [tservice-core.tasks.async :refer [publish-event!]]
            [local-fs.core :as fs-lib]
            ;; Chats
            [rapex.tasks.boxplot :as boxplot]))

(def ^:private chart-manifests (atom [boxplot/manifest]))

(defn register-manifest
  [manifest]
  (conj @chart-manifests manifest))

(def ^:private chart-ui-schemas (atom {:boxplot boxplot/ui-schema}))

(defn register-ui-schema
  [key manifest]
  (merge @chart-ui-schemas {key manifest}))

(defn list-charts
  []
  {:summary    "Get all the available charts."
   :parameters {}
   :responses  {200 {:body specs/list-chart-response}
                404 {:body {:msg string?
                            :context any?}}
                400 {:body {:msg string?
                            :context any?}}
                500 {:body {:msg string?
                            :context any?}}}
   :handler    (fn [{{{:keys [page page_size]} :query} :parameters}]
                 (let [page     (if (nil? page) 1 page)
                       page_size (if (nil? page_size) 10 page_size)]
                   (ok {:total (count @chart-manifests)
                        :page page
                        :page_size page_size
                        :data (->> (drop (* (- page 1) page_size) @chart-manifests)
                                   (take page_size))})))})

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
  []
  {:summary    "Draw a chart."
   :parameters {:path {:chart_name string?} :body any?}
   :responses  {201 {:body {:task_id string?}}
                404 {:body {:msg string?
                            :context any?}}
                400 {:body {:msg string?
                            :context any?}}
                500 {:body {:msg string?
                            :context any?}}}
   :handler    (fn [{{{:keys [chart_name]} :path {:as payload} :body} :parameters}]
                 (log/debug (format "Create %s: %s" chart_name payload))
                 (let [workdir (get-workdir)
                       uuid (fs-lib/basename workdir)
                       log-path (fs-lib/join-paths workdir "log.json")
                       plot-path (fs-lib/join-paths workdir (format "%s.png" chart_name))
                       plot-json-path (fs-lib/join-paths workdir (format "%s.json" chart_name))]
                   (try
                     (let [response {:results [(make-remote-link plot-path)]
                                     :charts [(make-remote-link plot-json-path)]
                                     :log (make-remote-link log-path)
                                     :response_type :data2chart}
                           task-id (create-task! {:id uuid
                                                  :name chart_name
                                                  :description ""
                                                  :payload {}
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
                                        :log-path log-path})
                       (created "" {:task_id task-id}))
                     (catch Exception e
                       (log/debug "Error: " e)
                       (spit log-path (json/write-str {:status "Failed" :msg (.toString e)}))
                       (get-error-response e)))))})

(defn get-chart-ui-schema
  []
  {:summary    "Get the ui schema of a chart."
   :parameters {:path {:chart_name string?}}
   :responses  {200 {:body any?}
                404 {:body {:msg string?
                            :context any?}}
                400 {:body {:msg string?
                            :context any?}}
                500 {:body {:msg string?
                            :context any?}}}
   :handler    (fn [{{{:keys [chart_name]} :path} :parameters}]
                 (let [ui-schema (get @chart-ui-schemas (keyword chart_name))]
                   (if ui-schema
                     (ok ui-schema)
                     (not-found {:msg "No such chart."
                                 :context nil}))))})

(def routes
  [""
   {:swagger {:tags ["Visualization for Omics Data"]}}

   ["/charts"
    {:get (list-charts)}]

   ["/charts/ui-schema/:chart_name"
    {:get (get-chart-ui-schema)}]

   ["/charts/:chart_name"
    {:post (draw-chart-fn)}]])