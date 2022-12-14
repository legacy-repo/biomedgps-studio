import GeneList from '@/components/GeneList';
import { getDegs, getGenes } from '@/services/swagger/OmicsData'
import { Row } from 'antd';
import React, { memo } from 'react';
import HelpMessage from '@/components/HelpMessage';
import './index.less';

const GeneListWrapper: React.FC = () => {
  return (
    <Row className='gene-list-wrapper'>
      <HelpMessage position='center'
        title={"Differential Genes"}>
        <p>
          After selecting the dataset in the red box in the upper right corner, you can use the user-defined parameters in the data set range to obtain dynamic data tables.
          <br />
          <b>Gene:</b> Select a gene of interest. You can input ensembl_id, gene_symbol or entrez_id for analyzing. (e.g. Dgat2, 67800 or ENSMUSG00000030747)
          <br />
          <b>Organ:</b> Select an organ of interest.
          <br />
          <b>Method:</b> Select a method, such as ttest, wilcox, or Limma.
          <br />
          <b>DataType:</b> Select a data type, such as FPKM, TPM, or Counts.
          <br />
          <b>DataSet:</b> Click the red box in the upper right corner of the page to select the data set you are interested in, and then select the data set from the drop-down menu here.
        </p>
      </HelpMessage>
      <GeneList queryDEGs={getDegs} queryGenes={getGenes}
        queryGeneBaseUrl="/expression-analysis/single-gene?ensemblId=">
      </GeneList>
    </Row>
  );
};

export default memo(GeneListWrapper);
