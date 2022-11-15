library(Hmisc)
library(dplyr)
library(reshape2)

organ <- "tyr"

dataset <- read.csv(paste0("./data/000000/expr/", organ, "_fpkm.csv"), header=TRUE, row.names = 1)
diff_genes <- read.csv(paste0("./data/000000/degs/", organ, "_fpkm_ttest.csv"), header=TRUE, row.names = 1)

genes <- diff_genes[which(abs(diff_genes$logfc) >= 1),]
target_genes <- rownames(genes)
target_dataset <- dataset[target_genes,]

d <- as.data.frame(t(target_dataset))
d <- d %>% select_if(colSums(.) != 0)
d <- na.omit(d)

corr_mat <- rcorr(as.matrix(d))

r <- melt(corr_mat$r)
pvalue <- melt(corr_mat$P)
results <- merge(r, pvalue, by=c("Var1", "Var2"))
colnames(results) <- c("queried_ensembl_id", "ensembl_id", "PCC", "pvalue")
filtered_results <- na.omit(results)
write.csv(filtered_results, file=paste0("./data/000000/similar_genes/", organ, "_similar_genes.csv"), quote=FALSE, row.names=FALSE)
