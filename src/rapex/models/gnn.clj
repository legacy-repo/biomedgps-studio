(ns rapex.models.gnn
  (:require [libpython-clj2.python :as py]
            [clojure.tools.logging :as log]))

(def model-map (atom nil))
(def nm-module (atom nil))

(defn init-model!
  []
  (try
    (py/initialize!)
    (log/info "Initializing the model...")
    (let [nm (py/import-module "pydl.nm")]
      (reset! nm-module nm)
      (reset! model-map (py/call-attr nm "load_model")))
    (catch Exception e
      (println "Error while initializing the model:" (.getMessage e)))))

(defn format-topkpd
  [topkpd]
  (pmap (fn [item] (let [item (py/->jvm item)]
                     {:relation (first item)
                      :source_id (second item)
                      :target_id (nth item 2)
                      :score (nth item 3)
                      :source (nth item 4)
                      :target (nth item 5)})) topkpd))

(defn format-topkpd-ave
  [topkpd-ave]
  (pmap (fn [item] (let [item (py/->jvm item)]
                     {:relation (first item)
                      :target_id (nth item 1)
                      :score (nth item 2)
                      :target (nth item 3)})) topkpd-ave))

(defn predict-source-targets
  "Predict the intrinsic relations between source and targets.
   
   Arguments:
    source-id: the id of source entity, e.g., Disease::MESH:D015673
    target-ids: a list of target ids, e.g., [Compound::DB00843 Disease::MESH:D015673]
   
   Return: 
    a list of vectors"
  [source-id target-ids]
  (when (not @model-map)
    (throw (Exception. "You need to call init-model! function firstly.")))
  (log/info (format "Predicting for %s with targets %s" source-id target-ids))
  (try
    (let [results (py/call-attr @nm-module "query_by_target_ids" @model-map source-id target-ids)
          topkpd (py/call-attr @nm-module "relation_each" @model-map results true 1000)
          topkpd-ave (py/call-attr @nm-module "relation_ave" @model-map results true 1000)]
      {:topkpd (format-topkpd (py/call-attr topkpd "to_numpy"))
       :topkpd_ave (format-topkpd-ave (py/call-attr topkpd-ave "to_numpy"))})
    (catch Exception e
      (println "Error while predicting:" (.getMessage e))
      {:topkpd []
       :topkpd_ave []})))


(defn predict
  "You need to make sure that source-id matches the type of entity in relations."
  [source-id relations & {:keys [topk]
                          :or {topk 100}}]
  (when (not @model-map)
    (throw (Exception. "You need to call init-model! function firstly.")))
  (log/info (format "Predicting for %s with relations %s topk %s" source-id relations topk))
  (try
    (let [results (py/call-attr @nm-module "query" @model-map relations source-id)
          topkpd (py/call-attr @nm-module "relation_each" @model-map results true topk)
          topkpd-ave (py/call-attr @nm-module "relation_ave" @model-map results true topk)]
      {:topkpd (format-topkpd (py/call-attr topkpd "to_numpy"))
       :topkpd_ave (format-topkpd-ave (py/call-attr topkpd-ave "to_numpy"))})
    (catch Exception e
      (println "Error while predicting:" (.getMessage e))
      {:topkpd []
       :topkpd_ave []})))

(defn format-similarity-topkpd
  [topkpd]
  ;; The order of the items in topkpd is [distance, target_id, target], please refer to the source code of pydl.nm
  (pmap (fn [item] (let [item (py/->jvm item)]
                     {:score (first item)
                      :target_id (nth item 1)
                      :target (nth item 2)})) topkpd))

(defn find-neighbors
  [source-type source-id & {:keys [topk]
                            :or {topk 100}}]
  (when (not @model-map)
    (throw (Exception. "You need to call init-model! function firstly.")))
  (try
    (log/info (format "Finding neighbors for %s::%s with topk %s" source-type source-id topk))
    (let [topkpd (py/call-attr @nm-module "find_nearest_neighbor" @model-map (format "%s::%s" source-type source-id) topk)]
      {:topkpd (format-similarity-topkpd (py/call-attr topkpd "to_numpy"))})
    (catch Exception e
      (println "Error while finding neighbors:" (.getMessage e))
      {:topkpd []})))

(defn zipper
  [a b]
  (map vector a b))

(defn eval-similarities
  "Evaluate the similarities between source and targets.
   
    source-type: the type of source entity, e.g., Disease
    source-id: the id of source entity, e.g., MESH:D015673
    target-types: a list of target types, e.g., [Compound Disease]
    target-ids: a list of target ids, e.g., [DB00843 MESH:D015673]
  "
  [source-type source-id target-types target-ids]
  (when (not @model-map)
    (throw (Exception. "You need to call init-model! function firstly.")))
  (try
    (log/info (format "Evaluating similarity for %s::%s and %s::%s" source-type source-id target-types target-ids))
    (let [targets (pmap (fn [[target-type target-id]] (format "%s::%s" target-type target-id))
                        (zipper target-types target-ids))
          similarity (py/call-attr @nm-module "eval_similarities" @model-map
                                   (format "%s::%s" source-type source-id) targets)]
      {:topkpd (format-similarity-topkpd (py/call-attr similarity "to_numpy"))})
    (catch Exception e
      (println "Error while evaluating similarity:" (.getMessage e))
      {:topkpd []})))

(defn format-dimensional-reduction-data
  [data]
  ;; The order of the items in data is [x, y, node_id, node_type, raw_node_id], please refer to the source code of pydl.nm
  (pmap (fn [item] (let [item (py/->jvm item)]
                     {:x (first item)
                      :y (nth item 1)
                      :node_type (nth item 2)
                      :node_id (nth item 3)
                      :raw_node_id (nth item 4)})) data))

(defn dim-reduction
  "Evaluate the similarities between source and targets.
   
   Arguments:
    source-type: the type of source entity, e.g., Disease
    source-id: the id of source entity, e.g., MESH:D015673
    target-types: a list of target types, e.g., [Compound Disease]
    target-ids: a list of target ids, e.g., [DB00843 MESH:D015673]
   
   Return: 
    a list of vectors
  "
  [source-type source-id target-types target-ids]
  (when (not @model-map)
    (throw (Exception. "You need to call init-model! function firstly.")))
  (try
    (let [targets (pmap (fn [[target-type target-id]] (format "%s::%s" target-type target-id))
                        (zipper target-types target-ids))
          df (py/call-attr @nm-module "dim_reduction" @model-map
                           (format "%s::%s" source-type source-id) targets)]
      (log/info (format "Dim reduction for %s::%s and %s" source-type source-id targets))
      {:data (format-dimensional-reduction-data (py/call-attr df "to_numpy"))})
    (catch Exception e
      (println "Error while evaluating similarity:" (.getMessage e))
      {:data []})))

(comment
  (def source-id "MESH:D015673")
  (def relations ["Hetionet::CtD::Compound:Disease",
                  "GNBR::T::Compound:Disease", "DRUGBANK::treats::Compound:Disease"])
  (def r (predict source-id relations)))