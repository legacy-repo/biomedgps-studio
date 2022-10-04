(ns rapex.R.core
  (:require [rapex.config :refer [env]]
            [rojure.core :as rojure :refer [r-eval]]
            [clojure.tools.logging :as log]
            [local-fs.core :as fs-lib])
  (:import [org.rosuda.REngine.Rserve RConnection]))

(defn start-r!
  []
  (let [port (:r-serve-port env)
        init-script (:r-init-script env)]
    (-> (rojure/start-rserve port init-script)
        (doto (log/info (format "Launch Rserve on %s with `%s`" port init-script)))
        :process)))

(defn stop-r!
  [process]
  (let [rconn (rojure/get-r "localhost" (:r-serve-port env))]
    (.close ^RConnection rconn))
  (log/info "Stop Rserve...")
  (.destroy process))

(defn read-rcode
  [rfile]
  (try
    (when (fs-lib/exists? rfile)
      (slurp rfile))
    (catch Exception e
      (throw (ex-info "No such R code file." {:rcode-file rfile
                                              :context e})))))

(defn test-rcode
  [dest-dir log-path]
  (let [rconn (rojure/get-r "localhost" (:r-serve-port env))]
    (rojure/r-get rconn (read-rcode "./examples/code/ggplot2.R"))
    (rojure/r-get rconn (format "draw_boxplot(\"%s\")"
                                (fs-lib/join-paths dest-dir "boxplot.json")))))

(comment
  (def rconn (rojure/get-r "localhost" (:r-serve-port env)))
  (rojure/r-eval rconn "x = 42")
  (= [42.0] (rojure/r-get rconn "x"))
  (rojure/r-get rconn (read-rcode "./examples/code/ggplot2.R")))