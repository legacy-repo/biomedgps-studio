(ns rapex.tasks.boxplot-multiple-organs
  (:require [clojure.data.json :as json]
            [tservice-core.plugins.env :refer [update-task!]]
            [tservice-core.tasks.async :refer [make-events-init]]
            [rapex.rwrapper.opencpu :as ocpu]
            [clojure.spec.alpha :as s]
            [rapex.tasks.util :refer [draw-chart-fn]]
            [rapex.db.query-duckdb :as duckdb]
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
  [table ensembl-id]
  (try
    (let [query-map {:select [:*]
                     :from (keyword table)
                     :where [:= :ensembl_id ensembl-id]}
          ;; "gut_000000_fpkm" -> ["gut" "000000" "fpkm"]
          organ (first (clj-str/split table #"_"))
          results (duckdb/get-results (duckdb/get-db-path "rapex_expr") query-map)]
      (convert-db-results organ results))
    ;; TODO: Need to record the message into a log file.
    (catch Exception e
      [])))

(defn draw-boxplot!
  [{:keys [plot-json-path plot-path task-id log-path payload]}]
  (try
    (let [method (or (:method payload) "t.test")
          datatype (or (:datatype payload) "fpkm")
          log_scale (:log_scale payload)
          jitter_size (or (:jitter_size payload) 0.4)
          ;; Multiple items, such as ["gut" "lng"]
          organ (:organ payload)
          dataset (or (:dataset payload) "000000")
          ensembl_id (:gene_symbol payload)
          results (map #(query-db % ensembl_id)
                       (map #(format "%s_%s_%s" % dataset datatype) organ))
          ;; [[{}] [{}] []] -> [{} {}]
          d (apply concat results)
          resp (ocpu/draw-plot! "boxplotly" :params {:d d :filetype "png" :data_type (clj-str/upper-case datatype)
                                                     :method method :jitter_size jitter_size
                                                     :log_scale log_scale})
          out-log (json/write-str {:status "Success" :msg (ocpu/read-log! resp)})]
      (ocpu/read-plot! resp plot-json-path)
      (ocpu/read-png! resp plot-path)
      (spit log-path out-log)
      (update-task! {:id task-id :status "Finished"}))
    (catch Exception e
      (spit log-path (json/write-str {:status "Failed" :msg (.toString e)}))
      (update-task! {:id task-id :status "Failed"}))))

(def events-init
  "Automatically called during startup; start event listener for boxplot events.
   
   Known Issue: The instance will generate several same async tasks when you reload the jar."
  (make-events-init "boxplot" draw-boxplot!))

(def manifest
  {:name "Box Plot"
   :version "v0.1.0"
   :description ""
   :category "Chart"
   :home "https://github.com/rapex-lab/rapex/tree/master/rapex/src/rapex/tasks"
   :source "Rapex Team"
   :short_name "boxplot"
   :icons [{:src ""
            :type "image/png"
            :sizes "144x144"}]
   :author "Jingcheng Yang"
   :maintainers ["Jingcheng Yang" "Tianyuan Cheng"]
   :tags ["R" "Chart"]
   :readme "https://rapex.prophetdb.org/README/boxplot.md"
   :id "boxplot"})

(s/def ::gene_symbol string?)
(s/def ::organ (s/coll-of #{"gut" "hrt" "kdn" "lng" "lvr" "tst" "tyr" "brn"}))
(s/def ::dataset #{"000000"})
(s/def ::datatype #{"fpkm" "tpm" "counts"})
(s/def ::method #{"t.test" "wilcox.test" "anova" "kruskal.test"})
(s/def ::log_scale boolean?)
(s/def ::jitter_size number?)

(def schema (s/keys :req-un [::gene_symbol ::organ ::dataset ::datatype]
                    :opt-un [::method ::log_scale ::jitter_size]))

(defn post-boxplot!
  []
  {:summary    "Draw a boxplot."
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
                 (draw-chart-fn "boxplot" payload :owner (or (get headers "x-auth-users") "default")))})

(def ui-schema
  {:readme "https://rapex.prophetdb.org/README/boxplot.md"
   :schema
   {:fields  [{:key "gene_symbol"
               :dataIndex "gene_symbol"
               :valueType "gene_searcher"
               :title "Gene Symbol"
               :tooltip "Which gene do you want to query?"
               :formItemProps {:rules [{:required true
                                        :message "gene_symbol filed is required."}]}}
              {:key "organ"
               :dataIndex "organ"
               :valueType "select"
               :title "Organ"
               :tooltip "Which organ do you want to query?"
               :valueEnum {:gut {:text "Gut"} :hrt {:text "Heart"}
                           :kdn {:text "Kidney"} :lng {:text "Lung"}
                           :lvr {:text "Liver"} :tst {:text "Testis"}
                           :tyr {:text "Thyroid"} :brn {:text "Brain"}}
               :fieldProps {:mode "multiple"}
               :formItemProps {:rules [{:required true
                                        :message "organ filed is required."}]}}
              {:key "dataset"
               :dataIndex "dataset"
               :valueType "select"
               :title "Data Set"
               :tooltip "Which dataset do you want to query?"
               :valueEnum {:000000 {:text "Rapex00000"}}
               :formItemProps {:initialValue "000000"
                               :rules [{:required true
                                        :message "dataset filed is required."}]}}
              {:key "datatype"
               :dataIndex "datatype"
               :valueType "select"
               :title "Data Type"
               :tooltip "Which datatype do you want to query?"
               :valueEnum {:fpkm {:text "FPKM"} :counts {:text "Counts"}
                           :tpm {:text "TPM"}}
               :formItemProps {:initialValue "fpkm"
                               :rules [{:required true
                                        :message "datatype filed is required."}]}}
              {:key "method"
               :dataIndex "method"
               :valueType "select"
               :title "Method"
               :tooltip "The statistical test method to be used. Allowed values are t.test (default) wilcox.test anova kruskal.test"
               :valueEnum {:t.test {:text "T Test"} :wilcox.test {:text "Wilcox Test"}
                           :anova {:text "Anova"} :kruskal.test {:text "Kruskal Test"}}
               :formItemProps {:initialValue "t.test"
                               :rules [{:required true
                                        :message "gene_symbol filed is required."}]}}
              {:key "log_scale"
               :dataIndex "log_scale"
               :valueType "switch"
               :title "Log Scale"
               :tooltip
               "Logical value. If TRUE input data will be transformation using log2 function."
               :formItemProps {:initialValue true}}
              {:key "jitter_size"
               :dataIndex "jitter_size"
               :valueType "digit"
               :title "Jitter Size"
               :tooltip "Jitter size greater than 0 and less than 1."
               :fieldProps {:step 0.1}
               :formItemProps {:initialValue 0.4}}]
    :dataKey {:data "Data"}
    :examples [{:title "Example 1"
                :key "example-1"
                :datafile ""
                :arguments {:method "t.test"
                            :log_scale false
                            :jitter_size 0.4
                            :datatype "FPKM"}}]}})
