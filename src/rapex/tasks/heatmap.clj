(ns rapex.tasks.heatmap
  (:require [clojure.data.json :as json]
            [tservice-core.tasks.async :refer [make-events-init]]
            [rapex.rwrapper.opencpu :as ocpu]
            [clojure.spec.alpha :as s]
            [rapex.tasks.util :refer [draw-chart-fn update-process! gen-organ-map remove-field]]
            [rapex.db.query-data :as qd]
            [rapex.tasks.common-sepcs :as cs]
            [rapex.config :refer [get-default-dataset]]
            [clojure.string :as clj-str]))

(defn- convert-record-map
  [record-map]
  (let [ensembl-id (get record-map :ensembl_id)]
    (map (fn [[key val]] {:group (second (clj-str/split (name key) #"_"))
                          :gene_symbol ensembl-id
                          :sample_name key
                          :organ (first (clj-str/split (name key) #"_"))
                          :value val})
         (dissoc record-map :ensembl_id))))

(defn- convert-db-results
  "Convert db results to a list of hash-map.
   
   [[{:a 1} {:a 2}] [{:a 3} {:a 4}] [{:a 5}]] -> [{:a 1 } {:a 2} {:a 3} {:a 4} {:a 5}]
  "
  [results]
  (->> (map #(convert-record-map %) results)
       (apply concat)))

(defn- query-db
  [dataset table ensembl-id]
  (try
    (let [query-map {:select [:*]
                     :from [(keyword table)]
                     :where [:= :ensembl_id ensembl-id]}
          results (qd/get-results (qd/get-db-path dataset) query-map)]
      (convert-db-results results))
    ;; TODO: Need to record the message into a log file.
    (catch Exception e
      [])))

(defn- batch-query-db
  [dataset organs datatype ensembl_ids]
  (let [tables (map #(format "expr_%s_%s" % datatype) organs)]
    (->> (map
          #(map (fn [table] (query-db dataset table %)) tables)
          ensembl_ids)
         (apply concat))))

(defn draw-heatmap!
  [{:keys [plot-json-path plot-path plot-data-path task-id log-path payload]}]
  (try
    (let [datatype (or (:datatype payload) "fpkm")
          method (or (:method payload) "mean")
          log_scale (:log_scale payload)
          ;; Multiple items, such as ["gut" "lng"]
          organs (:organ payload)
          dataset (or (:dataset payload) (get-default-dataset))
          ;; Multiple items, such as ["ENxxx" "ENxxx"]
          ensembl_ids (:gene_symbol payload)
          results (batch-query-db dataset organs datatype ensembl_ids)
          ;; [[{}] [{}] []] -> [{} {}]
          d (apply concat results)
          _ (spit plot-data-path (json/write-str d))
          resp (ocpu/draw-plot! "heatmaply" :params {:d (remove-field d :sample_name) :filetype "png"
                                                     :method method
                                                     :data_type (clj-str/upper-case datatype)
                                                     :log_scale log_scale})
          out-log (json/write-str {:status "Success" :msg (ocpu/read-log! resp)})]
      (ocpu/read-plot! resp plot-json-path)
      (ocpu/read-png! resp plot-path)
      (spit log-path out-log)
      (update-process! task-id 100))
    (catch Exception e
      (spit log-path (json/write-str {:status "Failed" :msg (.toString e)}))
      (update-process! task-id -1))))

(def events-init
  "Automatically called during startup; start event listener for barplot events.
   
   Known Issue: The instance will generate several same async tasks when you reload the jar."
  (make-events-init "multiple-genes-comparison" draw-heatmap!))

(def manifest
  {:name "Heatmap for multiple genes in multiple organs"
   :version "v0.1.0"
   :description ""
   :category "Chart"
   :home "https://github.com/rapex-lab/rapex/tree/master/rapex/src/rapex/tasks"
   :source "Rapex Team"
   :short_name "multiple-genes-comparison"
   :icons [{:src ""
            :type "image/png"
            :sizes "144x144"}]
   :author "Jingcheng Yang"
   :maintainers ["Jingcheng Yang" "Tianyuan Cheng"]
   :tags ["R" "Chart"]
   :readme "https://rapex.prophetdb.org/README/multiple-genes-comparison.md"
   :id "multiple-genes-comparison"})

(s/def ::gene_symbol (s/coll-of string?))
(s/def ::method #{"median" "mean"})
(s/def ::organ (s/coll-of cs/organ-sets))
(def schema (s/keys :req-un [::gene_symbol ::organ ::cs/dataset ::cs/datatype]
                    :opt-un [::method ::cs/log_scale]))

(defn post-heatmap!
  []
  {:summary    "Draw a heatmap"
   :parameters {:body schema}
   :responses  {201 {:body {:task_id string?}}
                404 {:body {:msg string?
                            :context any?}}
                400 {:body {:msg string?
                            :context any?}}
                500 {:body {:msg string?
                            :context any?}}}
   :handler    (fn [{{{:as payload} :body} :parameters
                     {:as headers} :headers}]
                 (draw-chart-fn "multiple-genes-comparison" payload :owner (or (get headers "x-auth-users") "default")))})

(defn ui-schema-fn
  [{:keys [organ-map datatype-map]
    :or {organ-map (gen-organ-map :dataset (get-default-dataset))
         datatype-map {:fpkm {:text "FPKM"} :tpm {:text "TPM"}}}}]
  {:readme "https://rapex.prophetdb.org/README/barplot.md"
   :schema
   {:fields  [{:key "gene_symbol"
               :dataIndex "gene_symbol"
               :valueType "gene_searcher"
               :title "Gene Symbol"
               :tooltip "Which gene do you want to query?"
               :fieldProps {:mode "multiple"}
               :formItemProps {:rules [{:required true
                                        :message "gene_symbol field is required."}]}}
              {:key "organ"
               :dataIndex "organ"
               :valueType "select"
               :title "Organ"
               :tooltip "Which organ do you want to query?"
               :valueEnum organ-map
               :fieldProps {:mode "multiple"}
               :formItemProps {:rules [{:required true
                                        :message "organ filed is required."}]}}
              {:key "datatype"
               :dataIndex "datatype"
               :valueType "select"
               :title "Data Type"
               :tooltip "Which datatype do you want to query?"
               :valueEnum datatype-map
               :formItemProps {:rules [{:required true
                                        :message "datatype filed is required."}]}}
              {:key "method"
               :dataIndex "method"
               :valueType "select"
               :title "Method"
               :tooltip "Allowed values are mean (default), median"
               :valueEnum {:median {:text "Median"} :mean {:text "Mean"}}
               :formItemProps {:initialValue "mean"
                               :rules [{:required true
                                        :message "mean filed is required."}]}}
              {:key "log_scale"
               :dataIndex "log_scale"
               :valueType "switch"
               :title "Log Scale"
               :tooltip
               "Logical value. If TRUE input data will be transformation using log2 function."
               :formItemProps {:initialValue true}}]
    :examples [{:title "Example 1"
                :key "example-1"
                :arguments {:log_scale false
                            :method "mean"
                            :datatype "FPKM"}}]}})
