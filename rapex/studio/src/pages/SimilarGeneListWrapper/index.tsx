import SimilarGeneList from '@/components/SimilarGeneList';
import { getSimilarGenes, getGenes } from '@/services/swagger/OmicsData'
import React from 'react';
import './index.less';

const SimilarGeneListWrapper: React.FC = () => {
  return (
    <SimilarGeneList querySimilarGenes={getSimilarGenes} queryGenes={getGenes}></SimilarGeneList>
  );
};

export default SimilarGeneListWrapper;
