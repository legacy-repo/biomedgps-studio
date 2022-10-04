(ns rapex.tasks
  (:require [tservice-core.core :as tc]
            [rapex.db.handler :as db-handler]
            [rapex.config :refer [make-minio-link get-workdir]]))

(defn start-tasks!
  "After you set the custom namespace, such as rapex.tasks, 
   the initialize-envent! function will search the event-inits function in these namespace and load it.
   
   Then all async tasks will be loaded and you can trigger these tasks by publish-event! function."
  []
  (tc/setup-custom-fns db-handler/create-task! db-handler/update-task! make-minio-link)
  (tc/setup-custom-workdir-root (get-workdir))
  (tc/setup-custom-namespace "rapex" :sub-ns "tasks")
  (tc/start-events!))

(defn stop-tasks!
  "After you set the custom namespace, such as rapex.tasks, 
   the initialize-envent! function will search the event-inits function in these namespace and load it.
   
   Then all async tasks will be loaded and you can trigger these tasks by publish-event! function."
  []
  (tc/stop-events!))
