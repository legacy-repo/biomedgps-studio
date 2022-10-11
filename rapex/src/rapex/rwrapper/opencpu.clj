(ns rapex.rwrapper.opencpu
  (:require [opencpu-clj.ocpu :as ocpu]
            [clojure.data.json :as json]
            [clojure.tools.logging :as log])
  (:import [clojure.lang IPersistentMap]))


(def ocpu-api-service (atom "http://localhost:5656/"))
(def library-name "apga")

(defn setup-ocpu-api-service
  [^String api-service]
  (reset! ocpu-api-service api-service))

(defn- check-status
  [resp]
  (let [status (:status resp)]
    (cond
      (= status 200) (:result resp)
      (= status 201) (:result resp)
      (= status 400) (throw (ex-info (:result resp) {:code :bad-request}))
      (= status 404) (throw (ex-info (:result resp) {:code :not-found}))
      (= status 500) (throw (ex-info (:result resp) {:code :internal-error}))
      :else resp)))

(defn service-ok?
  []
  (try
    (check-status (ocpu/session @ocpu-api-service "/ocpu/info" ""))
    true
    (catch Exception e
      (log/error (format "Service is down, reason is %s" (.toString e)))
      false)))

(defn format-params
  [^IPersistentMap params]
  (->> (map (fn [key] [key (json/write-str (get params key))]) (keys params))
       (into (hash-map))))

(defn check-params
  [^IPersistentMap params]
  ;; TODO: Check parameters with schema.
  params)

(defn draw-plot!
  "Draw a plot with several parameters.
   
   NOTE: Each plot function need to accept a output_file parameter.
  "
  [plot-name & {:keys [params out-filename] :or {params {} out-filename "plotly.json"}}]
  (let [params (merge params {:output_file out-filename})
        params (-> params
                   check-params
                   format-params)]
    (ocpu/object @ocpu-api-service :library library-name :R plot-name params)))

(defn- read-output
  [resp pattern]
  (try
    (let [result (check-status resp)
          outs (filter (fn [item] (re-matches pattern item)) result)
          output-file (if (== 1 (count outs)) (first outs) nil)]
      (-> (ocpu/session @ocpu-api-service output-file "")
          check-status))
    (catch Exception e
      (log/error (format "Cannot fetch the output, reason is %s" (.toString e)))
      (throw e))))

(defn read-log!
  [resp]
  (read-output resp #"/ocpu/tmp/.*/console"))

(defn read-plot!
  [resp]
  (read-output resp #"/ocpu/tmp/.*/files/plotly.json"))

(comment
  (service-ok?)
  (def d1 (map (fn [gene] {:gene_symbol gene :group "Control" :value (first (repeatedly #(rand-int 100)))}) (repeat 12 "TP53")))
  (def d2 (map (fn [gene] {:gene_symbol gene :group "Test" :value (first (repeatedly #(rand-int 100)))}) (repeat 12 "TP53")))
  (def d (concat d1 d2))
  (def resp (draw-plot! "boxplot" :params {:d d}))
  (read-log! resp)
  (read-plot! resp))