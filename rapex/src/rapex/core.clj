(ns rapex.core
  (:gen-class)
  (:require [rapex.handler :as handler]
            [rapex.nrepl :as nrepl]
            [luminus.http-server :as http]
            [luminus-migrations.core :as migrations]
            [rapex.config :refer [env check-config get-migration-config]]
            [clojure.tools.cli :refer [parse-opts]]
            [clojure.tools.logging :as log]
            [rapex.tasks :as tasks]
            [mount.core :as mount]
            [rapex.R.core :as rcore]))

;; log uncaught exceptions in threads
(Thread/setDefaultUncaughtExceptionHandler
 (reify Thread$UncaughtExceptionHandler
   (uncaughtException [_ thread ex]
     (log/error {:what :uncaught-exception
                 :exception ex
                 :where (str "Uncaught exception on" (.getName thread))}))))

(def cli-options
  [["-p" "--port PORT" "Port number"
    :parse-fn #(Integer/parseInt %)]])

(mount/defstate ^{:no-reload :noop} event-listener
  :start (tasks/start-tasks!)
  :stop (tasks/stop-tasks!))

;; (mount/defstate ^{:on-reload :noop} r-server
;;   :start
;;   (rcore/start-r!)
;;   :stop
;;   (rcore/stop-r! r-server))

(mount/defstate ^{:on-reload :noop} http-server
  :start
  (http/start
   (-> env
       (assoc  :handler (handler/app))
       (update :port #(or (-> env :options :port) %))))
  :stop
  (http/stop http-server))

(mount/defstate ^{:on-reload :noop} repl-server
  :start
  (when (env :nrepl-port)
    (nrepl/start {:bind (env :nrepl-bind)
                  :port (env :nrepl-port)}))
  :stop
  (when repl-server
    (nrepl/stop repl-server)))

(defn init-jndi []
  (System/setProperty "java.naming.factory.initial"
                      "org.apache.naming.java.javaURLContextFactory")
  (System/setProperty "java.naming.factory.url.pkgs"
                      "org.apache.naming"))

(defn start-app [args]
  (init-jndi)
  (doseq [component (-> args
                        (parse-opts cli-options)
                        mount/start-with-args
                        :started)]
    (log/info component "started"))
  (.addShutdownHook (Runtime/getRuntime) (Thread. handler/destroy)))

(defn -main
  "Launch Rapex Service in standalone mode."
  [& args]
  (log/info "Starting Rapex Service in STANDALONE mode")
  ; Load configuration from system-props & env
  (mount/start #'rapex.config/env)
  (check-config env)
  (cond
    ;; Run a command like `java -jar rapex.jar init-*`
    ;; Initializes the database using the script specified by the :init-script key opts
    ;; https://github.com/luminus-framework/luminus-migrations/blob/23a3061b5baaeb6a0ee44eb2f3df3a7fcaacf2da/src/luminus_migrations/core.clj#L55
    (some #{"init"} args) (do
                            (when (or (nil? (:init-script env)) (= "" (:init-script env)))
                              (log/error "Init script file not found, :init-script evironment variable must be set before running")
                              (System/exit 1))
                            (migrations/init (get-migration-config env))
                            (System/exit 0))
    ;; More details on https://luminusweb.com/docs/migrations.html
    ;; Run a command like `java -jar rapex.jar migrate release-locks` or `lein run migrate release-locks`
    (migrations/migration? args) (do
                                   (migrations/migrate args (get-migration-config env))
                                   (System/exit 0))
    ;; With no command line args just start Datains normally
    :else (start-app args)))

