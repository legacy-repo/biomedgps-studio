(ns rapex.db.query-duckdb
  (:require [next.jdbc :as jdbc]
            [honey.sql :as sql]
            [rapex.config :refer [env]]
            [clojure.tools.logging :as log]
            [local-fs.core :as fs-lib])
  (:import [org.duckdb DuckDBDriver]
           [java.sql DriverManager SQLException]
           [java.lang IllegalStateException IllegalArgumentException]
           [clojure.lang PersistentArrayMap Keyword]
           [java.util Properties]))

(defn custom-ex-info
  [^String msg ^Keyword code ^PersistentArrayMap info-map]
  (ex-info msg
           (merge {:code code} info-map)))

(def ro-prop (doto (new Properties)
               (.setProperty "duckdb.read_only" "true")))

(defn get-connection
  [^String database]
  (DriverManager/getConnection (format "jdbc:duckdb:%s" database) ro-prop))

(defn get-results
  "Get records based on user's query string.
  "
  [^String dbpath ^PersistentArrayMap sqlmap]
  (try
    (let [sqlstr (sql/format sqlmap)]
      (log/debug "Query String:" sqlstr)
      (with-open [con (get-connection dbpath)]
        (jdbc/execute! con sqlstr)))
    (catch Exception e
      (condp (fn [cs t] (some #(instance? % t) cs)) e

        [IllegalStateException IllegalArgumentException]
        (throw (custom-ex-info "Cannot format your query string."
                               :bad-request
                               {:query_str (str sqlmap)
                                :error e}))

        [SQLException]
        (throw (custom-ex-info "Please check your query string, it has illegal argument."
                               :bad-request
                               {:query_str (str sqlmap)
                                :error e
                                :formated_str (str (sql/format sqlmap))}))

        ;; whe pass through the exception when not handled
        (throw e)))))

(defn get-total
  "Get total number of records based on user's query string.
   
   (get-total \"./rapex_expr.duckdb\" {:select [:*] :from :gut_000000_fpkm})
  "
  ^Integer [^String dbpath ^PersistentArrayMap sqlmap]
  (let [sqlmap (merge sqlmap {:select [[:%count.* :total]]})
        cleaned-sqlmap (apply dissoc sqlmap [:limit :offset :order-by])
        results (get-results dbpath cleaned-sqlmap)]
    ;; [{:total 333}]
    (:total (first results))))

(defn read-string-as-map
  "Read string and convert it to a hash map which is accepted by honey library.
  "
  ^PersistentArrayMap [^String query-string]
  (try
    (read-string query-string)
    (catch Exception e
      (throw (custom-ex-info "Wrong query string."
                             :bad-request
                             {:query-string query-string
                              :error (.getMessage e)})))))

(comment
  (def db "/Users/codespace/Documents/Code/Rapex/rapex/db/rapex_expr.duckdb")
  (def sqlmap {:select [:*]
               :from   [:gut_000000_counts]
               :limit 10})
  (get-results db sqlmap))

(defn list-db
  "List all database in a directory.
   
   {:rapex_degs \"/Users/codespace/Documents/Code/Rapex/rapex/db/rapex_degs.duckdb\"
    :rapex_expr \"/Users/codespace/Documents/Code/Rapex/rapex/db/rapex_expr.duckdb\"}
  "
  ^PersistentArrayMap [^String datadir]
  (let [allfiles (map #(.getPath %) (fs-lib/list-dir datadir))
        alldbs (filter #(re-matches #".*.duckdb$" %) allfiles)
        db-map-lst (map (fn [dbpath] {(keyword (fs-lib/base-name dbpath true)) dbpath}) alldbs)]
    (into {} db-map-lst)))

(def memoized-list-db (memoize list-db))

(defn get-db-path
  "Get the absolute path of a database file.
  "
  ^String [^String dbname]
  (let [datadir (:datadir env)
        dbs (memoized-list-db datadir)
        db-path ((keyword dbname) dbs)]
    (if db-path
      db-path
      (throw (custom-ex-info (format "Cannot find the database %s." dbname)
                             :not-found
                             {:datadir datadir
                              :available-databases dbs})))))

(comment
  (list-db "/Users/codespace/Documents/Code/Rapex/rapex/db")
  (get-db-path "rapex_expr"))