(ns rapex.handler
  (:require
   [rapex.middleware.wrapper :as wrapper]
   [rapex.routes.core :as app-routes]
   [reitit.ring :as ring]
   [ring.middleware.content-type :refer [wrap-content-type]]
   [ring.middleware.webjars :refer [wrap-webjars]]
   [rapex.env :refer [defaults]]
   [mount.core :as mount]
   [clojure.tools.logging :as log]
   [reitit.spec :as rs]
   [reitit.dev.pretty :as pretty]
   [rapex.config :refer [env]]))

(mount/defstate init-app
  :start ((or (:init defaults) (fn [])))
  :stop  ((or (:stop defaults) (fn []))))

(defn init
  "init will be called once when
   app is deployed as a servlet on
   an app server such as Tomcat
   put any initialization code here"
  []
  (doseq [component (:started (mount/start))]
    (log/info component "started")))

(defn destroy
  "destroy will be called when your application
   shuts down, put any clean up code here"
  []
  (doseq [component (:stopped (mount/stop))]
    (log/info component "stopped"))
  (shutdown-agents)
  (log/info "rapex has shut down!"))

(mount/defstate routes
  :start
  (ring/ring-handler
   (ring/router
    [["/" {:get
           {:handler (constantly {:status 301 :headers {"Location" "/api/api-docs/index.html"}})}}]
     (app-routes/routes)]

    {:validate  rs/validate
     :exception pretty/exception})

   (ring/routes
    (wrap-content-type (wrap-webjars (constantly nil)))
    (ring/create-default-handler))))

(defn app []
  (wrapper/wrap-base ((:middleware defaults) #'routes)
                     :enable-cors (:enable-cors env)
                     :cors-origins (:cors-origins env)))
