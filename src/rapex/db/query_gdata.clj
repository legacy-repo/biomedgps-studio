(ns rapex.db.query-gdata
  (:require [rapex.db.neo4j.core :as db]
            [clojure.string :as clj-str]
            [rapex.models.gnn :as gnn]
            [rapex.config :refer [env get-label-blacklist get-color-map]]
            [clojure.tools.logging :as log])
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

;; (def colors ["red" "green" "blue" "orange" "purple" "yellow" "pink" "brown" "grey" "black" "white" "cyan" "magenta"])
;; More details on https://colorbrewer2.org/#type=qualitative&scheme=Paired&n=9
(def colors ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c",
             "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6"])

(defn- format-nlabel
  [item]
  (clj-str/replace item " " "_"))

(defn gen-color-map
  []
  (with-open [session (db/get-session @gdb-conn)]
    (let [labels (->> (list-labels session)
                      sort
                      (map (fn [item] (keyword (format-nlabel item)))))
          colors (shuffle colors)]
      (merge (zipmap labels colors) (get-color-map)))))

(def memorized-gen-color-map (memoize gen-color-map))

(defn set-style
  [node-label nlabel & {:keys [is-badge]
                        :or {is-badge true}}]
  (if is-badge
    {:label {:value node-label}
     :keyshape {:fill ((keyword nlabel) (memorized-gen-color-map))}
     :badges [{:position "RT"
               :type "text"
               :value (clojure.string/upper-case (first nlabel))
               :size [15, 15]
               :fill ((keyword nlabel) (memorized-gen-color-map))
               :color "#fff"}]}
    {:label {:value node-label}
     :keyshape {:fill ((keyword nlabel) (memorized-gen-color-map))}
     :icon {:type "text"
            :value (clojure.string/upper-case (first nlabel))
            :fill "#000"
            :size 15
            :color "#000"}}))

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
       :style    (set-style node-label (format-nlabel nlabel))
       :category :nodes
       :type     "graphin-circle"
       :data     (merge (:properties node)
                        {:identity (str (:identity node))})})))

(defn- format-relid
  [rel]
  (format "%s-%s-%s" (:relation rel) (:source_id rel) (:target_id rel)))

(defn- get-node-id-from-gnn
  "Disease::MESH:D015673"
  [id]
  (let [id (clj-str/split id #"::")]
    (if (= (count id) 2)
      (second id)
      id)))

(defn- get-node-type-from-gnn
  "Disease::MESH:D015673"
  [id]
  (let [id (clj-str/split id #"::")]
    (if (= (count id) 2)
      (first id)
      id)))

(defn- format-predicted-relationship
  "
   relation, source_id, target_id, score, source, target
  "
  [rel id-query-map]
  (let [source (get-node-id-from-gnn (:source rel))
        target (get-node-id-from-gnn (:target rel))]
    {:relid (format-relid rel)
     :source ((keyword source) id-query-map)
     :category :edges
     :target ((keyword target) id-query-map)
     :reltype (:relation rel)
     :style {:label {:value (:relation rel)}
             :keyshape {:lineDash [5, 5]
                        :lineWidth 2
                        :stroke "#ccc"}}
     :data {:identity (format-relid rel)}}))

(defn- get-predicted-nodes
  "Get all nodes from predicted relationships"
  [rel]
  (list {:node_id (get-node-id-from-gnn (:source rel))
         :node_type (get-node-type-from-gnn (:source rel))}
        {:node_id (get-node-id-from-gnn (:target rel))
         :node_type (get-node-type-from-gnn (:target rel))}))

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

(defn flatten-vector
  [v]
  (apply concat v))

(defn format-node-relationships
  "Format node relationships to a vector of maps, but some nodes may have multiple relationships.

   Finally, the data maybe like this:
   [{} [{} {}] {}] 
  "
  [node-relationships]
  (map (fn [item] (if (seq? (:r item))
                    (map (fn [rel] {:n (format-node (:n item))
                                    :r (format-relationship rel)
                                    :m (format-node (:m item))}) (:r item))
                    [{:n (format-node (:n item))
                      :r (format-relationship (:r item))
                      :m (format-node (:m item))}])) node-relationships))

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
    query))

(defn query-gdb-with-query-str
  [tx query-str]
  (->> ((db/create-query query-str) tx)
       (doall)
       (format-node-relationships)
       (flatten-vector)
       (merge-node-relationships)
       (distinct)
       (group-by :category)))

(defn query-gdb
  [tx query-map]
  (query-gdb-with-query-str tx (make-query query-map)))

(defn- make-query-with-id-types
  "
   MATCH (node)
   WHERE (node: Disease OR node: Compound) AND (node.id = 'MESH:D015673' OR node.id = 'DB00741')
   RETURN node 
  "
  [node-id-types]
  (let [fconditions (map #(format "node: %s" %)
                         (set (map :node_type node-id-types)))
        sconditions (map #(format "node.id = '%s'" %)
                         (map :node_id node-id-types))
        query (str "MATCH (node)"
                   (format " WHERE (%s) AND (%s)"
                           (clj-str/join " OR " (seq fconditions))
                           (clj-str/join " OR " (seq sconditions)))
                   " RETURN node")]
    query))

(defn- get-nodes-from-db
  [tx node-id-types]
  (let [query (make-query-with-id-types node-id-types)]
    (->> ((db/create-query query) tx)
         (doall)
         (map :node)
         (map format-node))))

(defn- make-id-query-map
  [nodes]
  (into (sorted-map)
        (map (fn [node] [(keyword (get-in node [:data :id]))
                         (get-in node [:data :identity])]) nodes)))

(defn format-predicted-relationships
  [tx predicted-relationships]
  (let [nodes (->> (map get-predicted-nodes predicted-relationships)
                   (apply concat))
        nodes (get-nodes-from-db tx nodes)
        id-query-map (make-id-query-map nodes)
        rels (map (fn [rel] (format-predicted-relationship rel id-query-map)) predicted-relationships)]
    {:nodes nodes :edges rels}))

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

(defn query&predict
  [query-map predicted-payload]
  (let [relation-types (:relation_types predicted-payload)
        topk (:topk predicted-payload)
        enable-prediciton (:enable_prediction predicted-payload)
        source-id (:source_id predicted-payload)
        enable_prediction (and enable-prediciton
                               (some? (:source_id predicted-payload))
                               (and (vector? relation-types) (not-empty relation-types))
                               (some? topk))
        predicted-rels (if enable_prediction
                         (:topkpd (gnn/predict source-id relation-types :topk topk))
                         {})]
    (log/info "Predicted Relationships: " predicted-rels)
    (with-open [session (db/get-session @gdb-conn)]
      (let [r (query-gdb session query-map)
            predicted-nr (if (empty? predicted-rels)
                           {:nodes []
                            :edges []}
                           (format-predicted-relationships session predicted-rels))]
        (if (empty? r)
          {:nodes []
           :edges []}
          (if enable_prediction
            (merge-with concat r predicted-nr)
            r))))))

(comment)