(ns rapex.db.neo4j.core
  "This namespace contains the logic to connect to Neo4j instances,
  create and run queries as well as creating an in-memory database for
  testing."
  (:require [rapex.db.neo4j.compatibility :refer [neo4j->clj clj->neo4j]])
  (:import (org.neo4j.driver GraphDatabase AuthTokens Config AuthToken Driver Session)
           (org.neo4j.driver.exceptions TransientException)
           (java.net URI)
           (org.neo4j.driver.internal.logging ConsoleLogging)
           (java.util.logging Level)))

;; Connecting to dbs

(defn config [options]
  (let [logging (:logging options (ConsoleLogging. Level/CONFIG))]
    (-> (Config/builder)
        (.withLogging logging)
        (.build))))

(defn connect
  "Returns a connection map from an url. Uses BOLT as the only communication
  protocol.
  You can connect using a url or a url, user, password combination.
  Either way, you can optioninally pass a map of options:
  `:logging`   - a Neo4j logging configuration, e.g. (ConsoleLogging. Level/FINEST)"
  ([^URI uri user password]
   (connect uri user password nil))
  ([^URI uri user password options]
   (let [^AuthToken auth (AuthTokens/basic user password)
         ^Config config (config options)
         db (GraphDatabase/driver uri auth config)]
     {:url        uri,
      :user       user,
      :password   password,
      :db         db
      :destroy-fn #(.close db)}))

  ([^URI uri]
   (connect uri nil))

  ([^URI uri options]
   (let [^Config config (config options)
         db (GraphDatabase/driver uri, config)]
     {:url        uri,
      :db         db,
      :destroy-fn #(.close db)})))

(defn disconnect 
  "Disconnect a connection"
  [db]
  ((:destroy-fn db)))

;; Sessions and transactions

(defn get-session [^Driver connection]
  (.session (:db connection)))

(defn- make-success-transaction [tx]
  (proxy [org.neo4j.driver.Transaction] []
    (run
      ([q] (.run tx q))
      ([q p] (.run tx q p)))
    (commit [] (.commit tx))
    (rollback [] (.rollback tx))

    ;; We only want to auto-success to ensure persistence
    (close []
      (.commit tx)
      (.close tx))))

(defn get-transaction [^Session session]
  (make-success-transaction (.beginTransaction session)))

;; Executing cypher queries

(defn execute
  ([sess query params]
   (neo4j->clj (.run sess query (clj->neo4j params))))
  ([sess query]
   (neo4j->clj (.run sess query))))

(defn create-query
  "Convenience function. Takes a cypher query as input, returns a function that
  takes a session (and parameter as a map, optionally) and return the query
  result as a map."
  [cypher]
  (fn
    ([sess] (execute sess cypher))
    ([sess params] (execute sess cypher params))))

(defmacro defquery
  "Shortcut macro to define a named query."
  [name ^String query]
  `(def ~name (create-query ~query)))

(defn retry-times [times body]
  (let [res (try
              {:result (body)}
              (catch TransientException e#
                (if (zero? times)
                  (throw e#)
                  {:exception e#})))]
    (if (:exception res)
      (recur (dec times) body)
      (:result res))))

(defmacro with-transaction [connection tx & body]
  `(with-open [~tx (get-transaction (get-session ~connection))]
     ~@body))

(defmacro with-retry [[connection tx & {:keys [max-times] :or {max-times 1000}}] & body]
  `(retry-times ~max-times
                (fn []
                  (with-transaction ~connection ~tx ~@body))))
