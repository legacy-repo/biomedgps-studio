import React, { useEffect, useState } from "react";
import { Empty, Row } from 'antd';
import type { GraphNode } from '@/pages/KnowledgeGraph/typings';
import DiseasePanel from './DiseasePanel';
import DrugPanel from './DrugPanel';
import GenePanel from './GenePanel';

import './index.less';

type NodeInfoPanelProps = {
  node?: GraphNode
}

const NodeInfoPanel: React.FC<NodeInfoPanelProps> = (props) => {
  const { node } = props;
  const [nodeType, setNodeType] = useState<string | undefined>(undefined);

  const whichPanel = (type: string | undefined) => {
    switch (type) {
      case "gene":
        return <GenePanel node={node} />
      case "drug":
        return <DrugPanel node={node} />
      case "disease":
        return <DiseasePanel node={node} />
      default:
        return <Empty />
    }
  }


  useEffect(() => {
    if (node) {
      const label = node.nlabel.toLocaleLowerCase();

      if (["gene", "protein"].includes(label)) {
        setNodeType("gene");
      }

      if (["drug", "chemical", "compound"].includes(label)) {
        setNodeType("drug");
      }

      if (["disease"].includes(label)) {
        setNodeType("disease");
      }
    }
  }, [node]);

  return (
    <Row className="node-info-panel">
      {
        whichPanel(nodeType)
      }
    </Row>
  )
}

export default NodeInfoPanel;