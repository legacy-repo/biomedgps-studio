import SimilarGeneList from '@/components/SimilarGeneList';
import { getSimilarGenes, getGenes } from '@/services/swagger/OmicsData'
import { Drawer, Row } from 'antd';
import HelpMessage from '@/components/HelpMessage';
import SingleGene from '@/pages/SingleGene';
import React, { useState } from 'react';
import './index.less';

const SimilarGeneListWrapper: React.FC = () => {
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [ensemlId, setEnsembl] = useState<string | null>(null);

  return (
    <Row className='similar-genelist-wrapper'>
      <HelpMessage position='center'
        title={"Similar Genes Detection"}>
        <p>This is an example.</p>
      </HelpMessage>
      <SimilarGeneList querySimilarGenes={getSimilarGenes}
        queryGenes={getGenes}
        showDetails={(ensemblId) => {
          setEnsembl(ensemblId);
          setShowDetail(true);
        }}>
      </SimilarGeneList>

      <Drawer
        width={'80%'}
        visible={showDetail}
        className="gene-details"
        onClose={() => {
          setShowDetail(false)
          setEnsembl(null)
        }}
        closable={true}
        maskClosable={true}
      >
        <SingleGene ensemblId={ensemlId}></SingleGene>
      </Drawer>
    </Row>
  );
};

export default SimilarGeneListWrapper;
