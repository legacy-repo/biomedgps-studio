(ns rapex.db.sql-helper
  (:require [clojure.string :as string]
            [hugsql.parameters :refer [identifier-param-quote]]))

(defn where-clause
  ([query-map options ^String primary-table]
   (let [vec-map       (into {} (filter #(coll? (val %)) query-map))
         other-map     (into {} (filter #((complement coll?) (val %)) query-map))
         primary-table (if primary-table (str primary-table ".") nil)]
     (str "WHERE "
          (string/join " AND "
                       (concat
                        (for [[field _] other-map]
                          (str primary-table (identifier-param-quote (name field) options)
                               " = :v:query-map." (name field)))
                        (for [[field _] vec-map]
                          (str primary-table (identifier-param-quote (name field) options)
                               " in (:v*:query-map." (name field) ")")))))))
  ([query-map options] (where-clause query-map options nil)))
