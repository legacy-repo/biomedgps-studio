(ns rapex.models.gnn
  (:require [libpython-clj2.require :refer [require-python]]
            [libpython-clj2.python :as py :refer [call-attr]]))

(def model-map (atom nil))

(defn init-model!
  []
  (require-python '[pydl.nm :as nm :bind-ns true])
  (if-let [load_model (find-var 'pydl.nm/load_model)]
    (reset! model-map (load_model))
    (throw (Exception. "Cannot find the nm submodule in pydl package."))))

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

(defn predict
  "You need to make sure that source-id matches the type of entity in relations."
  [source-id relations & {:keys [topk]
                          :or {topk 100}}]
  (require-python '[pydl.nm :as nm :bind-ns true])
  (when (not @model-map)
    (throw (Exception. "You need to call init-model! function firstly.")))
  (if-let [[query relation_each relation_ave]
           [(find-var 'pydl.nm/query) (find-var 'pydl.nm/relation_each) (find-var 'pydl.nm/relation_ave)]]
    (let [results (query @model-map relations source-id)
          topkpd (relation_each @model-map results :topk topk)
          topkpd-ave (relation_ave @model-map results :topk topk)]
      {:topkpd (format-topkpd (call-attr topkpd "to_numpy"))
       :topkpd_ave (format-topkpd-ave (call-attr topkpd-ave "to_numpy"))})
    (throw (Exception. "Cannot find the nm submodule in pydl package."))))

(comment
  (def source-id "MESH:D015673")
  (def relations ["Hetionet::CtD::Compound:Disease",
                  "GNBR::T::Compound:Disease", "DRUGBANK::treats::Compound:Disease"])
  (def r (predict source-id relations)))