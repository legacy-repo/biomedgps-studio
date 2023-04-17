import React, { useEffect, useState } from "react";
import { Tabs, Empty, Button, Popover } from 'antd';
import { filter, map } from 'lodash';
import { getGeneInfo } from '@/plugins4kg/utils';
import { getItems4GenePanel } from '@/plugins4kg';

import type { GraphNode } from '@/containers/KnowledgeGraph/typings';
import type { GeneInfo } from '@/plugins4kg/utils';

import './gene-panel.less';
import { SettingOutlined } from "@ant-design/icons";

type NodeInfoPanelProps = {
  node?: GraphNode
}

const NodeInfoPanel: React.FC<NodeInfoPanelProps> = (props) => {
  const { node } = props;
  const [info, setInfo] = useState<GeneInfo | undefined>(undefined);
  const [checkItems, setCheckItems] = useState<any[]>([
    {
      label: "Summary",
      key: "summary",
      checked: true
    },
    {
      label: "Gene",
      key: "gene",
      checked: true
    },
    {
      label: "Transcript",
      key: "transcript",
      checked: true
    },
    {
      label: "Mutation",
      key: "mutation",
      checked: true
    },
    {
      label: "3D Structure",
      key: "structure",
      checked: true
    },
    {
      label: "Sgrna",
      key: "sgrna",
      checked: true
    },
  ]);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (node) {
      // TODO: Need to keep the type of id same with the type of knowledge graph's node id
      getGeneInfo(node.data.id).then((info) => {
        setInfo(info);

        setItems(getItems4GenePanel(info, filter(checkItems, (item) => !item.checked)));
      });
    }
  }, [node, checkItems]);

  const CheckList = () => {
    const onChange = (e: any) => {
      const { checked, value } = e.target;
      if (checked) {
        setCheckItems(map(checkItems, (item: any) => {
          if (item.key === value) {
            item.checked = true;
          }
          return item;
        }))
      } else {
        setCheckItems(map(checkItems, (item: any) => {
          if (item.key === value) {
            item.checked = false;
          }
          return item;
        }))
      }
    }

    return (
      <div>
        {items.map((item) => (
          <div key={item.key}>
            <input type="checkbox" defaultChecked={item.checked} value={item.key} onChange={onChange} />
            &nbsp;
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    )
  }

  const OperationsSlot: React.ReactNode = (
    <Popover content={CheckList()}>
      <Button shape="circle" className="tabs-extra-button" icon={<SettingOutlined />}>
      </Button>
    </Popover>
  );

  return (
    <Tabs className="gene-info-panel tabs-nav-right"
      tabBarExtraContent={{ left: OperationsSlot, right: null }}
      items={items}>
    </Tabs>
  )
}

export default NodeInfoPanel;