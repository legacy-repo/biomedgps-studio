CREATE TABLE IF NOT EXISTS rapex_graph (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  description TEXT,
  payload TEXT NOT NULL,
  created_time BIGINT NOT NULL,
  owner VARCHAR(36) NOT NULL,
  version VARCHAR(36) NOT NULL,
  db_version VARCHAR(36) NOT NULL
);