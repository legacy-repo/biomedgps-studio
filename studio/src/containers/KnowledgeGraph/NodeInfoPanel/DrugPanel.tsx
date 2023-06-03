import React, { useEffect, useState } from "react";
import { Tabs } from 'antd';

import type { GeneInfo } from './typings';
import type { GraphNode } from '../typings';

import './index.less';

type NodeInfoPanelProps = {
  node?: GraphNode
}

const DrugNodeInfoPanel: React.FC<NodeInfoPanelProps> = (props) => {
  const { node } = props;
  const [info, setInfo] = useState<GeneInfo | undefined>(undefined);

  useEffect(() => {

  }, [node]);

  return (
    <Tabs className="drug-info-panel">
      <Tabs.TabPane tab={"Drug Info"} key={"drug-info"}>
        Comming Soon...
      </Tabs.TabPane>
      <Tabs.TabPane tab={"3D Structure"} key={"drug-3d"}>
        Comming Soon...
      </Tabs.TabPane>
    </Tabs>
  )
}

export default DrugNodeInfoPanel;