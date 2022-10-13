(ns rapex.tasks.boxplot
  (:require [clojure.data.json :as json]
            [tservice-core.plugins.env :refer [update-task!]]
            [tservice-core.tasks.async :refer [make-events-init]]
            [rapex.rwrapper.opencpu :as ocpu]))

(defn boxplot-demo-data
  []
  (let [d1 (map (fn [gene] {:gene_symbol gene :group "Control" :value (first (repeatedly #(rand-int 100)))}) (repeat 12 "TP53"))
        d2 (map (fn [gene] {:gene_symbol gene :group "Test" :value (first (repeatedly #(rand-int 100)))}) (repeat 12 "TP53"))]
    (concat d1 d2)))

(defn draw-boxplot!
  [{:keys [plot-json-path plot-path task-id log-path]}]
  (try
    (let [resp (ocpu/draw-plot! "boxplotly" :params {:d (boxplot-demo-data) :filetype "png"})
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
                            :data_type "FPKM"}}]}})
