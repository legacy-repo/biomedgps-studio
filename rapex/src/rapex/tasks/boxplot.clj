(ns rapex.tasks.boxplot
  (:require [clojure.data.json :as json]
            [tservice-core.tasks.async :refer [make-events-init]]
            [rapex.rwrapper.opencpu :as ocpu]
            [clojure.spec.alpha :as s]
            [rapex.tasks.util :refer [draw-chart-fn update-process!]]
            [rapex.db.query-duckdb :as duckdb] 
            [clojure.string :as clj-str]))

(defn boxplot-demo-data
  []
  (let [d1 (map (fn [gene] {:gene_symbol gene :group "Control" :value (first (repeatedly #(rand-int 100)))}) (repeat 12 "TP53"))
        d2 (map (fn [gene] {:gene_symbol gene :group "Test" :value (first (repeatedly #(rand-int 100)))}) (repeat 12 "TP53"))]
    (concat d1 d2)))

(defn- convert-record-map
  [record-map]
  (let [ensembl-id (get record-map :ensembl_id)]
    (map (fn [[key val]] {:group (second (clj-str/split (name key) #"_"))
                          :gene_symbol ensembl-id
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
                   :from [(keyword (format "%s_%s_%s" organ dataset datatype))]}
        query-map (if (coll? ensembl_id)
                    (merge query-map {:where [:in :ensembl_id ensembl_id]})
                    (merge query-map {:where [:= :ensembl_id ensembl_id]}))
        results (duckdb/get-results (duckdb/get-db-path "rapex_expr") query-map)
          ;; [{:ensembl_id "xxx" :Gut_PM_2_A18 1212 ...}]
        d (convert-db-results results)]
    d))

(defn draw-boxplot!
  [{:keys [plot-json-path plot-path task-id log-path payload]}]
  (try
    (let [method (or (:method payload) "t.test")
          datatype (or (:datatype payload) "fpkm")
          log_scale (:log_scale payload)
          jitter_size (or (:jitter_size payload) 0.4)
          organ (or (:organ payload) "gut")
          dataset (or (:dataset payload) "000000")
          ensembl_id (:gene_symbol payload)
          d (prepare-data ensembl_id organ dataset datatype)
          resp (ocpu/draw-plot! "boxplotly" :params {:d d :filetype "png" :data_type (clj-str/upper-case datatype)
                                                     :method method :jitter_size jitter_size
                                                     :log_scale log_scale})]
      (ocpu/read-plot! resp plot-json-path)
      (ocpu/read-png! resp plot-path)
      (spit log-path (json/write-str {:status "Success" :msg (ocpu/read-log! resp)}))
      (update-process! task-id 100))
    (catch Exception e
      (spit log-path (json/write-str {:status "Failed" :msg (.toString e)}))
      (update-process! task-id -1))))

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

(s/def ::gene_symbol (s/or :string string? :list (s/coll-of string?)))
(s/def ::organ #{"gut" "hrt" "kdn" "lng" "lvr" "tst" "tyr" "brn"})
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
               :fieldProps {:mode "multiple"}
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
               :formItemProps {:initialValue "gut"
                               :rules [{:required true
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
