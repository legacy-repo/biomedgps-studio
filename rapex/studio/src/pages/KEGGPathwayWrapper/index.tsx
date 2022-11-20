import KEGGPathway from '@/components/KEGGPathway';
import { getPathways, getGenes } from '@/services/swagger/OmicsData'
import React from 'react';
import './index.less';

const KEGGPathwayWrapper: React.FC = () => {
  return (
    <KEGGPathway queryPathways={getPathways} queryGenes={getGenes}></KEGGPathway>
  );
};

export default KEGGPathwayWrapper;
