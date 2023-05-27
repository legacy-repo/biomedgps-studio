(ns rapex.db.query-gdata
  (:require [rapex.db.neo4j.core :as db]
            [clojure.string :as clj-str]
            [rapex.models.gnn :as gnn]
            [honey.sql :as sql]
            [next.jdbc :as jdbc]
            [conman.core :as conman]
            [mount.core :refer [defstate]]
            [next.jdbc.result-set :as rs]
            [rapex.config :refer [get-graph-metadata-db-url get-label-blacklist get-color-map]]
            [clojure.tools.logging :as log])
  (:import [java.net URI]
           [java.sql SQLException]
           [java.lang IllegalStateException IllegalArgumentException]
           [clojure.lang PersistentArrayMap Keyword]))

(defstate ^:dynamic *graph-metadb*
  :start (if-let [jdbc-url (get-graph-metadata-db-url)]
           (conman/connect! {:jdbc-url jdbc-url})
           (do
             (log/warn "database connection URL was not found, please set :graph-metadb-url in your config, e.g: dev-config.edn")
             *graph-metadb*))
  :stop (conman/disconnect! *graph-metadb*))

(defn get-gmetadb-connection []
  (:datasource *graph-metadb*))

(defn which-database
  []
  (let [db-url (get-graph-metadata-db-url)]
    (cond (re-matches #"jdbc:postgresql:.*" db-url)
          "postgresql"

          (re-matches #"jdbc:sqlite:.*" db-url)
          "sqlite"

          (re-matches #"jdbc:duckdb:.*" db-url)
          "duckdb"

          :else
          (throw (ex-info "Unsupported database type." {})))))

;; --------------------------------- Neo4j ---------------------------------
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
;; More details on https://colorbrewer2.org/#type=qualitative&scheme=Paired&n=12
(def colors ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c",
             "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928"])
(def degrees [0 10 20 30 40 50 60 70 80 90 100])

(defn- format-nlabel
  [item]
  (clj-str/replace item " " "_"))

(defn gen-color-map
  []
  (with-open [session (db/get-session @gdb-conn)]
    (let [labels (->> (list-labels session)
                      (map (fn [item] (keyword (format-nlabel item))))
                      sort)]
      (merge (zipmap labels colors) (get-color-map)))))

(defn gen-degree-map
  []
  (with-open [session (db/get-session @gdb-conn)]
    (let [labels (->> (list-labels session)
                      (map (fn [item] (keyword (format-nlabel item))))
                      sort)]
      (zipmap labels degrees))))

(def memorized-gen-color-map (memoize gen-color-map))
(def memorized-gen-degree-map (memoize gen-degree-map))

(defn set-style
  [node-label nlabel & {:keys [is-badge]
                        :or {is-badge false}}]
  (let [label {:value node-label}
        color ((keyword nlabel) (memorized-gen-color-map))
        keyshape {:fill color
                  :stroke color
                  :opacity 0.95
                  :fillOpacity 0.95}]
    (if is-badge
      {:label label
       :keyshape keyshape
       :badges [{:position "RT"
                 :type "text"
                 :value (clojure.string/upper-case (first nlabel))
                 :size [15, 15]
                 :fill color
                 :color "#fff"}]}
      {:label label
       :keyshape keyshape
       :icon {:type "text"
              :value (clojure.string/upper-case (first nlabel))
              :fill "#000"
              :size 15
              :color "#000"}})))

(defn format-node
  [node]
  (let [node-label (:id (:properties node))
        name (:name (:properties node))
        label (format "%s-%s" (:identity node) node-label)
        nlabel (first (:lables node))]
    (when node
      {:comboId  nil
       :id       (str (:identity node))
       :label    label
       :nlabel   nlabel
       :degree   ((keyword nlabel) (memorized-gen-degree-map))
       :style    (set-style (or name node-label) (format-nlabel nlabel))
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

(defn- get-neighbor-nodes
  "Get all nodes from found nearest neighbors"
  [topk-neighbors]
  (pmap (fn [item]
          {:node_id (get-node-id-from-gnn (:target item))
           :node_type (get-node-type-from-gnn (:target item))
           :degree (:score item)})
        topk-neighbors))

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
  (apply concat (map (fn [item] (filter some? [(:n item) (:r item) (:m item)])) formated-node-relationships)))

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

(defn with
  [with-clause]
  (if with-clause
    (format "WITH %s" with-clause)
    ""))

(defn unwind
  [unwind-clause]
  (if unwind-clause
    (format "UNWIND %s" unwind-clause)
    ""))

(defn return
  [return-clause]
  (if return-clause
    (format "RETURN %s" return-clause)
    (throw (Exception. "Return clause is missing."))))

(defn make-query
  "
   {:with xxx :unwind xxx :match xxx :where xxx :return xxx :limit xxx}
  "
  [query-map]
  (let [query (format "%s %s %s %s %s %s %s"
                      (with (:with query-map))
                      (unwind (:unwind query-map))
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
       (group-by :category)
       (merge {:nodes [] :edges []})))

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

(defn format-neighbor-nodes
  [tx neighbor-nodes]
  (let [nodes-with-degree (get-neighbor-nodes neighbor-nodes)
        nodes-from-neo4j (get-nodes-from-db tx nodes-with-degree)
        find-node (fn [node] (let [matched-node (first (filter #(= (:id (:data node))
                                                                   (:node_id %))
                                                               nodes-with-degree))]
                               (if matched-node
                                 (assoc node :degree (:degree matched-node))
                                 node)))
        updated-nodes (pmap #(find-node %) nodes-from-neo4j)]
    {:nodes updated-nodes :edges []}))

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
       (group-by :category)
       (merge {:nodes [] :edges []})))

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
       (group-by :category)
       (merge {:nodes [] :edges []})))

(defn find-nearest-neighbors
  [source-type source-id topk]
  (let [neighbor-nodes (:topkpd (gnn/find-neighbors source-type source-id :topk topk))]
    (with-open [session (db/get-session @gdb-conn)]
      (format-neighbor-nodes session neighbor-nodes))))

(defn evaluate-similarities
  [source-type source-id target-types target-ids]
  (let [nodes (:topkpd (gnn/eval-similarities source-type source-id target-types target-ids))]
    (with-open [session (db/get-session @gdb-conn)]
      (format-neighbor-nodes session nodes))))

(defn query&predict
  [query-map predicted-payload]
  (let [relation-types (:relation_types predicted-payload)
        topk (:topk predicted-payload)
        target-ids (:target_ids predicted-payload)
        enable-prediction (:enable_prediction predicted-payload)
        source-id (:source_id predicted-payload)
        predicted-rels (cond (and enable-prediction source-id (vector? relation-types) (not-empty relation-types))
                             (:topkpd (gnn/predict source-id relation-types :topk (or topk 10)))

                             (and enable-prediction source-id (vector? target-ids) (not-empty target-ids))
                             (:topkpd (gnn/predict-source-targets source-id target-ids))

                             :else
                             [])]
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
          (if enable-prediction
            ;; Remove duplicated nodes and edges
            (let [{:keys [nodes edges]} (merge-with concat r predicted-nr)]
              {:nodes (distinct nodes)
               :edges (distinct edges)})
            r))))))

;; ---------------------------------------- Graph Metadata Database ----------------------------------------
(defn custom-ex-info
  [^String msg ^Keyword code ^PersistentArrayMap info-map]
  (ex-info msg
           (merge {:code code} info-map)))

(defn get-results
  "Get records based on user's query string.
  "
  [^PersistentArrayMap sqlmap]
  (try
    (let [sqlstr (sql/format sqlmap)
          con (get-gmetadb-connection)]
      (log/info "Query String:" sqlstr)
      (jdbc/execute! con sqlstr {:builder-fn rs/as-unqualified-maps}))
    (catch Exception e
      (condp (fn [cs t] (some #(instance? % t) cs)) e

        [IllegalStateException IllegalArgumentException]
        (throw (custom-ex-info "Cannot format your query string."
                               :bad-request
                               {:query_str (str sqlmap)
                                :error e}))

        [SQLException]
        (throw (custom-ex-info "Please check your query string, it has illegal argument."
                               :bad-request
                               {:query_str (str sqlmap)
                                :error e
                                :formated_str (str (sql/format sqlmap))}))

        ;; whe pass through the exception when not handled
        (throw e)))))

(defn get-total
  "Get total number of records based on user's query string.
   
   (get-total {:select [:*] :from :gut_fpkm})
  "
  ^Integer [^PersistentArrayMap sqlmap]
  (let [sqlmap (merge sqlmap {:select [[:%count.* :total]]})
        cleaned-sqlmap (apply dissoc sqlmap [:limit :offset :order-by])
        results (get-results cleaned-sqlmap)]
    ;; [{:total 333}]
    (:total (first results))))

(defn get-all-metadata-tables
  []
  (let [db-conn (get-gmetadb-connection)
        database-name (which-database)
        query-str (case database-name
                    "postgresql"
                    "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';"

                    "sqlite"
                    "SELECT name as tablename FROM sqlite_master WHERE type='table';"

                    "duckdb"
                    ;; TODO: Maybe the following query is wrong. It doesn't be tested.
                    "SELECT * FROM information_schema.tables WHERE table_schema = 'public';")
        r (jdbc/execute! db-conn
                         [query-str]
                         {:builder-fn rs/as-unqualified-maps})]
    (->> r (map :tablename))))

(def memorized-get-all-metadata-tables (memoize get-all-metadata-tables))

(defn read-string-as-map
  "Read string and convert it to a hash map which is accepted by honey library.
  "
  ^PersistentArrayMap [^String query-string]
  (try
    (read-string query-string)
    ;; Don't use read-string, it will convert string to keyword.
    ;; (json/read-str query-string :key-fn #(keyword (subs % 1)))
    (catch Exception e
      (throw (custom-ex-info "Wrong query string."
                             :bad-request
                             {:query-string query-string
                              :error (.getMessage e)})))))

(defn format-entity2d
  "Format entity2d to a map as expected format.
   
   (format-entity2d [{:node_type \"Disease\", :node_id \"MESH:D015673\", :tsne_x 0.1, :tsne_y 0.2}])
   
   Args:
     results: A vector of maps.
     algorithm: tsne or umap, default is tsne. Currently, we only support tsne and umap for only having the tsne_x and tsne_y or umap_x and umap_y columns in the database. If you want to use other algorithms, you need to generate the entity2d table by yourself and change the format-entity2d function.
  "
  [results & {:keys [algorithm]
              :or {algorithm "tsne"}}]
  (let [x_fn (fn [item] (if (= algorithm "tsne")
                          (:tsne_x item)
                          (:umap_x item)))
        y_fn (fn [item] (if (= algorithm "tsne")
                          (:tsne_y item)
                          (:umap_y item)))]
    (pmap (fn [item] {:node_type (:node_type item)
                      :node_id (:node_id item)
                      :x (x_fn item)
                      :y (y_fn item)}) results)))

(defn get-entity2d
  "Get entity2d based on user's query string and format it to a map as expected format.
   
   (get-entity2d {:select [:*] :from :entity2d})"
  ^PersistentArrayMap [^String source-type ^String source-id
                       ^"[Ljava.lang.String;" target-types
                       ^"[Ljava.lang.String;" target-ids]
  (let [tables (memorized-get-all-metadata-tables)]
    (if (> (.indexOf tables "entity2d") -1)
      (let [node-types (concat target-types [source-type])
            node-ids (concat target-ids [source-id])
            where-clause (pmap (fn [node-type node-id]
                                 [:and
                                  [:= :node_type node-type]
                                  [:= :node_id node-id]])
                               node-types node-ids)
            where-clause (concat [:or] (distinct where-clause))
            sqlmap {:select [:*]
                    :from :entity2d
                    :where where-clause}
            results (get-results sqlmap)]
        (if (empty? results)
          (throw (custom-ex-info "Cannot find the entity2d."
                                 :not-found
                                 {:source_type source-type
                                  :source_id source-id
                                  :target_types target-types
                                  :target_ids target-ids}))
          {:data (format-entity2d (distinct results))}))
      (do
        (gnn/dim-reduction source-type source-id target-types target-ids)
        (log/warn "The table 'entity2d' is not found in the metadata database, so use the real time mode to get the entity2d.")))))