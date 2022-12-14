## Across Organs (Boxplot)

RAPEX generates boxplot with jitter for comparing expression in several organs and one gene.

### Example
<img src="/README/boxplot_organs_example.svg" style="width: 100%; height: 100%;"/>

### Parameters

- Gene Symbol
  
  Select a gene of interest. You can input ensembl_id, gene_symbol or entrez_id for searching. (e.g. Dgat2, 67800 or ENSMUSG00000030747)

- Organ
  
  Select organs of interest.

- DataSet
  
  Which dataset do you want to analyze?

- DataType
  
  Which data do you want to analyze? FPKM or TPM

- Log Scale
  
  Choose whether to use linear or log2(TPM + 1) transformed expression data for plotting.

- Method
  
  The method for differential analysis. It support Anova, T Test, Wilcox Test, Kruskal Test.

- Jitter Size
  
  Set the size of jitter across the box.

- |log2FC| Cutoff
  
  Set custom fold-change threshold.

- Pvalue Cutoff
  
  Set custom p-value threshold.

### Gene expression ~ Group (PM vs. FA)

The expression data are first log2(TPM + 1) transformed for differential analysis and the log2FC is defined as mean(PM) - mean(FA).

Genes with higher |log2FC| values and lower p values than pre-set thresholds are considered differentially expressed genes.