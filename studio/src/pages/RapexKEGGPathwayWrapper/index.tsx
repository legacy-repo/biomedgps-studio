import KEGGPathway from '@/components/KEGGPathway';
import { getDatasetRapexPathways, getDatasetRapexGenes } from '@/services/swagger/RapexDataset'
import React from 'react';
import { Row } from 'antd';
import HelpMessage from '@/components/HelpMessage';
import { useModel } from 'umi';
import './index.less';

const KEGGPathwayWrapper: React.FC = () => {
  const { defaultDataset } = useModel('dataset', (ret) => ({
    defaultDataset: ret.defaultDataset,
    setDataset: ret.setDataset,
  }));

  return (
    <Row className='kegg-pathway-wrapper'>
      <HelpMessage position='center'
        title={"Discovery Genes in KEGG Pathway"}>
        <p>
          This page contains the pathway of the mouse tag and the genes contained in each pathway, and you can use the pathway name, pathway id, or gene id to confirm which pathway the gene you want belongs to.
          <br />
          <b>Pathway ID:</b> Enter the corresponding pathway ID, which is usually composed of 2-4 letter prefix code and 5 digital number.(e.g. path:mmu00010)
          <br />
          <b>Pathway Name:</b> You can input he name of a KEGG pathway.
          <br />
          <b>Gene:</b> Select genes of interest. You can input gene_symbol,ensembl_id or entrez_id to analyze.
        </p>
      </HelpMessage>
      <KEGGPathway
        dataset={defaultDataset}
        queryPathways={getDatasetRapexPathways}
        queryGenes={getDatasetRapexGenes}
        queryGeneBaseUrl="/expression-analysis/single-gene?ensemblId=">
      </KEGGPathway>
    </Row>
  );
};

export default KEGGPathwayWrapper;
