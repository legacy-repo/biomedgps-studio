(ns rapex.db.query-gdata
  (:require [rapex.db.neo4j.core :as db]
            [clojure.string :as clj-str]
            [rapex.config :refer [env get-label-blacklist]]
            [clojure.tools.logging :as log]
            [reitit.ring.middleware.parameters :as parameters])
  (:import (java.net URI)))

(def gdb-conn (atom nil))
(def labels (atom []))
(def relationships (atom []))
(def node-properties (atom []))

(defn parse-url
  [url]
  (let [[base-url parameters] (clj-str/split url #"\?")
        parameters-map (->> (clj-str/split parameters #"&")
                            (map #(clj-str/split % #"="))
                            (map (fn [[k v]] [(keyword k) v]))
                            (into {}))]
    {:base-url base-url
     :parameters parameters-map}))

(defn setup-gdb-connection
  [gdb-url]
  (let [{:keys [base-url parameters]} (parse-url gdb-url)
        username (:user parameters)
        password (:password parameters)]
    (reset! gdb-conn (db/connect (URI. base-url)
                                 username
                                 password))))

(db/defquery q-all-labels
  "CALL db.labels()")

(db/defquery q-all-relationships
  "CALL db.relationshipTypes()")

(db/defquery q-nodetype-properties
  "CALL db.schema.nodeTypeProperties()")

(defn format-labels
  [output]
  (map (fn [item] (first (vals item))) output))

(defn format-relationships
  [output]
  (map (fn [item] (first (vals item))) output))

(defn convert-type
  [typename]
  ((keyword typename) {:String {:type "string"}
                       :StringArray {:type "array"
                                     :element_type "string"}
                       :Long {:type "number"}
                       :LongArray {:type "array"
                                   :element_type "number"}}))

(defn format-properties
  "
   # Examples
   {:mandatory false,
    :nodeLabels (\"Publication\"),
    :nodeType \":`Publication`\",
    :propertyName \"issue\",
    :propertyTypes (\"String\")}
   {:mandatory false,
    :nodeLabels (\"Publication\"),
    :nodeType \":`Publication`\",
    :propertyName \"DOI\",
    :propertyTypes (\"String\")}
  "
  [output]
  (->> (map (fn [item] {:required (:mandatory item)
                        :node_name (first (:nodeLabels item))
                        :node_type (clj-str/replace (:nodeType item) "`" "")
                        :attribute (:propertyName item)
                        :attribute_type (convert-type (first (:propertyTypes item)))}) output)
       (filter (fn [item] (not= (:node_name item) "User")))
       (group-by :node_name)))

(defn list-labels
  [tx]
  (if (empty? @labels)
    (let [all-labels (doall (sort (format-labels (q-all-labels tx))))
          all-labels (filter (fn [item] (< (.indexOf (get-label-blacklist) item) 0)) all-labels)]
      (reset! labels all-labels)
      all-labels)
    @labels))

(defn list-relationships
  [tx]
  (if (empty? @relationships)
    (let [all-rels (doall (sort (format-relationships (q-all-relationships tx))))]
      (reset! relationships all-rels)
      all-rels)
    @relationships))

(defn list-properties
  [tx & {:keys [^String node-name]}]
  (let [properties (if (empty? @node-properties)
                     (let [all-properties (doall (format-properties (q-nodetype-properties tx)))]
                       (reset! node-properties all-properties)
                       all-properties)
                     @node-properties)]
    (if node-name
      {node-name (get properties node-name)}
      properties)))

(def color-map
  {:Gene "black"
   :Transcript "red"
   :Protein "magenta"
   :Disease "blue"
   :Drug "cyan"
   :Phenotype "gray"})

(defn set-style
  [node-label nlabel]
  {:label {:value node-label}
   :badges [{:position "RT"
             :type "text"
             :value (clojure.string/upper-case (first nlabel))
             :size [15, 15]
             :fill ((keyword nlabel) color-map)
             :color "#fff"}]})

(defn format-node
  [node]
  (let [node-label (:id (:properties node))
        label (format "%s-%s" (:identity node) node-label)
        nlabel (first (:lables node))]
    (when node
      {:comboId  nil
       :id       (str (:identity node))
       :label    label
       :nlabel   nlabel
       :style    (set-style node-label nlabel)
       :category :nodes
       :type     "graphin-circle"
       :data     (merge (:properties node)
                        {:identity (str (:identity node))})})))

(defn format-relationship
  [relationship]
  (when relationship
    {:relid    (str (:identity relationship))
     :source   (str (:start relationship))
     :category :edges
     :target   (str (:end relationship))
     :reltype  (:type relationship)
     :style    {:label {:value (:type relationship)}}
     :data     (merge (:properties relationship)
                      {:identity (str (:identity relationship))})}))

(defn format-node-relationships
  [node-relationships]
  (map (fn [item] {:n (format-node (:n item))
                   :r (format-relationship (:r item))
                   :m (format-node (:m item))}) node-relationships))

(defn merge-node-relationships
  [formated-node-relationships]
  (apply concat (map (fn [item] [(:n item) (:r item) (:m item)]) formated-node-relationships)))

(defn limit
  [limit-clause]
  (if limit-clause
    (format "LIMIT %s" limit-clause)
    ""))

(defn skip
  [skip-clause]
  (if skip-clause
    (format "SKIP %s" skip-clause)
    ""))

(defn where
  [where-clause]
  (if where-clause
    (format "WHERE %s" where-clause)
    ""))

(defn match
  [match-clause]
  (if match-clause
    (format "MATCH %s" match-clause)
    (throw (Exception. "Match clause is missing."))))

(defn return
  [return-clause]
  (if return-clause
    (format "RETURN %s" return-clause)
    (throw (Exception. "Return clause is missing."))))

(defn make-query
  "
   {:match xxx :where xxx :return xxx :limit xxx}
  "
  [query-map]
  (let [query (format "%s %s %s %s %s"
                      (match (:match query-map))
                      (where (:where query-map))
                      (return (:return query-map))
                      (limit (:limit query-map))
                      (skip (:skip query-map)))]
    (log/info "Query neo4j with " query)
    (db/create-query query)))

(defn query-gdb
  [tx query-map]
  (->> ((make-query query-map) tx)
       (format-node-relationships)
       (merge-node-relationships)
       (distinct)
       (group-by :category)))

(db/defquery q-node-relationships
  "Match (n:Gene)-[r]-(m) RETURN n, r, m LIMIT $limit")

(db/defquery q-node-relationships-by-id
  "MATCH (n)-[r]-(m) WHERE id(n) = $id RETURN n, r, m")

(defn search-node-relationships
  " 
   # Example
   [{:n
      {:identity 91707,
       :lables (\"Gene\"),
       :properties
         {:name \"major histocompatibility complex, class II, DP alpha 1\",
          :id \"HLA-DPA1\",
          :family \"\"Histocompatibility complex|C1-set domain containing\"\",
          :taxid \"9606\",
          :synonyms (\"3113\" \"ENSG00000231389\" \"OTTHUMG00000031058\" \"uc021zsx.2\" \"X00457\")}},
     :r {:identity 542031, :start 91707, :end 262340, :type \"TRANSCRIBED_INTO\", :properties {}},
     :m
       {:identity 262340,
        :lables (\"Transcript\"),
        :properties
          {:assembly \"GCF_000001405.39\",
           :name \"major histocompatibility complex, class II, DP alpha 1, transcript variant 3\",
           :id \"NM_001242525.2\",
           :taxid \"9606\"}}}]
  "
  [tx node-type & {:keys [limit skip]}]
  (->> (query-gdb tx {:match (format "(n:%s)-[r]-(m)" node-type)
                      :return "n, r, m"
                      :limit limit
                      :skip skip})
       (format-node-relationships)
       (merge-node-relationships)
       (distinct)
       (group-by :category)))

(defn search-node-relationships-by-id
  [tx node-type id & {:keys [limit skip]}]
  (->> (query-gdb tx {:match (format "(n:%s)-[r]-(m)" node-type)
                      :where (format "id(n) = %s" id)
                      :return "n, r, m"
                      :limit limit
                      :skip skip})
       (format-node-relationships)
       (merge-node-relationships)
       (distinct)
       (group-by :category)))

(comment)