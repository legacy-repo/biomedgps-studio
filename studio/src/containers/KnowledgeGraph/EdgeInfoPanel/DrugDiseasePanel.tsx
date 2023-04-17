import React, { useEffect } from "react";
import { Tabs } from 'antd';
import type { EdgeInfo } from '@/containers/KnowledgeGraph/typings';

import './index.less';

type EdgeInfoPanelProps = {
  edgeInfo?: EdgeInfo
}

const EdgeInfoPanel: React.FC<EdgeInfoPanelProps> = (props) => {
  const { edge, startNode, endNode } = props.edgeInfo || {
    edge: undefined, startNode: undefined, endNode: undefined
  };

  useEffect(() => {

  }, [edge, startNode, endNode]);

  return (
    <Tabs className="drug-disease-info-panel tabs-nav-right">
      <Tabs.TabPane tab={"DrugDisease Info"} key={"drug-disease-info"}>
        We can show the drug-disease association information here. Maybe it's summarized information from clinical trials, or publications.
      </Tabs.TabPane>
      <Tabs.TabPane tab={"Patents"} key={"drug-patent-info"}>
        We can show the patents information here. Maybe it's summarized information from patents database.
      </Tabs.TabPane>
      <Tabs.TabPane tab={"Products"} key={"drug-product-info"}>
        We can show the production information here. Maybe it's summarized information from drug production database.
      </Tabs.TabPane>
    </Tabs>
  )
}

export default EdgeInfoPanel;