### How to import entities?

You must upload the data file into /data/neo4j-test/import/ firstly. 

CAUTION: Please keep the directory structure. If you want to use `formated_data/drugbank.csv` as the file path, the remote directory `/data/neo4j-test/import/` must have the subdirectory `formated_data`.

```
# Single file mode
python3 cypher.py import-entities -D 10.157.72.34:17687/default -U neo4j -P NeO4J -f ndf_rt.csv

# Batch files mode
python3 ../cypher.py import-entities -D 10.157.72.34:17687/default -U neo4j -P NeO4J -f ./
```

### How to import relationships?

```
# Single file mode
# bioarx::Coronavirus_ass_host_gene::Disease:Gene
python3 cypher.py import-relationships -D 10.157.72.34:17687/default -U neo4j -P NeO4J -f relationships/bioarx_coronavirus_ass_host_gene_disease_gene.csv

# Batch files mode
python3 ../cypher.py import-relationships -f ./relationships -D 10.157.72.34:17687/default -U neo4j -P NeO4J
```

### How to split file based on relationship type?
```
# Make a new file which only contains GNBR::Rg::Gene:Gene relationship.
python3 cypher.py filter-file -i formated_data/relationships.csv -o ./formated_data/relationships
```