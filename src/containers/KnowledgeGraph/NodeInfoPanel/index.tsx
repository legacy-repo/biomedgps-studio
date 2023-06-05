import React from "react";
import { Empty, Row } from 'antd';
import type { GraphNode } from '../typings';
import DiseasePanel from './DiseasePanel';
import DrugPanel from './DrugPanel';
import GenePanel from './GenePanel';
import type {
  GetGeneInfoFn, GetItems4GenePanelFn
} from './typings';

import './index.less';

type NodeInfoPanelProps = {
  node?: GraphNode,
  getItems4GenePanel: GetItems4GenePanelFn,
  getGeneInfo: GetGeneInfoFn,
}

const NodeInfoPanel: React.FC<NodeInfoPanelProps> = (props) => {
  const { node } = props;

  // You should add your own logic here to map the node label to the panel type
  const mapNode2Type = (node: GraphNode | undefined) => {
    if (node) {
      const label = node.nlabel.toLocaleLowerCase();

      if (["gene", "protein"].includes(label)) {
        return <GenePanel node={node} getGeneInfo={props.getGeneInfo}
          getItems4GenePanel={props.getItems4GenePanel}>
        </GenePanel>;
      }

      if (["drug", "chemical", "compound"].includes(label)) {
        return <DrugPanel node={node} />;
      }

      if (["disease"].includes(label)) {
        return <DiseasePanel node={node} />;
      }
    }

    return (<Empty />);
  }

  return (
    <Row className="node-info-panel">
      {
        mapNode2Type(node)
      }
    </Row>
  )
}

export default NodeInfoPanel;