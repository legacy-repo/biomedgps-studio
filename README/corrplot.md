## Correlation Analysis

This module can generate pictures of differential correlations between gene pairs under various conditions using Spearman's or Kendall's methods. You can select the gene list of interest to generate a gene correlation heat map, and the shade of the block color represents the correlation between two genes.

### Example

<img src="/README/corrplot_example.svg" style="width: 100%; height: 100%;"/>

### Parameters

- Gene Symbol
  
  Select several genes of interest. You can input ensembl_id, gene_symbol or entrez_id for searching. (e.g. Dgat2, 67800 or ENSMUSG00000030747)

- Organ
  
  Select an organ of interest.

- DataType
  
  Which data do you want to analyze? FPKM or TPM.

- Scale
  
  Allowed values are none (default), row, col.

- Rownames

  Boolean, specifying if row names are be shown.

- Colnames
  
  Boolean specifying if column names are be shown.

- CorrType
  
  Character indicating which method to computing correlation coefficient. spearman or pearson.
