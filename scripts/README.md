## Preparation

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

### Prepare expr files

File name must be `[organ]_[fpkm|tpm|counts]_[limma|wilcox|ttest].csv`.

Each organ have a expression table. The row is ensembl id, the column is sample, each cell is expression value.

```
ensembl_id,sample001,sample002,...
```

### Prepare pathway file

```
entrez_id
pathway_id
gene_symbol
ensembl_id
pathway_name
```

### Prepare genes file

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


## Make databases

```
python3 scripts/make_db.py dataset -d examples/data/000000 -o examples/db/ -b sqlite
```
