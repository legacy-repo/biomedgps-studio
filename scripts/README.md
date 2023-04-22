## Prepare Omics Data

Assume you have installed `make_data.py` in your system.

### Directory

```
|-- [dataset_id]
|    |-- degs
|    |     |-- [organ]_[fpkm|tpm|counts]_[limma|wilcox|ttest].csv
|    |-- expr
|    |     |-- [organ]_[fpkm|tpm|counts].csv
|    |-- filtered_similar_genes_50
|    |     |-- [organ]
|    |     |     |-- [organ]_[ENSMUSGxxx]_similar_genes.csv
|    |-- filtered_similar_genes_1000
|    |     |-- [organ]
|    |     |     |-- [organ]_[ENSMUSGxxx]_similar_genes.csv
|    |-- similar_genes
|    |     |-- [organ]
|    |     |     |-- [organ]_[ENSMUSGxxx]_similar_genes.csv
|    |-- similar_genes_full
|    |     |-- [organ]
|    |     |     |-- [organ]_[ENSMUSGxxx]_similar_genes.csv
|    |-- single_gene
|    |     |-- barplot_across_organs
|    |     |     |-- [ENxxxx].[pdf|json]
|    |     |-- boxplot_across_organs
|    |     |     |-- [ENxxxx].[pdf|json]
|    |-- formated_genes.tsv
|    |-- genes.csv
|    |-- pathways.tsv
```

### Prepare DEGs files

File name must be `[organ]_[fpkm|tpm|counts]_[limma|wilcox|ttest].csv`.

Each organ have a DEGs table. The column names are as the following.

padj is computed with bonferroni method.
logfc means the log2 transforming of the fc value.

```
ensembl_id,entrez_id,gene_symbol,padj,pvalue,logfc,direction
```

### Prepare expr Files

File name must be `[organ]_[fpkm|tpm|counts]_[limma|wilcox|ttest].csv`.

Each organ have a expression table. The row is ensembl id, the column is sample, each cell is expression value.

```
ensembl_id,sample001,sample002,...
```

### Prepare Pathway File

```
entrez_id
pathway_id
gene_symbol
ensembl_id
pathway_name
```

### Prepare Gene Files

```
# genes.csv
ensembl_id,gene_symbol,entrez_id
```

```
# formated_genes.tsv
gene_symbol
ensembl_id
entrez_id
name
taxid
type_of_gene
description
mgi_id
pdb
pfam
pubmed_ids
pubmed
alias
chromosome
start
end
strand
swiss_p
prosite
```


```bash
python rapex/scripts/make_db.py genes -i examples/data/000000/genes.csv -o examples/temp/formated_genes.json --output-tsv

python3 scripts/make_db.py merge -d examples/temp -o examples/data/000000/formated_genes.tsv
```


### Make a Dataset


```
python3 scripts/make_db.py dataset -d examples/data/000000 -o examples/db/ -b sqlite
```

## Prepare Knowledge Base

Assume you have installed `make_graph.py` in your system.

### Build Metadata, Nodes and Relationships

Assume all the data are in `~/Documents/Datasets/rapex-gdata`.

1. Build Metadata

```bash
root_dir=~/Documents/Datasets/rapex-gdata
python3 scripts/make_db.py graph-metadata -e ${root_dir}/formatted_data -r ${root_dir}/formatted_data/relationships -o ${root_dir}/graph_metadata.json -f tsv
```

2. Build Nodes and Relationships

```bash
python3 scripts/make_db.py graph-labels -m ${root_dir}/graph_metadata.json -o ${root_dir}
```

### Upload to a import directory of Neo4j

```bash
rsync -avP ${root_dir}/formatted_data/ neo4j@localhost:/xxx/import/
```

## Make Neo4j Database

Assume you have installed `cypher.py` in your system.

```bash
# Change to the import directory(all the files must be in the same directory as the import directory)
cd ${root_dir}/formatted_data

# Import nodes
cypher.py import-entities -D 127.0.0.1:7687/default -U neo4j -P xxx -f ./ 

# Import relationships
python3 ../cypher.py import-relationships -f ./relationships -D 127.0.0.1:7687/default -U neo4j -P xxx 
```

## FAQs
1. START_IDs and END_IDs in relationship table cannot match with the IDs in related nodes table?
2. Specification of node and relationship file format? How to check the format of the file?
    Node file format:
    ```
    ID,:LABEL,name,resource
    ENTREZ:1000,GENE,ABCA1,entrez
    ```

    Relationship file format:
    ```
    START_ID,END_ID,TYPE,resource,source_type,target_type
    ENTREZ:1000,ENTREZ:1001,INTERACTS_WITH,entrez,GENE,GENE
    ```

3. Prefer to use csv or tsv format?