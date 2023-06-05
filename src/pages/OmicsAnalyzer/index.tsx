import React, { useEffect, useState } from "react";
import { Tabs } from 'antd';
import { getItems4OmicsAnalyzer } from '@/plugins4omics';

import './index.less';

const OmicsAnalyzer: React.FC = (props) => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    setItems(getItems4OmicsAnalyzer());
  }, []);

  return (
    <Tabs className="omics-analyzer" items={items}>
    </Tabs>
  )
}

export default OmicsAnalyzer;