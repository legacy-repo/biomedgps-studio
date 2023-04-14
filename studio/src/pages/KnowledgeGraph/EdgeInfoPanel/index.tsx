import React, { useEffect, useState } from "react";
import { Tabs, Row, Empty } from 'antd';
import type { EdgeInfo } from '@/pages/KnowledgeGraph/typings';
import DrugGene from './DrugGenePanel';
import DrugDisease from './DrugDiseasePanel';
import GeneDisease from './DiseaseGenePanel';

import './index.less';

type EdgeInfoPanelProps = {
  edgeInfo?: EdgeInfo
}

const EdgeInfoPanel: React.FC<EdgeInfoPanelProps> = (props) => {
  const { edge, startNode, endNode } = props.edgeInfo || {
    edge: undefined, startNode: undefined, endNode: undefined
  };
  const [relationType, setRelationType] = useState<string>("Unknown");

  const whichPanel = (relationType: string) => {
    console.log("whichPanel: ", relationType)
    switch (relationType) {
      case "DrugDisease":
        return <DrugDisease edgeInfo={props.edgeInfo} />
      case "DrugGene":
        return <DrugGene edgeInfo={props.edgeInfo} />
      case "GeneDisease":
        return <GeneDisease edgeInfo={props.edgeInfo} />
      default:
        return <Empty />
    }
  }

  useEffect(() => {
    console.log("EdgeInfoPanel: ", edge, startNode, endNode)
    if (edge && startNode && endNode) {
      const startNodeType = startNode.nlabel;
      const endNodeType = endNode.nlabel;
      const relationTypes = [startNodeType, endNodeType].sort().join("")

      console.log("relationTypes: ", relationTypes, relationType)

      setRelationType("");

      if (["CompoundDisease", "ChemicalDisease", "DiseaseDrug"].indexOf(relationTypes) >= 0) {
        setRelationType("DrugDisease");
      }

      if (["DiseaseGene", "GeneDisease"].indexOf(relationTypes) >= 0) {
        setRelationType("GeneDisease");
      }

      if (["CompoundGene", "ChemicalGene", "DrugGene"].indexOf(relationTypes) >= 0) {
        setRelationType("DrugGene");
      }
    }
  }, [edge, startNode, endNode]);

  return (
    <Row className="edge-info-panel">
      {
        whichPanel(relationType)
      }
    </Row>
  )
}

export default EdgeInfoPanel;