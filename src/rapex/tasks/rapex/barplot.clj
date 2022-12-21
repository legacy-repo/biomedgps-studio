(ns rapex.tasks.rapex.barplot
  (:require [clojure.data.json :as json]
            [tservice-core.tasks.async :refer [make-events-init]]
            [rapex.rwrapper.opencpu :as ocpu]
            [clojure.spec.alpha :as s]
            [rapex.tasks.rapex.util :refer [draw-chart-fn update-process! gen-organ-map remove-field]]
            [rapex.db.query-data :as qd]
            [rapex.config :refer [get-default-dataset]]
            [rapex.tasks.rapex.chart-sepcs :as cs]
            [clojure.string :as clj-str]))

(def chart-name "rapex-barplot")

(defn barplot-demo-data
  []
  (let [d1 (map (fn [gene] {:gene_symbol gene :group "Control" :value (first (repeatedly #(rand-int 100)))}) (repeat 12 "TP53"))
        d2 (map (fn [gene] {:gene_symbol gene :group "Test" :value (first (repeatedly #(rand-int 100)))}) (repeat 12 "TP53"))]
    (concat d1 d2)))

(defn- convert-record-map
  [record-map]
  (let [ensembl-id (get record-map :ensembl_id)]
    (map (fn [[key val]] {:group (second (clj-str/split (name key) #"_"))
                          :gene_symbol ensembl-id
                          :sample_name key
                          :value val})
         (dissoc record-map :ensembl_id))))

(defn- convert-db-results
  "Convert db results to a list of hash-map.
   
   [[{:a 1} {:a 2}] [{:a 3} {:a 4}] [{:a 5}]] -> [{:a 1 } {:a 2} {:a 3} {:a 4} {:a 5}]
  "
  [results]
  (->> (map convert-record-map results)
       (apply concat)))

(defn- prepare-data
  [ensembl_id organ dataset datatype]
  (let [query-map {:select [:*]
                   :from [(keyword (format "expr_%s_%s" organ datatype))]}
        query-map (if (coll? ensembl_id)
                    (merge query-map {:where [:in :ensembl_id ensembl_id]})
                    (merge query-map {:where [:= :ensembl_id ensembl_id]}))
        results (qd/get-results (qd/get-db-path dataset) query-map)
          ;; [{:ensembl_id "xxx" :Gut_PM_2_A18 1212 ...}]
        d (convert-db-results results)]
    d))

(defn draw-barplot!
  [{:keys [plot-json-path plot-path plot-data-path task-id log-path payload]}]
  (try
    (let [position (or (:position payload) "dodge")
          datatype (or (:datatype payload) "fpkm")
          log_scale (:log_scale payload)
          organ (or (:organ payload) "gut")
          dataset (or (:dataset payload) (get-default-dataset))
          ensembl_id (:gene_symbol payload)
          d (prepare-data ensembl_id organ dataset datatype)
          _ (spit plot-data-path (json/write-str d))
          resp (ocpu/draw-plot! "barplotly" :params {:d (remove-field d :sample_name) :filetype "png"
                                                     :levels ["PM" "FA"]
                                                     :data_type (clj-str/upper-case datatype)
                                                     :position position :log_scale log_scale})]
      (ocpu/read-plot! resp plot-json-path)
      (ocpu/read-png! resp plot-path)
      (spit log-path (json/write-str {:status "Success" :msg (ocpu/read-log! resp)}))
      (update-process! task-id 100))
    (catch Exception e
      (spit log-path (json/write-str {:status "Failed" :msg (.toString e)}))
      (update-process! task-id -1))))

(def events-init
  "Automatically called during startup; start event listener for barplot events.
   
   Known Issue: The instance will generate several same async tasks when you reload the jar."
  (make-events-init chart-name draw-barplot!))

(def manifest
  {:name "BarPlot"
   :version "v0.1.0"
   :description ""
   :category "Chart"
   :home "https://github.com/rapex-lab/rapex/tree/master/rapex/src/rapex/tasks"
   :source "Rapex Team"
   :short_name chart-name
   :icons [{:src ""
            :type "image/png"
            :sizes "144x144"}]
   :author "Jingcheng Yang"
   :maintainers ["Jingcheng Yang" "Tianyuan Cheng"]
   :tags ["R" "Chart"]
   :readme "https://rapex.prophetdb.org/README/barplot.md"
   :id chart-name})

(s/def ::gene_symbol (s/coll-of string?))
(s/def ::organ cs/organ-sets)

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
                 (draw-chart-fn chart-name payload :owner (or (get headers "x-auth-users") "default")))})

(defn ui-schema-fn
  [dataset]
  (let [organ-map (gen-organ-map :dataset dataset)
        datatype-map {:fpkm {:text (clj-str/upper-case "fpkm")}}]
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
                 :tooltip "Allowed values are dodge (default), stack, fill."
                 :valueEnum {:dodge {:text "Dodge"} :stack {:text "Stack"}
                             :fill {:text "Fill"}}
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
                  :datafile ""
                  :arguments {:position "dodge"
                              :log_scale false
                              :datatype "FPKM"}}]}}))
