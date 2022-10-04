(ns rapex.middleware.wrapper
  (:require
   [ring-ttl-session.core :refer [ttl-memory-store]]
   [ring.middleware.cors :refer [wrap-cors]]
   [ring.middleware.x-headers :refer [wrap-frame-options]]
   [ring.middleware.defaults :refer [site-defaults wrap-defaults]]))

(defn enable-wrap-cors
  [handler & {:keys [enable-cors cors-origins]
              :or {enable-cors false
                   cors-origins nil}}]
  (if enable-cors
    (wrap-cors handler
               :access-control-allow-origin (if (some? cors-origins) (map #(re-pattern %) cors-origins) [#".*"])
               :access-control-allow-methods [:get :put :post :delete :options])
    handler))

(defn wrap-base [handler & {:keys [enable-cors cors-origins]
                            :or {enable-cors false
                                 cors-origins nil}}]
  (-> handler
      (wrap-defaults
       (-> site-defaults
           (assoc-in [:security :anti-forgery] false)
           (assoc-in  [:session :store] (ttl-memory-store (* 60 30)))))
      (enable-wrap-cors :enable-cors enable-cors :cors-origins cors-origins)
      (wrap-frame-options {:allow-from "*"})))
