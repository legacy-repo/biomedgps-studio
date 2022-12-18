/* eslint-disable no-undef */
import React, { useEffect, useState } from 'react';
import { Row, Col, Tabs, Table, message, Descriptions } from 'antd';
import type { TableColumnType } from 'antd';
// import { Utils } from '@antv/graphin';
import { Config } from './MenuButton';
import Toolbar from './Toolbar';
import { uniqBy } from 'lodash';
import GraphinWrapper from './GraphinWrapper';
import MenuButton from './MenuButton';
import QueryBuilder from './QueryBuilder';
import { getNodes } from '@/services/swagger/Graph';
import { makeColumns, makeDataSources } from './utils';

import './index.less';

const oldLayout = {
  type: 'graphin-force',
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

export function makeQueryStr(
  match_clause: string,
  where_clause: string
): string {
  return `{:match "${match_clause}" :where "${where_clause}" :limit 100 :return "n, r, m"}`;
}

const KnowledgeGraph: React.FC = () => {
  // const [data, setData] = useState(Utils.mock(8).circle().graphin())
  const [data, setData] = useState<{ nodes: Array<GraphNode>, edges: Array<GraphEdge> }>({
    nodes: [],
    edges: []
  });
  const [statistics, setStatistics] = useState<Record<string, any>>({});
  const [nodeColumns, setNodeColumns] = useState<TableColumnType<any>[]>([]);
  const [nodeDataSources, setNodeDataSources] = useState<Array<Record<string, any>>>([]);
  const [edgeColumns, setEdgeColumns] = useState<TableColumnType<any>[]>([]);
  const [edgeDataSources, setEdgeDataSources] = useState<Array<Record<string, any>>>([]);

  const [currentNode, setCurrentNode] = useState<string>("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string>>([]);

  const [layout, setLayout] = React.useState<any>({});
  const [config, setConfig] = React.useState<Config & { layout?: any } | undefined>({
    layout: 'graphin-force',
    miniMapEnabled: true,
    snapLineEnabled: true,
    nodeTooltipEnabled: true,
    edgeTooltipEnabled: false
  });

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

    setStatistics({
      node: data.nodes.length,
      edge: data.edges.length
    })
  }, [data])

  const onChangeConfig = (config: Config, layout: any) => {
    setLayout(layout)
    setConfig(config)
  }

  const searchLabel = (label: string, value: string | undefined) => {
    if (label && value) {
      getNodes({
        query_str: makeQueryStr(`(n:${label})-[r]-(m)`, `n.id = '${value}'`)
      }).then(response => {
        setData(response)
      }).catch(error => {
        message.warn("Unknown error, please retry later.")
        console.log("getNodes Error: ", error)
      })

    }
  }

  const searchRelationshipsById = (label: string, id: string | undefined) => {
    if (label && id) {
      getNodes({
        query_str: makeQueryStr(`(n:${label})-[r]-(m)`, `id(n) = ${id}`)
      }).then(response => {
        const merged_data = {
          nodes: uniqBy([...data.nodes, ...response.nodes], "id"),
          edges: [...data.edges, ...response.edges],
        };
        setData(merged_data);
      }).catch(error => {
        message.warn("Unknown error, please retry later.")
        console.log("getNodes Error: ", error)
      })
    }
  }

  const handleChange = (menuItem: any, menuData: any, graph: any, graphin: any) => {
    console.log(`handleChange [${menuItem.name}]: `, menuItem, menuData);
    if (menuItem.key == 'delete' && menuItem.name == 'Delete Node') {
      const id = menuData.id;
      const item = graph.findById(id);

      if (item) {
        graph.removeItem(item);
      }
    } else if (menuItem.key == 'expand' && menuItem.name == 'Expand One Level') {
      const node_label = menuData.nlabel;
      const id = menuData.id;
      console.log("Expand node: ", node_label, id)
      searchRelationshipsById(node_label, id);
    } else {
      message.warn("Don't support this action, please contact administrator.");
    }
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

  const DataArea: React.FC<{ data: Record<string, any>, style?: any }> = ({ data, style }) => {
    const items = Object.keys(data).map(key => {
      return (
        <Descriptions.Item key={key} label={key}>
          {data[key]}
        </Descriptions.Item>
      )
    })
    return (
      items.length > 0 ?
        (<Descriptions size={"small"} column={1} title={null} bordered style={style}>
          {items}
        </Descriptions>)
        : (<span style={style}>No Properties</span>)
    )
  }

  return (
    <Row className='knowledge-graph-container'>
      <DataArea data={statistics} style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10 }}></DataArea>
      <MenuButton config={config} onChangeConfig={onChangeConfig}
        style={{ zIndex: 10, position: 'relative', maxWidth: 'unset', maxHeight: 'unset' }}>
      </MenuButton>
      <QueryBuilder onChange={searchLabel}></QueryBuilder>
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
        <GraphinWrapper selectedNode={currentNode} handleChange={handleChange}
          config={config} data={data} layout={{ ...oldLayout, ...layout }} style={style}>
        </GraphinWrapper>
      </Col>
    </Row >
  );

};

export default KnowledgeGraph;
