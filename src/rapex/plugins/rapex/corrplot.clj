(ns rapex.plugins.rapex.corrplot
  (:require [clojure.data.json :as json]
            [tservice-core.tasks.async :refer [make-events-init]]
            [rapex.rwrapper.opencpu :as ocpu]
            [clojure.spec.alpha :as s]
            [rapex.plugins.rapex.util :refer [draw-chart-fn update-process! gen-organ-map]]
            [rapex.db.query-data :as qd]
            [rapex.plugins.rapex.chart-sepcs :as cs]
            [rapex.config :refer [get-default-dataset]]
            [clojure.string :as clj-str]))

(def chart-name "rapex-corrplot")

(defn- query-db
  [dataset table ensembl-ids]
  (try
    (let [query-map {:select [:*]
                     :from [(keyword table)]
                     :where [:in :ensembl_id ensembl-ids]}
          results (qd/get-results (qd/get-db-path dataset) query-map)]
      results)
    ;; TODO: Need to record the message into a log file.
    (catch Exception e
      [])))

(defn draw-corrplot!
  [{:keys [plot-json-path plot-path plot-data-path task-id log-path payload]}]
  (try
    (let [scale (or (:scale payload) "none")
          datatype (or (:datatype payload) "fpkm")
          show_rownames (:show_rownames payload)
          show_colnames (:show_colnames payload)
          corr_type (or (:corr_type payload) "pearson")
          ;; one organ, such as "gut"
          organ (:organ payload)
          dataset (or (:dataset payload) (get-default-dataset))
          ensembl_ids (:gene_symbol payload)
          results (query-db dataset (format "expr_%s_%s" organ datatype) ensembl_ids)
          _ (spit plot-data-path (json/write-str results))
          resp (ocpu/draw-plot! "corrplotly" :params {:d results :filetype "png"
                                                      :data_type (clj-str/upper-case datatype)
                                                      :scale scale :show_colnames show_colnames
                                                      :show_rownames show_rownames :corr_type corr_type})
          out-log (json/write-str {:status "Success" :msg (ocpu/read-log! resp)})]
      (ocpu/read-plot! resp plot-json-path)
      (ocpu/read-png! resp plot-path)
      (spit log-path out-log)
      (update-process! task-id 100))
    (catch Exception e
      (spit log-path (json/write-str {:status "Failed" :msg (.toString e)}))
      (update-process! task-id -1))))

(def events-init
  "Automatically called during startup; start event listener for corrplot events.
   
   Known Issue: The instance will generate several same async tasks when you reload the jar."
  (make-events-init chart-name draw-corrplot!))

(def manifest
  {:name "Corrplot for multiple genes"
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
   :readme "https://rapex.prophetdb.org/README/corrplot.md"
   :id chart-name})

(s/def ::gene_symbol (s/coll-of string?))
(s/def ::organ cs/organ-sets)
(def schema (s/keys :req-un [::gene_symbol ::organ ::cs/dataset ::cs/datatype]
                    :opt-un [::cs/scale ::cs/show_rownames ::cs/show_colnames ::cs/corr_type]))

(defn post-corrplot!
  []
  {:summary    "Draw a corrplot."
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
    {:readme "https://rapex.prophetdb.org/README/corrplot.md"
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
                {:key "scale"
                 :dataIndex "scale"
                 :valueType "select"
                 :title "Scale"
                 :tooltip "Allowed values are none (default), row, col"
                 :valueEnum {:none {:text "None"} :row {:text "Row"}
                             :col {:text "Column"}}
                 :formItemProps {:initialValue "none"
                                 :rules [{:required true
                                          :message "scale filed is required."}]}}
                {:key "show_rownames"
                 :dataIndex "show_rownames"
                 :valueType "switch"
                 :title "Show Rownames"
                 :tooltip
                 "Boolean specifying if row names are be shown."
                 :formItemProps {:initialValue true}}
                {:key "show_colnames"
                 :dataIndex "show_colnames"
                 :valueType "switch"
                 :title "Show Colnames"
                 :tooltip
                 "Boolean specifying if column names are be shown."
                 :formItemProps {:initialValue true}}
                {:key "corr_type"
                 :dataIndex "corr_type"
                 :valueType "select"
                 :title "Corr Type"
                 :tooltip "Character indicating which method to computing correlation coefficient. spearman or pearson."
                 :valueEnum {:spearman {:text "Spearman"} :pearson {:text "Pearson"}}
                 :formItemProps {:initialValue "pearson"
                                 :rules [{:required true
                                          :message "corr_type filed is required."}]}}]
      :examples [{:title "Example 1"
                  :key "example-1"
                  :arguments {:scale "none"
                              :show_colnames true
                              :show_rownames true
                              :datatype "FPKM"
                              :organ "gut"
                              :gene_symbol ["ENSEMBL00001", "ENSEMBL00002", "ENSEMBL00003"]
                              :corr_type "pearson"}}]}}))
