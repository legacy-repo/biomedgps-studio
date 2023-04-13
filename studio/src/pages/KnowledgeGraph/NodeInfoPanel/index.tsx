import React, { useEffect, useState } from "react";
import { Tabs, Row, Empty } from 'antd';
import type { GraphNode } from '@/pages/KnowledgeGraph/typings';
import {
  GTexViewer, MutationViewer, MolStarViewer,
  getGeneInfo
} from '@/components/BioViewers';
import type { GeneInfo } from '@/components/BioViewers';

import './index.less';

type NodeInfoPanelProps = {
  node?: GraphNode
}

const NodeInfoPanel: React.FC<NodeInfoPanelProps> = (props) => {
  const { node } = props;
  const [nodeType, setNodeType] = useState<string | undefined>(undefined);
  const [info, setInfo] = useState<GeneInfo | undefined>(undefined);

  useEffect(() => {
    console.log('node', node);
    if (node) {
      const label = node.nlabel.toLocaleLowerCase();
      if (label === "gene") {
        setNodeType("gene");
        // TODO: Need to keep the type of id same with the type of knowledge graph's node id
        getGeneInfo(node.data.id).then((info) => {
          setInfo(info);
        });
      } else if (label === "drug") {
        setNodeType("drug");
      } else if (label === "disease") {
        setNodeType("disease");
      }
    }
  }, [node]);

  return (
    <Row className="node-info-panel">
      {
        // TODO: Get more gene infomation from MyGene.info or other API
        nodeType === "gene" ?
          <Tabs className="gene-info-panel tabs-nav-right">
            <Tabs.TabPane tab={"Info"} key={"info"}>
              <img width={'100%'} src="/examples/gene-info.png" />
            </Tabs.TabPane>
            <Tabs.TabPane tab={"Gene"} key={"gene"}>
              {
                info?.ensembl.gene ?
                  <GTexViewer officialGeneSymbol={info?.ensembl.gene} type="gene" />
                  : <Empty description="No gene data" />
              }
            </Tabs.TabPane>
            <Tabs.TabPane tab={"Transcript"} key={"transcripts"}>
              {
                info?.ensembl.gene ?
                  <GTexViewer officialGeneSymbol={info?.ensembl.gene} type="transcript" />
                  : <Empty description="No transcript data" />
              }
            </Tabs.TabPane>
            <Tabs.TabPane tab={"Mutations"} key={"gene-mutations"}>
              <MutationViewer />
            </Tabs.TabPane>
            <Tabs.TabPane tab={"3D Structure"} key={"protein-3d"}>
              <MolStarViewer />
            </Tabs.TabPane>
          </Tabs>
          : null
      }
      {
        nodeType === "drug" ?
          <Tabs className="drug-info-panel">
            <Tabs.TabPane tab={"Drug Info"} key={"drug-info"}>
              Comming Soon...
            </Tabs.TabPane>
            <Tabs.TabPane tab={"3D Structure"} key={"drug-3d"}>
              <MolStarViewer />
            </Tabs.TabPane>
          </Tabs>
          : null
      }
      {
        nodeType === "disease" ?
          <Tabs className="disease-info-panel">
            <Tabs.TabPane tab={"Disease Info"} key={"disease-info"}>
              Comming Soon...
            </Tabs.TabPane>
            <Tabs.TabPane tab={"Clinical Trials"} key={"clinical-trails"}>
              <img width={"100%"} src="/examples/clinical-trials.png" />
            </Tabs.TabPane>
          </Tabs> : null
      }
      {
        nodeType === undefined ?
          <Empty /> : null
      }
    </Row>
  )
}

export default NodeInfoPanel;