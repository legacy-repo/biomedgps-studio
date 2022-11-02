/* eslint-disable no-undef */
import React, { useEffect, useState } from 'react';
import { Row, Col, Tabs, Table } from 'antd';
import type { TableColumnType } from 'antd';
import { Utils } from '@antv/graphin';
import { Config } from './MenuButton';
import Toolbar from './Toolbar';
import GraphinWrapper from './GraphinWrapper';
import MenuButton from './MenuButton';
import { request } from 'umi';
import { makeColumns, makeDataSources } from './utils';

import './index.less';

const oldLayout = {
  type: 'concentric',
  minNodeSpacing: 20,
  getId: function getId(d: any) {
    return d.id;
  },
  getHeight: function getHeight() {
    return 16;
  },
  getWidth: function getWidth() {
    return 16;
  },
  getVGap: function getVGap() {
    return 80;
  },
  getHGap: function getHGap() {
    return 50;
  },
}

const style = {
  backgroundImage: `url(${window.publicPath + "graph-background.png"})`
}

export type GraphNode = {
  comboId: string;
  id: string;
  label: string;
  style: any;
  category: 'nodes' | 'edges';
  type: 'graphin-circle';
  data: Record<string, any>
}

export type GraphEdge = {
  relid: string;
  source: string;
  category: 'nodes' | 'edges';
  target: string;
  reltype: string;
  style: any;
  data: Record<string, any>
}

const KnowledgeGraph: React.FC = () => {
  // const [data, setData] = useState(Utils.mock(8).circle().graphin())
  const [data, setData] = useState<{ nodes: Array<GraphNode>, edges: Array<GraphEdge> }>({
    nodes: [],
    edges: []
  });
  const [nodeColumns, setNodeColumns] = useState<TableColumnType<any>[]>([]);
  const [nodeDataSources, setNodeDataSources] = useState<Array<Record<string, any>>>([]);
  const [edgeColumns, setEdgeColumns] = useState<TableColumnType<any>[]>([]);
  const [edgeDataSources, setEdgeDataSources] = useState<Array<Record<string, any>>>([]);

  const [currentNode, setCurrentNode] = useState<string>("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string>>([]);

  const [layout, setLayout] = React.useState<any>({});
  const [config, setConfig] = React.useState<Config & { layout?: any } | undefined>({
    layout: 'concentric',
    miniMapEnabled: false,
    snapLineEnabled: true,
    nodeTooltipEnabled: true,
    edgeTooltipEnabled: false
  });

  useEffect(() => {
    request('/api/v1/nodes', {
      method: 'GET',
      params: {}
    }).then(response => {
      console.log("Get Knowledge Graph Data: ", response)
      setData(response)
    })
  }, [])

  useEffect(() => {
    const nodes = makeDataSources(data.nodes)
    setNodeDataSources(nodes)

    const nodeColumns = makeColumns(nodes, ["comboId", "style", "data"]);
    setNodeColumns(nodeColumns);

    const edges = makeDataSources(data.edges)
    setEdgeDataSources(edges)

    const edgeColumns = makeColumns(edges, []);
    setEdgeColumns(edgeColumns)
    console.log("Node & Edge Columns: ", nodeColumns, edgeColumns);
  }, [data])

  const onChangeConfig = (config: Config, layout: any) => {
    setLayout(layout)
    setConfig(config)
  }

  const handleChange = (menuItem: any, menuData: any) => {
    console.log(menuItem, menuData);
    const count = 4;
    const expandData = Utils.mock(count)
      .expand([menuData])
      .type('company')
      .graphin();

    setData({
      nodes: [...data.nodes, ...expandData.nodes],
      edges: [...data.edges, ...expandData.edges],
    });
    console.log("Data: ", data.nodes, data.edges)
  };

  const rowSelection = {
    selectedRowKeys: selectedRowKeys
  }

  const TableTabs = (props: any) => {
    const counts = React.Children.count(props.children)
    const childrenArray = React.Children.toArray(props.children)
    const items = [
      { label: 'Nodes', key: 'nodes', children: counts >= 2 ? childrenArray[0] : 'No Content' },
      { label: 'Edges', key: 'edges', children: counts >= 2 ? childrenArray[1] : 'No Content' },
    ];
    return (
      <Tabs>
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

  return (
    <Row className='knowledge-graph-container'>
      <MenuButton config={config} onChangeConfig={onChangeConfig} style={{ zIndex: 10, position: 'relative', maxWidth: 'unset', maxHeight: 'unset' }}></MenuButton>
      <Col className='graphin' style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Toolbar position='right'>
        </Toolbar>
        <Toolbar position='bottom'>
          <TableTabs>
            {nodeColumns.length > 0 ?
              <Table size={"small"} scroll={{ y: 200 }} rowKey={"identity"} dataSource={nodeDataSources} columns={nodeColumns} pagination={false}
                onRow={(record, rowIndex) => {
                  return {
                    onClick: event => {
                      console.log("Click the node item: ", event, record)
                      setCurrentNode(record.identity)
                      setSelectedRowKeys([record.identity])
                    }
                  };
                }}
                rowSelection={{
                  type: "radio",
                  ...rowSelection,
                }} />
              : null}
            {nodeColumns.length > 0 ?
              <Table size={"small"} scroll={{ y: 200 }} rowKey={"id"} dataSource={edgeDataSources} columns={edgeColumns} pagination={false} />
              : null}
          </TableTabs>
        </Toolbar>
        <GraphinWrapper selectedNode={currentNode} handleChange={handleChange} config={config} data={data} layout={{ ...oldLayout, ...layout }} style={style}></GraphinWrapper>
      </Col>
    </Row >
  );

};

export default KnowledgeGraph;
