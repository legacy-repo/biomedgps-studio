import GeneList from '@/components/GeneList';
import { getDegs } from '@/services/swagger/OmicsData'
import React from 'react';
import './index.less';

const GeneListWrapper: React.FC = () => {
  return (
    <GeneList queryDEGs={getDegs}></GeneList>
  );
};

export default GeneListWrapper;
