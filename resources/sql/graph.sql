-- Author: Jingcheng Yang <yjcyxky@163.com>
-- Date: 2023.05.10
-- License: See the details in license.md

---------------------------------------------------------------------------------------------
-- Table Name: rapex_graph
-- Description: Managing graphs
-- Functions: create-graph!, update-graph!, count-graphs, search-graphs, delete-graph!
---------------------------------------------------------------------------------------------

-- :name create-graph!
-- :command :insert
-- :result :raw
/* :doc
  Args:
    | key                | type    | required  | description |
    |--------------------|---------|-----------|-------------|
    | :id                | uuid    | true/uniq | UUID string
    | :name              | string  | true      | The graph name, required, [a-zA-Z0-9]+.
    | :description       | string  | false     | A description of the graph.
    | :payload           | json    | false     | The payload of the related graph.
    | :owner             | string  | true      | The owner of the related graph.
    | :db_version        | string  | true      | Which plugin version.
    | :created_time      | bigint  | true      | Created time
    | :version           | string  | true      | Version of the rapex instance.
    | :parent            | uuid    | false     | The parent graph id.
  Description:
    Create a new graph record and then return the number of affected rows.
  Examples: 
    Clojure: (create-graph! {})
*/
INSERT INTO rapex_graph (id, name, description, payload, owner, db_version, created_time, version, parent)
VALUES (:id, :name, :description, :payload, :owner, :db_version, :created_time, :version, :parent)


-- :name update-graph!
-- :command :execute
-- :result :affected
/* :doc
  Args:
    {:updates {:payload {}} :id "3"}
  Description: 
    Update an existing graph record.
  Examples:
    Clojure: (update-graph! {:updates {:payload {}} :id "3"})
    HugSQL: UPDATE rapex_graph SET payload = :v:query-map.payload WHERE id = :id
    SQL: UPDATE rapex_graph SET payload = "{xxx}" WHERE id = "3"
  TODO:
    It will be raise exception when (:updates params) is nil.
*/
/* :require [clojure.string :as string]
            [hugsql.parameters :refer [identifier-param-quote]] */
UPDATE rapex_graph
SET
/*~
(string/join ","
  (for [[field _] (:updates params)]
    (str (identifier-param-quote (name field) options)
      " = :v:updates." (name field))))
~*/
WHERE id = :id


-- :name count-graphs
-- :command :query
-- :result :one
/* :doc
  Args:
    {:query-map {:version "XXX"}}
  Description:
    Count the queried graphs.
  Examples:
    Clojure: (count-graphs)
    SQL: SELECT COUNT(id) FROM rapex_graph

    Clojure: (count-graphs {:query-map {:version "XXX"}})
    HugSQL: SELECT COUNT(id) FROM rapex_graph WHERE version = :v:query-map.version
    SQL: SELECT COUNT(id) FROM rapex_graph WHERE version = "XXX"
  TODO: 
    Maybe we need to support OR/LIKE/IS NOT/etc. expressions in WHERE clause.
  FAQs:
    1. why we need to use :one as the :result
      Because the result will be ({:count 0}), when we use :raw to replace :one.
*/
/* :require [rapex.db.sql-helper :as sql-helper] */
SELECT COUNT(id) as count
FROM rapex_graph
/*~
; TODO: May be raise error, when the value of :query-map is unqualified.
; :snip:where-clause, more details in https://www.hugsql.org/#faq-dsls
(cond
  (:query-map params) (sql-helper/where-clause (:query-map params) options)
  (:where-clause params) ":snip:where-clause")
~*/


-- :name search-graphs
-- :command :query
-- :result :many
/* :doc
  Args:
    {:query-map {:version "XXX"} :limit 1 :offset 0}
  Description:
    Get graphs by using query-map or honeysql where-clause
  Examples: 
    Clojure: (search-graphs {:query-map {:version "XXX"}})
    HugSQL: SELECT * FROM rapex_graph WHERE version = :v:query-map.version
    SQL: SELECT * FROM rapex_graph WHERE version = "XXX"
  TODO:
    1. Maybe we need to support OR/LIKE/IS NOT/etc. expressions in WHERE clause.
    2. Maybe we need to use exact field name to replace *.
*/
/* :require [rapex.db.sql-helper :as sql-helper] */
SELECT * 
FROM rapex_graph
/*~
; TODO: May be raise error, when the value of :query-map is unqualified.
(cond
  (:query-map params) (sql-helper/where-clause (:query-map params) options)
  (:where-clause params) ":snip:where-clause")
~*/
ORDER BY created_time DESC
--~ (when (and (:limit params) (:offset params)) "LIMIT :limit OFFSET :offset")


-- :name delete-graph!
-- :command :execute
-- :result :affected
/* :doc
  Args:
    {:id "XXX"}
  Description:
    Delete a graph record given the id
  Examples:
    Clojure: (delete-graph! {:id "XXX"})
    SQL: DELETE FROM rapex_graph WHERE id = "XXX"
*/
DELETE
FROM rapex_graph
WHERE id = :id


-- :name delete-all-graphs!
-- :command :execute
-- :result :affected
/* :doc
  Description:
    Delete all graph records.
  Examples:
    Clojure: (delete-all-graphs!)
    SQL: TRUNCATE rapex_graph;
*/
TRUNCATE rapex_graph;
