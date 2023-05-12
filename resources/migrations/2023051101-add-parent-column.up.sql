--;;
ALTER TABLE rapex_graph ADD COLUMN parent VARCHAR(26) REFERENCES rapex_graph(id) ON DELETE CASCADE ON UPDATE CASCADE;

--;;
COMMENT ON COLUMN rapex_graph.parent IS 'The parent of this graph, if any.';