--;;
ALTER TABLE tservice_task ADD COLUMN owner VARCHAR(64);

--;;
COMMENT ON COLUMN tservice_task.owner IS 'The owner of the related task from quartet service';