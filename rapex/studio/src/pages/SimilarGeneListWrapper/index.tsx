import SimilarGeneList from '@/components/SimilarGeneList';
import { getSimilarGenes } from '@/services/swagger/OmicsData'
import React from 'react';
import './index.less';

const SimilarGeneListWrapper: React.FC = () => {
  return (
    <SimilarGeneList querySimilarGenes={getSimilarGenes}></SimilarGeneList>
  );
};

export default SimilarGeneListWrapper;
