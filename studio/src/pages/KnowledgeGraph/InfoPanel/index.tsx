import React from "react";
import { Tabs } from 'antd';
import './index.less';

const InfoPanel: React.FC = () => {
  const items = [
    { label: 'Info', key: 'info', children: 'Comming soon' },
    { label: 'Ability', key: 'ability', children: 'Comming soon' },
  ];

  return (
    <Tabs className="info-panel">
      {items.map(item => {
        return (
          <Tabs.TabPane tab={item.label} key={item.key}>
            {item.children}
          </Tabs.TabPane>
        )
      })}
    </Tabs>
  )
}

export default InfoPanel;