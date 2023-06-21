## Introduction

Statement: All the datasets on the RAPEX platform are computed by [r-omics-utils](https://github.com/yjcyxky/r-omics-utils.git). Use the Google Chrome browser for best visualization quality and experience.

RAPEX is a newly developed interactive web server for focusing on pollution-caused damage within and across organ, as well as inter-species by RNA-seq analysis. Target users are researchers interested in air pollution health outputs on gene level. Researchers can access datasets we generated from mice in lab, as well as selected from various sources in the server. Upon selecting datasets, featured interactive visual outputs on rich differential gene analysis integrated in the platform are displayed. Analysis portion is consistent of three parts, single gene analysis most useful for inter-organ analysis, multiple gene differential analysis, and custom analysis allowing customized inputs and settings.

## Quick Analysis

Enter a gene symbol, ensembl id or entrez id in the searching box, and click your interested gene to analyze.

<img src="/images/search-box.png" alt="Search Box" width="100%" />

## Results Downloading and Editing

### Download the analysis image
The SVG is available by clicking the button nearby the results.

<div style="display: flex; justify-content: center;">
<img src="/images/download-image.png" alt="Download Image" width="60%" />
</div>

### Download the data

<div style="display: flex; justify-content: center;">
<img src="/images/download-data.png" alt="Download Data" width="60%" />
</div>

### Download the metadata

<div style="display: flex; justify-content: center;">
<img src="/images/download-metadata.png" alt="Download Metadata" width="60%" />
</div>

### Edit chart

If you want to edit the chart to improve styles, add new data, or add your custom image, you can click the `Edit` button.

<div style="display: flex; justify-content: center;">
<img src="/images/plot-viewer.png" alt="Chart Viewer" width="60%" />
</div>

After editing the chart, you can click the `Exit Editor` button.

<div style="display: flex; justify-content: center;">
<img src="/images/plot-editor.png" alt="Chart Editor" width="60%" />
</div>


## Components
### Differential Genes Table
After selecting the dataset in the red box in the upper right corner, you can use the user-defined parameters in the data set range to obtain dynamic data tables.

Parameters：
- Gene: Select a gene of interest. You can input ensembl_id, gene_symbol or entrez_id for searching. (e.g. Dgat2, 67800 or ENSMUSG00000030747)
- Organ: Select an organ of interest.
- DataType: Select a data type, such as FPKM, TPM, or Counts.
- DataSet: Click the red box in the upper right corner of the page to select the data set you are interested in, and then select the data set from the drop-down menu here.
- Method: Select a method, such as ttest, wilcox, or Limma.

### Gene Expression Analysis
#### <img src="/images/arrow.svg" width="25px" height="25px" /> Boxplot
RAPEX generates boxplot with jitter for comparing expression in an organ type and several genes.

Parameters：
- DataSet: Which dataset do you want to analyze?
- Log Scale: Choose whether to use linear or log2(TPM + 1) transformed expression data for plotting.
- Jitter Size: Set the size of jitter across the box.
- DataType: Which data do you want to analyze? FPKM or TPM
- Method: The method for differential analysis. It support Anova, T Test, Wilcox Test, Kruskal Test.
- |log2FC| Cutoff: Set custom fold-change threshold.
- Pvalue Cutoff: Set custom p-value threshold.

Gene expression ~ Group (PM vs. FA):
The expression data are first log2(TPM + 1) transformed for differential analysis and the log2FC is defined as mean(PM) - mean(FA). 
Genes with higher |log2FC| values and lower p values than pre-set thresholds are considered differentially expressed genes.

#### <img src="/images/arrow.svg" width="25px" height="25px" /> Barplot
RAPEX generates barplot with jitter for comparing expression in an organ type and several genes.

Parameters：
- Gene Symbol: Select several genes of interest (you can input ensembl_id, gene_symbol or entrez_id for searching).
- Organ: Select an organ of interest
- DataSet: Which dataset do you want to analyze?
- DataType: Which data do you want to analyze? FPKM or TPM
- Position: Dodge, Stack or Fill
- Log Scale: Choose whether to use linear or log2(TPM + 1) transformed expression data for plotting.

#### <img src="/images/arrow.svg" width="25px" height="25px" /> Across Organs (Boxplot)
RAPEX generates boxplot with jitter for comparing expression in several organ types and one gene.

Parameters:
- Gene Symbol: Select a gene of interest. You can input ensembl_id, gene_symbol or entrez_id for searching. (e.g. Dgat2, 67800 or ENSMUSG00000030747)
- Organ: Select organs of interest.
- DataSet: Which dataset do you want to analyze?
- DataType: Which data do you want to analyze? FPKM or TPM
- Log Scale: Choose whether to use linear or log2(TPM + 1) transformed expression data for plotting.
- Jitter Size: Set the size of jitter across the box.
- Method: The method for differential analysis. It support Anova, T Test, Wilcox Test, Kruskal Test.
- |log2FC| Cutoff: Set custom fold-change threshold.
- Pvalue Cutoff: Set custom p-value threshold.

Gene expression ~ Group (PM vs. FA):
The expression data are first log2(TPM + 1) transformed for differential analysis and the log2FC is defined as mean(PM) - mean(FA).
Genes with higher |log2FC| values and lower p values than pre-set thresholds are considered differentially expressed genes.

#### <img src="/images/arrow.svg" width="25px" height="25px" /> Across Organs (Barplot)

RAPEX generates barplot with jitter for comparing expression in several organ types and one gene.

Parameters:
- Gene Symbol: Select a gene of interest. You can input ensembl_id, gene_symbol or entrez_id for searching. (e.g. Dgat2, 67800 or ENSMUSG00000030747)
- Organ: Select organs of interest.
- DataSet: Which dataset do you want to analyze?
- DataType: Which data do you want to analyze? FPKM or TPM
- Position: Dodge, Stack or Fill
- Log Scale: Choose whether to use linear or log2(TPM + 1) transformed expression data for plotting.

#### <img src="/images/arrow.svg" width="25px" height="25px" /> Correlation Analysis

This function can generate pictures of differential correlations between gene pairs under various conditions using Spearman's or Kendall's methods. You can select the gene list of interest to generate a gene correlation heat map, and the shade of the block color represents the correlation between two genes.

Parameters:
- Gene Symbol: Select several genes of interest. You can input ensembl_id, gene_symbol or entrez_id for searching. (e.g. Dgat2, 67800 or ENSMUSG00000030747)
- Organ: Select an organ of interest.
- Data type: Which data do you want to analyze? FPKM or TPM
- Scale: Allowed values are none (default), row, col.
- Rownames: Boolean specifying if row names are be shown.
- Colnames: Boolean specifying if column names are be shown.
- Corr Type: Character indicating which method to computing correlation coefficient. spearman or pearson.

#### <img src="/images/arrow.svg" width="25px" height="25px" /> Multiple Genes Comparison
This feature can generate matrix plots of the expression of different genes in different organs. The shade of each block color represents the level of gene expression.

Parameters:
- Gene Symbol: Select several genes of interest. You can input ensembl_id, gene_symbol or entrez_id for searching. (e.g. Dgat2, 67800 or ENSMUSG00000030747)
- Organ: Select some organs of interest.
- DataSet: Click the red box in the upper right corner of the page to select the data set you are interested in, and then select the data set from the drop-down menu here.
- Data type: Which data do you want to analyze? FPKM or TPM
- Method: Select a method, such as mean or median.
- Log Scale: Logical value. If TRUE input data will be transformation using log2 function.

#### <img src="/images/arrow.svg" width="25px" height="25px" /> Similar Genes Detection
This function identifies genes with similar expression patterns within selected datasets and generates a list.
Parameters:
- Gene: Select a gene of interest. You can input ensembl_id, gene_symbol or entrez_id for searching. (e.g. Dgat2, 67800 or ENSMUSG00000030747)
- Organ: Select an organ of interest.
- DataSet: Click the red box in the upper right corner of the page to select the data set you are interested in, and then select the data set from the drop-down menu here.
