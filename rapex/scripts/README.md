## Preparation
### Prepare DEGs files

### Prepare expr files


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
