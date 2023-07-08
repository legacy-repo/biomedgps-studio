import React, { useEffect, useState } from "react";
import { Tabs, Empty, Button, Popover } from 'antd';
import { filter, map } from 'lodash';
import type { GraphNode } from '../typings';
import type { GeneInfo } from './typings';
import { entityId2id } from './utils';

import './gene-panel.less';
import { SettingOutlined } from "@ant-design/icons";

type NodeInfoPanelProps = {
  node?: GraphNode
  getItems4GenePanel: (info: GeneInfo, exclude: any[]) => any[]
  getGeneInfo: (geneId: string) => Promise<GeneInfo>
}

const GeneNodeInfoPanel: React.FC<NodeInfoPanelProps> = (props) => {
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
      const entrezId = entityId2id(node.data.id);
      // TODO: Need to keep the type of id same with the type of knowledge graph's node id
      props.getGeneInfo(entrezId).then((info) => {
        setInfo(info);

        setItems(props.getItems4GenePanel(
          info,
          filter(checkItems, (item) => !item.checked))
        );
      }).catch((error) => {
        console.log('getGeneInfo Error: ', error);
        setInfo(undefined);
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

export default GeneNodeInfoPanel;