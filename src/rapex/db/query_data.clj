(ns rapex.db.query-data
  (:require [next.jdbc :as jdbc]
            [honey.sql :as sql]
            [rapex.config :refer [env]]
            [clojure.tools.logging :as log]
            [local-fs.core :as fs-lib]
            [clojure.java.io :as io]
            [clojure.string :as clj-str]
            [next.jdbc.result-set :as rs])
  (:import [org.duckdb DuckDBDriver]
           [java.sql DriverManager SQLException]
           [java.lang IllegalStateException IllegalArgumentException]
           [clojure.lang PersistentArrayMap Keyword]
           [java.util Properties]))

(defn custom-ex-info
  [^String msg ^Keyword code ^PersistentArrayMap info-map]
  (ex-info msg
           (merge {:code code} info-map)))

(def default-datadir (atom (:datadir env)))
(def default-dbtype (atom (:dbtype env)))

(defn setup-datadir
  [path]
  (reset! default-datadir path))

(defn setup-default-dbtype
  [dbtype]
  (reset! default-dbtype dbtype))

(def ro-prop (doto (new Properties)
               (.setProperty "duckdb.read_only" "true")))

(defn get-connection
  [^String database]
  (if (clj-str/ends-with? database "duckdb")
    (DriverManager/getConnection (format "jdbc:duckdb:%s" database) ro-prop)
    (jdbc/get-connection (format "jdbc:sqlite:%s" database))))

(defn get-results
  "Get records based on user's query string.
   
   Known Issues:
     1. The duckdb will returns all data when we use order-by clause with limit and offset.
  "
  [^String dbpath ^PersistentArrayMap sqlmap]
  (try
    (let [sqlstr (sql/format sqlmap)]
      (log/info "Query String:" sqlstr)
      (with-open [con (get-connection dbpath)]
        (jdbc/execute! con sqlstr {:builder-fn rs/as-unqualified-maps})))
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
   
   (get-total \"./examples/db/000000.duckdb\" {:select [:*] :from :gut_fpkm})
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
    ;; Don't use read-string, it will convert string to keyword.
    ;; (json/read-str query-string :key-fn #(keyword (subs % 1)))
    (catch Exception e
      (throw (custom-ex-info "Wrong query string."
                             :bad-request
                             {:query-string query-string
                              :error (.getMessage e)})))))

(comment
  (def db "./examples/db/000000.sqlite")
  (def sqlmap {:select [:*]
               :from   [:gut_counts]
               :limit 10})
  (get-results db sqlmap))

(defn list-files
  [datadir]
  (let [directory (io/file datadir)
        dir? #(.isDirectory %)]
    (map #(.getPath %)
         (filter (comp not dir?)
                 (tree-seq dir? #(.listFiles %) directory)))))

(defn list-db
  "List all database in a directory.
   
   {:00000 \"./examples/db/000000.duckdb\"}
  "
  ^PersistentArrayMap [^String datadir]
  (let [allfiles (list-files datadir)
        alldbs (filter #(re-matches #".*.(duckdb|sqlite)$" %) allfiles)
        db-map-lst (map (fn [dbpath] {(keyword (fs-lib/base-name dbpath false)) dbpath}) alldbs)]
    (into {} db-map-lst)))

(def memoized-list-db (memoize list-db))

(defn get-db-path
  "Get the absolute path of a database file.
  "
  ^String [^String dbname & {:keys [dbtype datadir]
                             :or {dbtype "duckdb"
                                  datadir "./examples/db/"}}]
  (let [datadir (or @default-datadir datadir)
        dbtype (or @default-dbtype dbtype)
        dbs (memoized-list-db datadir)
        db-path ((keyword (format "%s.%s" dbname dbtype)) dbs)]
    (if db-path
      db-path
      (throw (custom-ex-info (format "Cannot find the database %s." dbname)
                             :not-found
                             {:datadir datadir
                              :available-databases dbs})))))

(comment
  (list-db "./examples/db")
  (setup-datadir "./examples/db")
  (get-db-path "000000" :dbtype "sqlite"))