import GeneList from '@/components/GeneList';
import { getDegs, getGenes } from '@/services/swagger/OmicsData'
import React from 'react';
import './index.less';

const GeneListWrapper: React.FC = () => {
  return (
    <GeneList queryDEGs={getDegs} queryGenes={getGenes}
      queryGeneBaseUrl="/expression-analysis/single-gene?ensemblId=">
    </GeneList>
  );
};

export default GeneListWrapper;
