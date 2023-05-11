(ns rapex.rwrapper.opencpu
  (:require [opencpu-clj.ocpu :as ocpu]
            [clojure.data.json :as json]
            [clojure.tools.logging :as log]
            [clj-http.client :as client]
            [clojure.java.io :as io]
            [local-fs.core :as fs-lib]
            [clojure.string :as clj-str])
  (:import [clojure.lang IPersistentMap]))


(def ocpu-api-service (atom "http://localhost:5656"))
(def library-name "apga")

(defn setup-ocpu-api-service
  "Setup the ocpu api service url, such as http://localhost:5656.
   The url should not end with a slash."
  [^String api-service]
  (reset! ocpu-api-service (clj-str/replace api-service #"/$" "")))

(defn- check-status
  "Check the status of the response, if the status is not 200, then throw an exception."
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
  "Check the status of the service, if the service is ok, then return true, else return false."
  []
  (try
    (check-status (ocpu/session @ocpu-api-service "/ocpu/info" ""))
    true
    (catch Exception e
      (log/error (format "Service is down, reason is %s" (.toString e)))
      false)))

(defn format-params
  "Format the parameters which is a map, the value of the map can be a number, a boolean or a map.
   If the value is a map, then convert it to a json string."
  [^IPersistentMap params]
  (->> (map (fn [key] (let [value (get params key)
                            formated-value (cond (number? value) value
                                                 (boolean? value) value
                                                 :else (json/write-str value))]
                        [key formated-value]))
            (keys params))
       (into (hash-map))))

(defn check-params
  [^IPersistentMap params]
  ;; TODO: Check parameters with schema.
  params)

(defn draw-plot!
  "Draw a plot with several parameters.
   
   NOTE: 
     - Each plot function need to accept a output_file parameter.
       output_file cannot be an absolute path, if it be, then you will get an error, such as 'Unparsable argument: \\/Users\\/codespace\\/Downloads\\/plotly.json'.
       Maybe the opencpu don't accept an external path?
  "
  [plot-name & {:keys [params out-filename] :or {params {} out-filename "plotly.json"}}]
  (let [params (merge params {:output_file out-filename})
        params (-> params
                   check-params
                   format-params)]
    (ocpu/object @ocpu-api-service :library library-name :R plot-name params)))

(defn- download-file!
  "Download a file from the ocpu server."
  [filelink filepath]
  (io/copy (:body (client/get filelink {:as :stream}))
           (java.io.File. filepath)))

(defn- read-output
  "Get the output file from the ocpu server, the output file maybe a log file, a plot file or a pdf file.
   If the as-file? is true, then download the file to the filepath, else return the file content."
  [resp pattern & {:keys [as-file? filepath] :or {as-file? false}}]
  (try
    (let [result (check-status resp)
          outs (filter (fn [item] (re-matches pattern item)) result)
          output-file (if (== 1 (count outs)) (first outs) nil)]
      (log/info (format "Get output from %s" output-file))
      (if as-file?
        (let [filelink (str @ocpu-api-service "/" (clj-str/replace output-file #"^/" ""))
              filepath (or filepath (fs-lib/basename filelink))]
          (download-file! filelink filepath))
        (-> (ocpu/session @ocpu-api-service output-file "")
            check-status)))
    (catch Exception e
      (log/error (format "Cannot fetch the output, reason is %s" (.toString e)))
      (throw e))))

(defn read-log!
  "Wrapper of read-output, read the log file from the ocpu server."
  [resp]
  (read-output resp #"/ocpu/tmp/.*/console" :as-file? false))

(defn read-plot!
  "Wrapper of read-output, read the plot file from the ocpu server."
  [resp filepath]
  (read-output resp #"/ocpu/tmp/.*/files/plotly.json" :filepath filepath :as-file? true))

(defn read-pdf!
  "Wrapper of read-output, read the pdf file from the ocpu server."
  [resp filepath]
  (read-output resp #"/ocpu/tmp/.*/files/plotly.pdf" :filepath filepath :as-file? true))

(defn read-png!
  "Wrapper of read-output, read the png file from the ocpu server."
  [resp filepath]
  (read-output resp #"/ocpu/tmp/.*/files/plotly.png" :filepath filepath :as-file? true))

(comment
  (service-ok?)
  (def d1 (map (fn [gene] {:gene_symbol gene :group "Control" :value (first (repeatedly #(rand-int 100)))}) (repeat 12 "TP53")))
  (def d2 (map (fn [gene] {:gene_symbol gene :group "Test" :value (first (repeatedly #(rand-int 100)))}) (repeat 12 "TP53")))
  (def d (concat d1 d2))
  (def resp (draw-plot! "boxplotly" :params {:d d}))
  (read-log! resp)
  (read-plot! resp "/tmp/test.json")
  (read-pdf! resp "/tmp/test.pdf"))