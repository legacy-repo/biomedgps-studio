(ns rapex.config
  (:require [clojure.spec.alpha :as s]
            [expound.alpha :refer [expound-str]]
            [cprop.core :refer [load-config]]
            [cprop.source :as source]
            [clojure.string :as clj-str]
            [clojure.tools.logging :as log]
            [clojure.java.io :refer [file]]
            [mount.core :refer [args defstate]]
            [local-fs.core :as fs-lib]
            [clojure.data.json :as json]
            [rapex.version :as v]))

(defstate env
  :start (load-config :merge [(args)
                              (source/from-system-props)
                              (source/from-env)]))

(defn get-migration-config
  [env]
  (merge {:migration-dir "migrations"}
         (select-keys env [:database-url :init-script])))

;; -------------------------------- Config Spec --------------------------------
(defn exists?
  [filepath]
  (.exists (file filepath)))

;; More details on https://stackoverflow.com/q/13621307
(s/def ::port (s/int-in 1024 65535))

(s/def ::nrepl-port (s/int-in 1024 65535))

(s/def ::workdir (s/and string? exists?))

(s/def ::dataset-metadata (s/and string? exists?))

(s/def ::datadir (s/and string? exists?))

(s/def ::database-url (s/and string? #(some? (re-matches #"jdbc:postgresql:.*" %))))

(s/def ::graph-database-url (s/and string? #(some? (re-matches #"neo4j:.*" %))))

;; Service
(s/def ::fs-service #{"minio" "oss" "s3"})

(s/def ::fs-endpoint #(some? (re-matches #"https?:\/\/.*" %)))

(s/def ::fs-access-key string?)

(s/def ::fs-secret-key string?)

(s/def ::fs-rootdir (s/nilable (s/and string? exists?)))

(s/def ::service (s/keys :req-un [::fs-service ::fs-endpoint ::fs-access-key ::fs-secret-key]
                         :opt-un [::fs-rootdir]))

(s/def ::fs-services (s/coll-of ::service))

(s/def ::default-fs-service #{"minio" "oss" "s3"})

(s/def ::enable-cors boolean?)

(s/def ::cors-origins (s/nilable (s/coll-of string?)))

(s/def ::default-dataset string?)

; Studio Configuration
(s/def ::about_url #(some? (re-matches #"(https?://|/).*" %)))

(s/def ::help_url #(some? (re-matches #"(https?://|/).*" %)))

(s/def ::website_title string?)

(s/def ::website_description string?)

(s/def ::website_logo #(some? (re-matches #"(https?://|/).*" %)))

(s/def ::default_dataset string?)

(s/def ::studio-config (s/keys :req-un [::about_url ::help_url ::website_title
                                        ::website_logo ::website_description]
                               :opt-un [::default_dataset]))

(s/def ::config (s/keys :req-un [::port ::workdir ::datadir ::default-dataset ::dataset-metadata
                                 ::graph-database-url ::database-url]
                        :opt-un [::nrepl-port ::cors-origins ::enable-cors
                                 ::fs-services ::default-fs-service ::studio-config]))

(defn check-config
  [env]
  (let [config (select-keys env [:port :nrepl-port :workdir :datadir :default-dataset
                                 :cors-origins :enable-cors :database-url :dbtype :graph-database-url
                                 :fs-services :default-fs-service :dataset-metadata
                                 :studio-config])]
    (when (not (s/valid? ::config config))
      (log/error "Configuration errors:\n" (expound-str ::config config))
      (System/exit 1))))

(defn get-minio-rootdir
  [env]
  (let [fs-services (:fs-services env)
        fs-rootdir (->> fs-services
                        (filter #(= (:fs-service %) "minio"))
                        (first)
                        (:fs-rootdir))
        fs-rootdir (or fs-rootdir "")]
    fs-rootdir))

(defn make-minio-link
  "Replace an absolute path with minio link."
  [abspath]
  (let [minio-rootdir (get-minio-rootdir env)
        trimmed (str (clj-str/replace minio-rootdir #"/$" "") "/")]
    (clj-str/replace abspath (re-pattern trimmed) "minio://")))

(defn get-workdir
  []
  (:workdir env))

(defn get-datadir
  []
  (:datadir env))

(defn get-default-dataset
  []
  (:default-dataset env))

(defn get-dataset-metadata
  []
  (let [content (slurp (:dataset-metadata env))]
    (json/read-str content :key-fn keyword)))

(defn get-label-blacklist
  []
  (or (:label-blacklist (:graph-config env)) []))

(def memorized-get-dataset-metadata (memoize get-dataset-metadata))

(def memorized-get-version (memoize (fn [] (v/get-version "com.github.rapex-lab" "rapex"))))

(defn get-real-path
  "Replace a minio link to an absolute path."
  [object-link]
  (let [minio-rootdir (get-minio-rootdir env)
        datadir (get-datadir)
        is-minio (re-matches #"minio://.*" object-link)
        trimmed (clj-str/replace object-link #"minio://(/|./)?|file://(/|./)?" "")]
    (cond
      (= trimmed object-link)
      (throw (ex-info "Not a valid link." {}))

      is-minio
      (fs-lib/join-paths minio-rootdir trimmed)

      :else
      (fs-lib/join-paths datadir trimmed))))

(defn check-fs-root!
  [env]
  (let [fs-rootdir (get-minio-rootdir env)
        workdir (:workdir env)]
    (when-not (clj-str/starts-with? workdir fs-rootdir)
      (log/error (format "workdir(%s) must be the child directory of fs-rootdir(%s)"
                         workdir
                         fs-rootdir))
      (System/exit 1))))

(defn get-studio-config
  []
  (let [studio-config (:studio-config env)
        default-studio-config {:about_url "/about.md"
                               :help_url "/help.md"
                               :website_title "BioMedGPS"
                               :website_logo "/logo.png"
                               :website_description "An analytics platform based on omics data and knowledge graph."
                               :default_dataset (:default-dataset env)}]
    (if studio-config
      (merge default-studio-config (select-keys studio-config [:about_url :help_url :website_title
                                                               :website_logo :website_description]))
      default-studio-config)))
