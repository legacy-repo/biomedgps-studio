import KEGGPathway from '@/components/KEGGPathway';
import { getPathways, getGenes } from '@/services/swagger/OmicsData'
import React from 'react';
import { Row } from 'antd';
import HelpMessage from '@/components/HelpMessage';
import './index.less';

const KEGGPathwayWrapper: React.FC = () => {
  return (
    <Row className='kegg-pathway-wrapper'>
      <HelpMessage position='center'
        title={"Discovery Genes in KEGG Pathway"}>
        <p>This is an example.</p>
      </HelpMessage>
      <KEGGPathway queryPathways={getPathways} queryGenes={getGenes}
        queryGeneBaseUrl="/expression-analysis/single-gene?ensemblId=">
      </KEGGPathway>
    </Row>
  );
};

export default KEGGPathwayWrapper;
