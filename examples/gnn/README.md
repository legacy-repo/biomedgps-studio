### How to import entities?

You must upload the data file into /data/neo4j-test/import/ firstly. 

CAUTION: Please keep the directory structure. If you want to use `formated_data/drugbank.csv` as the file path, the remote directory `/data/neo4j-test/import/` must have the subdirectory `formated_data`.

```
# Single file mode
python3 cypher.py import-entities -D 10.157.72.34:17687/default -U neo4j -P NeO4J -f ndf_rt.csv

# Batch files mode
cd examples/gnn/formated_data
python3 ../cypher.py import-entities -D 10.157.72.34:17687/default -U neo4j -P NeO4J -f ./
```

### How to split file based on relationship type?
```
# Make a new file which only contains GNBR::Rg::Gene:Gene relationship.
cd examples/gnn
python3 cypher.py filter-file -i formated_data/relationships.csv -o ./formated_data/relationships
```

### How to import relationships?

```
# Single file mode
# bioarx::Coronavirus_ass_host_gene::Disease:Gene
python3 cypher.py import-relationships -D 10.157.72.34:17687/default -U neo4j -P NeO4J -f relationships/bioarx_coronavirus_ass_host_gene_disease_gene.csv

# Batch files mode
cd examples/gnn/formated_data
python3 ../cypher.py import-relationships -f ./relationships -D 10.157.72.34:17687/default -U neo4j -P NeO4J
```

<!-- Alpaca -->
### Examples
Could you recommend some sgRNAs for TrP53 in mouse?

Could you show me that all the relationships related with TP53 in our knowledge graph.

Do you know the above question? please output it as the following format?  {     "entity_type": "xxx",  // One of Gene, Drug or Protein  "entity_name": "xxx", "which_relationships": "xxx", // One of All, Gene-Drug, Gene-Gene, Gene-Protein, Drug-Protein "gene_name": "xxx", "entrez_id": "xxx", "taxid": "xxx",  "which_task": "xxx", // One of KnowledgeGraph, sgRNAs, Probes  "which_species": "xxx" // one of rat, mouse and human  }