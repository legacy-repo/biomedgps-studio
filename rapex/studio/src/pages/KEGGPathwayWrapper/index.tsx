import KEGGPathway from '@/components/KEGGPathway';
import { getPathways, getGenes } from '@/services/swagger/OmicsData'
import React from 'react';
import './index.less';

const KEGGPathwayWrapper: React.FC = () => {
  return (
    <KEGGPathway queryPathways={getPathways} queryGenes={getGenes}
      queryGeneBaseUrl="/expression-analysis/single-gene?ensemblId=">
    </KEGGPathway>
  );
};

export default KEGGPathwayWrapper;
