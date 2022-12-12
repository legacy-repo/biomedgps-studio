(ns rapex.tasks.barplot-multiple-organs
  (:require [clojure.data.json :as json]
            [tservice-core.tasks.async :refer [make-events-init]]
            [rapex.rwrapper.opencpu :as ocpu]
            [clojure.spec.alpha :as s]
            [rapex.tasks.util :refer [draw-chart-fn update-process! gen-organ-map]]
            [rapex.db.query-data :as qd]
            [rapex.tasks.common-sepcs :as cs]
            [rapex.config :refer [get-default-dataset]]
            [clojure.string :as clj-str]))

(defn- convert-record-map
  [organ record-map]
  (let [ensembl-id (get record-map :ensembl_id)]
    (map (fn [[key val]] {:group (second (clj-str/split (name key) #"_"))
                          :gene_symbol ensembl-id
                          :organ organ
                          :value val})
         (dissoc record-map :ensembl_id))))

(defn- convert-db-results
  "Convert db results to a list of hash-map.
   
   [[{:a 1} {:a 2}] [{:a 3} {:a 4}] [{:a 5}]] -> [{:a 1 } {:a 2} {:a 3} {:a 4} {:a 5}]
  "
  [organ results]
  (->> (map #(convert-record-map organ %) results)
       (apply concat)))

(defn- query-db
  [dataset table ensembl-id]
  (try
    (let [query-map {:select [:*]
                     :from [(keyword table)]
                     :where [:= :ensembl_id ensembl-id]}
          ;; "expr_gut_fpkm" -> ["gut" "fpkm"]
          organ (second (clj-str/split table #"_"))
          results (qd/get-results (qd/get-db-path dataset) query-map)]
      (convert-db-results organ results))
    ;; TODO: Need to record the message into a log file.
    (catch Exception e
      [])))

(defn draw-barplot!
  [{:keys [plot-json-path plot-path plot-data-path task-id log-path payload]}]
  (try
    (let [position (or (:position payload) "dodge")
          datatype (or (:datatype payload) "fpkm")
          log_scale (:log_scale payload)
          ;; Multiple items, such as ["gut" "lng"]
          organ (:organ payload)
          dataset (or (:dataset payload) (get-default-dataset))
          ensembl_id (:gene_symbol payload)
          results (map #(query-db dataset % ensembl_id)
                       (map #(format "expr_%s_%s" % datatype) organ))
          ;; [[{}] [{}] []] -> [{} {}]
          d (apply concat results)
          _ (spit plot-data-path (json/write-str d))
          resp (ocpu/draw-plot! "barplotly" :params {:d d :filetype "png"
                                                     :levels ["FA" "PM"]
                                                     :data_type (clj-str/upper-case datatype)
                                                     :position position :log_scale log_scale})
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
  (make-events-init "barplot-organs" draw-barplot!))

(def manifest
  {:name "Barplot for multiple organs"
   :version "v0.1.0"
   :description ""
   :category "Chart"
   :home "https://github.com/rapex-lab/rapex/tree/master/rapex/src/rapex/tasks"
   :source "Rapex Team"
   :short_name "barplot-organs"
   :icons [{:src ""
            :type "image/png"
            :sizes "144x144"}]
   :author "Jingcheng Yang"
   :maintainers ["Jingcheng Yang" "Tianyuan Cheng"]
   :tags ["R" "Chart"]
   :readme "https://rapex.prophetdb.org/README/barplot-organs.md"
   :id "barplot-organs"})

(s/def ::gene_symbol string?)
(s/def ::organ (s/coll-of cs/organ-sets))
(def schema (s/keys :req-un [::gene_symbol ::organ ::cs/dataset ::cs/datatype]
                    :opt-un [::cs/position ::cs/log_scale]))

(defn post-barplot!
  []
  {:summary    "Draw a barplot."
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
                 (draw-chart-fn "barplot-organs" payload :owner (or (get headers "x-auth-users") "default")))})

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
              {:key "position"
               :dataIndex "position"
               :valueType "select"
               :title "Position"
               :tooltip "Allowed values are dodge (default), stack, fill"
               :valueEnum {:dodge {:text "Dodge"} :fill {:text "Fill"}
                           :stack {:text "Stack"}}
               :formItemProps {:initialValue "dodge"
                               :rules [{:required true
                                        :message "position filed is required."}]}}
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
                            :position "dodge"
                            :datatype "FPKM"}}]}})
