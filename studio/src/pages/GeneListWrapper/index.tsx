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
        <p>This is an example.</p>
      </HelpMessage>
      <GeneList queryDEGs={getDegs} queryGenes={getGenes}
        queryGeneBaseUrl="/expression-analysis/single-gene?ensemblId=">
      </GeneList>
    </Row>
  );
};

export default memo(GeneListWrapper);
