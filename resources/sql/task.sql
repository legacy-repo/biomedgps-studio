-- Author: Jingcheng Yang <yjcyxky@163.com>
-- Date: 2020.03.27
-- License: See the details in license.md

---------------------------------------------------------------------------------------------
-- Table Name: tservice_task
-- Description: Managing tasks
-- Functions: create-task!, update-task!, count-tasks, search-tasks, delete-task!
---------------------------------------------------------------------------------------------

-- :name create-task!
-- :command :insert
-- :result :raw
/* :doc
  Args:
    | key                | type    | required  | description |
    |--------------------|---------|-----------|-------------|
    | :id                | uuid    | true/uniq | UUID string
    | :name              | string  | true      | The task name, required, [a-zA-Z0-9]+.
    | :description       | string  | false     | A description of the task.
    | :payload           | json    | false     | The payload of the related task.
    | :owner             | string  | true      | The owner of the related task.
    | :plugin_name       | string  | true      | Which plugin for generating task.
    | :plugin_type       | string  | true      | ReportPlugin, StatPlugin, DataPlugin etc.
    | :plugin_version    | string  | true      | Which plugin version.
    | :response          | json    | false     | Result response, different plugin may have different response.
    | :started_time      | bigint  | true      | Started time
    | :finished_time     | bigint  | false     | Finished time
    | :status            | string  | true      | Started, Finished, Failed
    | :percentage        | int     | false     | The percentage of a task.
  Description:
    Create a new task record and then return the number of affected rows.
  Examples: 
    Clojure: (create-task! {})
*/
INSERT INTO tservice_task (id, name, description, payload, owner, plugin_name, plugin_type, plugin_version, response, started_time, finished_time, status, percentage)
VALUES (:id, :name, :description, :payload, :owner, :plugin_name, :plugin_type, :plugin_version, :response, :started_time, :finished_time, :status, :percentage)


-- :name update-task!
-- :command :execute
-- :result :affected
/* :doc
  Args:
    {:updates {:status "Started" :finished_time 10000 :percentage 0} :id "3"}
  Description: 
    Update an existing task record.
  Examples:
    Clojure: (update-task! {:updates {:finished_time "finished-time" :status "status" :percentage 100} :id "3"})
    HugSQL: UPDATE tservice_task SET finished_time = :v:query-map.finished-time, status = :v:query-map.status WHERE id = :id
    SQL: UPDATE tservice_task SET finished_time = "finished_time", status = "status" WHERE id = "3"
  TODO:
    It will be raise exception when (:updates params) is nil.
*/
/* :require [clojure.string :as string]
            [hugsql.parameters :refer [identifier-param-quote]] */
UPDATE tservice_task
SET
/*~
(string/join ","
  (for [[field _] (:updates params)]
    (str (identifier-param-quote (name field) options)
      " = :v:updates." (name field))))
~*/
WHERE id = :id


-- :name count-tasks
-- :command :query
-- :result :one
/* :doc
  Args:
    {:query-map {:status "XXX"}}
  Description:
    Count the queried tasks.
  Examples:
    Clojure: (count-tasks)
    SQL: SELECT COUNT(id) FROM tservice_task

    Clojure: (count-tasks {:query-map {:status "XXX"}})
    HugSQL: SELECT COUNT(id) FROM tservice_task WHERE status = :v:query-map.status
    SQL: SELECT COUNT(id) FROM tservice_task WHERE status = "XXX"
  TODO: 
    Maybe we need to support OR/LIKE/IS NOT/etc. expressions in WHERE clause.
  FAQs:
    1. why we need to use :one as the :result
      Because the result will be ({:count 0}), when we use :raw to replace :one.
*/
/* :require [rapex.db.sql-helper :as sql-helper] */
SELECT COUNT(id) as count
FROM tservice_task
/*~
; TODO: May be raise error, when the value of :query-map is unqualified.
; :snip:where-clause, more details in https://www.hugsql.org/#faq-dsls
(cond
  (:query-map params) (sql-helper/where-clause (:query-map params) options)
  (:where-clause params) ":snip:where-clause")
~*/


-- :name search-tasks
-- :command :query
-- :result :many
/* :doc
  Args:
    {:query-map {:status "XXX"} :limit 1 :offset 0}
  Description:
    Get tasks by using query-map or honeysql where-clause
  Examples: 
    Clojure: (search-tasks {:query-map {:status "XXX"}})
    HugSQL: SELECT * FROM tservice_task WHERE status = :v:query-map.status
    SQL: SELECT * FROM tservice_task WHERE status = "XXX"
  TODO:
    1. Maybe we need to support OR/LIKE/IS NOT/etc. expressions in WHERE clause.
    2. Maybe we need to use exact field name to replace *.
*/
/* :require [rapex.db.sql-helper :as sql-helper] */
SELECT * 
FROM tservice_task
/*~
; TODO: May be raise error, when the value of :query-map is unqualified.
(cond
  (:query-map params) (sql-helper/where-clause (:query-map params) options)
  (:where-clause params) ":snip:where-clause")
~*/
ORDER BY started_time DESC
--~ (when (and (:limit params) (:offset params)) "LIMIT :limit OFFSET :offset")


-- :name search-tasks-with-tags
-- :command :query
-- :result :many
/* :doc
  Args:
    {:query-map {:status "XXX"} :limit 1 :offset 0}
  Description:
    Get tasks with tags by using query map
  Examples: 
    Clojure: (search-tasks-with-tags {:query-map {:status "XXX"}})
    HugSQL:
      SELECT  tservice_task.id,
              tservice_task.name,
              tservice_task.description,
              tservice_task.payload,
              tservice_task.owner,
              tservice_task.plugin_name,
              tservice_task.plugin_version,
              tservice_task.plugin_type,
              tservice_task.response,
              tservice_task.started_time,
              tservice_task.finished_time,
              tservice_task.status,
              tservice_task.percentage
              array_agg( tservice_tag.id ) as tag_ids,
              array_agg( tservice_tag.title ) as tags
      FROM tservice_entity_tag
      JOIN tservice_task ON tservice_entity_tag.entity_id = tservice_task.id
      JOIN tservice_tag ON tservice_entity_tag.tag_id = tservice_tag.id
      WHERE tservice_task.status = :v:query-map.status
      GROUP BY tservice_task.id
  TODO:
    1. Maybe we need to support OR/LIKE/IS NOT/etc. expressions in WHERE clause.
    2. Maybe we need to use exact field name to replace *.
    3. Maybe we need to add tservice_entity_tag.category = "task" condition.
*/
/* :require [rapex.db.sql-helper :as sql-helper] */
SELECT  tservice_task.id,
        tservice_task.name,
        tservice_task.description,
        tservice_task.payload,
        tservice_task.owner,
        tservice_task.plugin_name,
        tservice_task.plugin_version,
        tservice_task.plugin_type,
        tservice_task.response,
        tservice_task.started_time,
        tservice_task.finished_time,
        tservice_task.status,
        tservice_task.percentage
        array_agg( tservice_tag.id ) as tag_ids,
        array_agg( tservice_tag.title ) as tags
FROM tservice_entity_tag
JOIN tservice_task ON tservice_entity_tag.entity_id = tservice_task.id
JOIN tservice_tag ON tservice_entity_tag.tag_id = tservice_tag.id
/*~
; TODO: May be raise error, when the value of :query-map is unqualified.
(cond
  (:query-map params) (sql-helper/where-clause (:query-map params) options)
  (:where-clause params) ":snip:where-clause")
~*/
GROUP BY tservice_task.id
ORDER BY tservice_task.id
--~ (when (and (:limit params) (:offset params)) "LIMIT :limit OFFSET :offset")


-- :name delete-task!
-- :command :execute
-- :result :affected
/* :doc
  Args:
    {:id "XXX"}
  Description:
    Delete a task record given the id
  Examples:
    Clojure: (delete-task! {:id "XXX"})
    SQL: DELETE FROM tservice_task WHERE id = "XXX"
*/
DELETE
FROM tservice_task
WHERE id = :id


-- :name delete-all-tasks!
-- :command :execute
-- :result :affected
/* :doc
  Description:
    Delete all task records.
  Examples:
    Clojure: (delete-all-tasks!)
    SQL: TRUNCATE tservice_task;
*/
TRUNCATE tservice_task;
