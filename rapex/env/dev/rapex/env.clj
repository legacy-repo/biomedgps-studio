(ns rapex.env
  (:require
    [selmer.parser :as parser]
    [clojure.tools.logging :as log]
    [rapex.dev-middleware :refer [wrap-dev]]))

(def defaults
  {:init
   (fn []
     (parser/cache-off!)
     (log/info "-=[rapex started successfully using the development profile]=-"))
   :stop
   (fn []
     (log/info "-=[rapex has shut down successfully]=-"))
   :middleware wrap-dev})
