import React, { useEffect, useState } from "react";
import { Tabs } from 'antd';
import type { GraphNode } from '@/pages/KnowledgeGraph/typings';
import { MolStarViewer } from '@/components/BioViewers';
import type { GeneInfo } from '@/components/BioViewers';

import './index.less';

type NodeInfoPanelProps = {
  node?: GraphNode
}

const NodeInfoPanel: React.FC<NodeInfoPanelProps> = (props) => {
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
        <MolStarViewer />
      </Tabs.TabPane>
    </Tabs>
  )
}

export default NodeInfoPanel;