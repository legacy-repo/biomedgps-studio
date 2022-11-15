(ns rapex.tasks.common-sepcs
  (:require [clojure.spec.alpha :as s]))

(s/def ::datatype #{"fpkm" "tpm" "counts"})
(s/def ::method #{"t.test" "wilcox.test" "anova" "kruskal.test"})
(s/def ::log_scale boolean?)
(s/def ::jitter_size number?)
(s/def ::position #{"dodge" "stack" "fill"})
(s/def ::dataset (s/and string? #(some? (re-matches #"[0-9]+" %))))
(s/def ::corr_type #{"pearson" "spearman"})
(s/def ::scale #{"none" "row" "col"})
(s/def ::show_colnames boolean?)
(s/def ::show_rownames boolean?)

(def organ-sets #{"gut" "hrt" "kdn" "lng" "lvr" "tst" "tyr" "brn" "nse" "bld" "buc"})
