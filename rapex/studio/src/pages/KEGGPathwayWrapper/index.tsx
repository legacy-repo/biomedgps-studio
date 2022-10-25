import KEGGPathway from '@/components/KEGGPathway';
import { getPathways } from '@/services/swagger/OmicsData'
import React from 'react';
import './index.less';

const KEGGPathwayWrapper: React.FC = () => {
  return (
    <KEGGPathway queryPathways={getPathways}></KEGGPathway>
  );
};

export default KEGGPathwayWrapper;
