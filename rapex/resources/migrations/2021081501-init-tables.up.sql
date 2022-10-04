-- how to run multiple statements in the migrations?
-- See https://github.com/yogthos/migratus#multiple-statements for more details
CREATE TABLE IF NOT EXISTS tservice_task (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  description TEXT,
  payload TEXT,
  plugin_name VARCHAR(64) NOT NULL,
  plugin_type VARCHAR(32) NOT NULL,
  plugin_version VARCHAR(32) NOT NULL,
  response TEXT,
  started_time BIGINT NOT NULL,
  finished_time BIGINT,
  status VARCHAR(32) NOT NULL,
  percentage INTEGER
);

--;;
COMMENT ON TABLE tservice_task IS 'Managing tasks';

--;;
COMMENT ON COLUMN tservice_task.id IS 'uuid for task';

--;;
COMMENT ON COLUMN tservice_task.name IS 'The task name, required, [a-zA-Z0-9]+.';

--;;
COMMENT ON COLUMN tservice_task.description IS 'A description of the task.';

--;;
COMMENT ON COLUMN tservice_task.payload IS 'The payload of the related task.';

--;;
COMMENT ON COLUMN tservice_task.plugin_name IS 'Which plugin for generating task.';

--;;
COMMENT ON COLUMN tservice_task.plugin_type IS 'ReportPlugin, StatPlugin, DataPlugin etc.';

--;;
COMMENT ON COLUMN tservice_task.plugin_version IS 'Which plugin version.';

--;;
COMMENT ON COLUMN tservice_task.response IS 'Result response, different plugin may have different response.';

--;;
COMMENT ON COLUMN tservice_task.started_time IS 'Started time.';

--;;
COMMENT ON COLUMN tservice_task.finished_time IS 'Finished time.';

--;;
COMMENT ON COLUMN tservice_task.status IS 'Started, Finished, Failed';

--;;
COMMENT ON COLUMN tservice_task.percentage IS 'The percentage of a task.';

--;;
CREATE TABLE IF NOT EXISTS tservice_tag (
  id SERIAL NOT NULL,
  title VARCHAR(32) NOT NULL UNIQUE,
  PRIMARY KEY(id)
);

--;;
COMMENT ON TABLE tservice_tag IS 'Used for tagging task etc.';

--;;
CREATE TABLE IF NOT EXISTS tservice_entity_tag (
  id SERIAL NOT NULL,
  -- entity_id may contains task id etc.
  entity_id VARCHAR(32),
  category VARCHAR(32),
  tag_id INT,
  PRIMARY KEY(id),
  CONSTRAINT fk_tag_id FOREIGN KEY (tag_id) REFERENCES tservice_tag(id)
);

--;;
COMMENT ON TABLE tservice_entity_tag IS 'Used for connecting other entity and tag table.';

-- More details on https://github.com/quartznet/quartznet/blob/main/database/tables/tables_postgres.sql
--;;
CREATE TABLE qrtz_job_details (
  sched_name VARCHAR(120) NOT NULL,
  job_name VARCHAR(200) NOT NULL,
  job_group VARCHAR(200) NOT NULL,
  description VARCHAR(250),
  job_class_name VARCHAR(250) NOT NULL,
  is_durable BOOLEAN NOT NULL,
  is_nonconcurrent BOOLEAN NOT NULL,
  is_update_data BOOLEAN NOT NULL,
  requests_recovery BOOLEAN NOT NULL,
  job_data BYTEA,
  CONSTRAINT pk_qrtz_job_details PRIMARY KEY (sched_name, job_name, job_group)
) WITH (FILLFACTOR = 100, OIDS = FALSE);

--;;
COMMENT ON TABLE qrtz_job_details IS 'Used for Quartz scheduler.';

--;;
CREATE TABLE qrtz_triggers (
  sched_name VARCHAR(120) NOT NULL,
  trigger_name VARCHAR(200) NOT NULL,
  trigger_group VARCHAR(200) NOT NULL,
  job_name VARCHAR(200) NOT NULL,
  job_group VARCHAR(200) NOT NULL,
  description VARCHAR(250),
  next_fire_time BIGINT,
  prev_fire_time BIGINT,
  priority INTEGER,
  trigger_state VARCHAR(16) NOT NULL,
  trigger_type VARCHAR(8) NOT NULL,
  start_time BIGINT NOT NULL,
  end_time BIGINT,
  calendar_name VARCHAR(200),
  misfire_instr SMALLINT,
  job_data BYTEA,
  CONSTRAINT pk_qrtz_triggers PRIMARY KEY (sched_name, trigger_name, trigger_group),
  CONSTRAINT fk_qrtz_triggers_job_details FOREIGN KEY (sched_name, job_name, job_group) REFERENCES qrtz_job_details(sched_name, job_name, job_group) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID
) WITH (FILLFACTOR = 100, OIDS = FALSE);

--;;
COMMENT ON TABLE qrtz_triggers IS 'Used for Quartz scheduler.';

--;;
CREATE TABLE qrtz_calendars (
  sched_name VARCHAR(120) NOT NULL,
  calendar_name VARCHAR(200) NOT NULL,
  calendar BYTEA NOT NULL,
  CONSTRAINT pk_qrtz_calendars PRIMARY KEY (sched_name, calendar_name)
) WITH (FILLFACTOR = 100, OIDS = FALSE);

--;;
COMMENT ON TABLE qrtz_calendars IS 'Used for Quartz scheduler.';

--;;
CREATE TABLE qrtz_cron_triggers (
  sched_name VARCHAR(120) NOT NULL,
  trigger_name VARCHAR(200) NOT NULL,
  trigger_group VARCHAR(200) NOT NULL,
  cron_expression VARCHAR(120) NOT NULL,
  time_zone_id VARCHAR(80),
  CONSTRAINT pk_qrtz_cron_triggers PRIMARY KEY (sched_name, trigger_name, trigger_group),
  CONSTRAINT fk_qrtz_cron_triggers_triggers FOREIGN KEY (sched_name, trigger_name, trigger_group) REFERENCES qrtz_triggers(sched_name, trigger_name, trigger_group) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID
) WITH (FILLFACTOR = 100, OIDS = FALSE);

--;;
COMMENT ON TABLE qrtz_cron_triggers IS 'Used for Quartz scheduler.';

--;;
CREATE TABLE qrtz_fired_triggers (
  sched_name VARCHAR(120) NOT NULL,
  entry_id VARCHAR(95) NOT NULL,
  trigger_name VARCHAR(200) NOT NULL,
  trigger_group VARCHAR(200) NOT NULL,
  instance_name VARCHAR(200) NOT NULL,
  fired_time BIGINT NOT NULL,
  sched_time BIGINT,
  priority INTEGER NOT NULL,
  state VARCHAR(16) NOT NULL,
  job_name VARCHAR(200),
  job_group VARCHAR(200),
  is_nonconcurrent BOOLEAN,
  requests_recovery BOOLEAN,
  CONSTRAINT pk_qrtz_fired_triggers PRIMARY KEY (sched_name, entry_id)
) WITH (FILLFACTOR = 100, OIDS = FALSE);

--;;
COMMENT ON TABLE qrtz_fired_triggers IS 'Used for Quartz scheduler.';

--;;
CREATE TABLE qrtz_locks (
  sched_name VARCHAR(120) NOT NULL,
  lock_name VARCHAR(40) NOT NULL,
  CONSTRAINT pk_qrtz_locks PRIMARY KEY (sched_name, lock_name)
) WITH (FILLFACTOR = 100, OIDS = FALSE);

--;;
COMMENT ON TABLE qrtz_locks IS 'Used for Quartz scheduler.';

--;;
CREATE TABLE qrtz_paused_trigger_grps (
  sched_name VARCHAR(120) NOT NULL,
  trigger_group VARCHAR(200) NOT NULL,
  CONSTRAINT pk_qrtz_paused_trigger_grps PRIMARY KEY (sched_name, trigger_group)
) WITH (FILLFACTOR = 100, OIDS = FALSE);

--;;
COMMENT ON TABLE qrtz_paused_trigger_grps IS 'Used for Quartz scheduler.';

--;;
CREATE TABLE qrtz_scheduler_state (
  sched_name VARCHAR(120) NOT NULL,
  instance_name VARCHAR(200) NOT NULL,
  last_checkin_time BIGINT NOT NULL,
  checkin_interval BIGINT NOT NULL,
  CONSTRAINT pk_qrtz_scheduler_state PRIMARY KEY (sched_name, instance_name)
) WITH (FILLFACTOR = 100, OIDS = FALSE);

--;;
COMMENT ON TABLE qrtz_scheduler_state IS 'Used for Quartz scheduler.';

--;;
CREATE TABLE qrtz_simple_triggers (
  sched_name VARCHAR(120) NOT NULL,
  trigger_name VARCHAR(200) NOT NULL,
  trigger_group VARCHAR(200) NOT NULL,
  repeat_count BIGINT NOT NULL,
  repeat_interval BIGINT NOT NULL,
  times_triggered BIGINT NOT NULL,
  CONSTRAINT pk_qrtz_simple_triggers PRIMARY KEY (sched_name, trigger_name, trigger_group),
  CONSTRAINT fk_qrtz_simple_triggers_triggers FOREIGN KEY (sched_name, trigger_name, trigger_group) REFERENCES qrtz_triggers(sched_name, trigger_name, trigger_group) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID
) WITH (FILLFACTOR = 100, OIDS = FALSE);

--;;
COMMENT ON TABLE qrtz_simple_triggers IS 'Used for Quartz scheduler.';

--;;
CREATE TABLE qrtz_simprop_triggers (
  sched_name VARCHAR(120) NOT NULL,
  trigger_name VARCHAR(200) NOT NULL,
  trigger_group VARCHAR(200) NOT NULL,
  str_prop_1 VARCHAR(512),
  str_prop_2 VARCHAR(512),
  str_prop_3 VARCHAR(512),
  int_prop_1 INTEGER,
  int_prop_2 INTEGER,
  long_prop_1 BIGINT,
  long_prop_2 BIGINT,
  dec_prop_1 NUMERIC(13, 4),
  dec_prop_2 NUMERIC(13, 4),
  bool_prop_1 BOOLEAN,
  bool_prop_2 BOOLEAN,
  CONSTRAINT pk_qrtz_simprop_triggers PRIMARY KEY (sched_name, trigger_name, trigger_group),
  CONSTRAINT fk_qrtz_simprop_triggers_triggers FOREIGN KEY (sched_name, trigger_name, trigger_group) REFERENCES qrtz_triggers(sched_name, trigger_name, trigger_group) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID
) WITH (FILLFACTOR = 100, OIDS = FALSE);

--;;
COMMENT ON TABLE qrtz_simprop_triggers IS 'Used for Quartz scheduler.';

--;;
CREATE TABLE IF NOT EXISTS qrtz_blob_triggers (
  sched_name VARCHAR(120) NOT NULL,
  trigger_name VARCHAR(200) NOT NULL,
  trigger_group VARCHAR(200) NOT NULL,
  blob_data BYTEA,
  CONSTRAINT pk_qrtz_blob_triggers PRIMARY KEY (sched_name, trigger_name, trigger_group),
  CONSTRAINT fk_qrtz_blob_triggers_triggers FOREIGN KEY (sched_name, trigger_name, trigger_group) REFERENCES qrtz_triggers(sched_name, trigger_name, trigger_group) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID
) WITH (FILLFACTOR = 100, OIDS = FALSE);

--;;
COMMENT ON TABLE qrtz_blob_triggers IS 'Used for Quartz scheduler.';

--;;