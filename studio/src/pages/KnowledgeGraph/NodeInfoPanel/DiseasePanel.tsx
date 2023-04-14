import React, { useEffect, useState } from "react";
import { Tabs } from 'antd';
import type { GraphNode } from '@/pages/KnowledgeGraph/typings';
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
    <Tabs className="disease-info-panel">
      <Tabs.TabPane tab={"Disease Info"} key={"disease-info"}>
        Comming Soon...
      </Tabs.TabPane>
      <Tabs.TabPane tab={"Clinical Trials"} key={"clinical-trails"}>
        <img width={"100%"} src="/examples/clinical-trials.png" />
      </Tabs.TabPane>
    </Tabs>
  )
}

export default NodeInfoPanel;