/* eslint-disable no-undef */
import React, { ReactNode, useEffect, useState } from 'react';
import { Row, Col, Tag, Tabs, Table, message, Descriptions } from 'antd';
import type { TableColumnType } from 'antd';
// import { Utils } from '@antv/graphin';
import { Config } from './MenuButton';
import Toolbar from './Toolbar';
import { uniqBy } from 'lodash';
import GraphinWrapper from './GraphinWrapper';
import MenuButton from './MenuButton';
import QueryBuilder from './QueryBuilder';
import AdvancedSearch from './AdvancedSearch';
import ComplexChart from './Chart/ComplexChart';
import {
  makeColumns, makeDataSources, makeGraphQueryStrWithSearchObject, defaultLayout
} from './utils';
import { SearchObject, GraphData, GraphEdge } from './typings';

import './index.less';

const style = {
  backgroundImage: `url(${window.publicPath + "graph-background.png"})`
}


const KnowledgeGraph: React.FC = () => {
  // const [data, setData] = useState(Utils.mock(8).circle().graphin())
  const [data, setData] = useState<GraphData>({
    nodes: [],
    edges: []
  });
  const [statistics, setStatistics] = useState<[ReactNode, string | number][]>([]);
  const [nodeColumns, setNodeColumns] = useState<TableColumnType<any>[]>([]);
  const [nodeDataSources, setNodeDataSources] = useState<Array<Record<string, any>>>([]);
  const [edgeColumns, setEdgeColumns] = useState<TableColumnType<any>[]>([]);
  const [edgeDataSources, setEdgeDataSources] = useState<Array<Record<string, any>>>([]);

  const [currentNode, setCurrentNode] = useState<string>("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string>>([]);
  const [advancedSearchPanelActive, setAdvancedSearchPanelActive] = useState<boolean>(false);
  const [searchObject, setSearchObject] = useState<SearchObject>({
    node_type: "",
    node_id: "",
    nsteps: 1,
    merge_mode: "replace",
    enable_prediction: false,
    limit: 100,
  });

  // You must have a oldLayout to make the layout work before user select a layout from the menu
  const [layout, setLayout] = React.useState<any>(defaultLayout);
  const [config, setConfig] = React.useState<Config & { layout?: any } | undefined>({
    layout: 'graphin-force',
    miniMapEnabled: true,
    snapLineEnabled: true,
    nodeLabelEnabled: true,
    edgeLabelEnabled: true,
    nodeTooltipEnabled: true,
    edgeTooltipEnabled: false,
    infoPanelEnabled: true,
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

    setStatistics([
      [<span>Entities <Tag color="#2db7f5">canvas</Tag></span>, data.nodes.length],
      [<span>Relationships <Tag color="#2db7f5">canvas</Tag></span>, data.edges.length],
      [<span>Entities <Tag color="#108ee9">graph</Tag></span>, "14,543,042"],
      [<span>Relationships <Tag color="#108ee9">graph</Tag></span>, "188,266,233"],
    ])
  }, [data])

  useEffect(() => {
    if (searchObject.node_id && searchObject.node_type && advancedSearchPanelActive === false) {
      message.info("Loading data, please wait...")
      makeGraphQueryStrWithSearchObject(searchObject)
        .then(response => {
          if (searchObject.merge_mode == "replace") {
            setData(response)
          } else if (searchObject.merge_mode == "append") {
            setData({
              nodes: uniqBy([...data.nodes, ...response.nodes], "id"),
              edges: uniqBy([...data.edges, ...response.edges], "relid")
            })
          } else if (searchObject.merge_mode == "subtract") {
            const { nodes, edges } = response;
            let nodesToRemove: string[] = nodes.map(node => node.id);

            nodesToRemove = nodesToRemove.filter(node => {
              // Remove nodes that have only one relationship and is in the nodesToRemove list
              const prediction = (rel: GraphEdge, node: string, reltypes: string[]) => {
                return (rel.target == node || rel.source == node) && reltypes.indexOf(rel.reltype) > -1
              }

              // Get all relationships that meet the criteria, maybe it comes from user's input or query result
              const relation_types = searchObject.relation_types || edges.map(edge => edge.reltype)
              const found = data.edges.filter(rel => prediction(rel, node, relation_types))

              console.log("Found: ", found, node, relation_types)
              return found.length < 2
            })

            // Remove nodes and relationships that meet the removal criteria
            const newNodes = data.nodes.filter(node => !nodesToRemove.includes(node.id));
            const newRelationships = data.edges.filter(rel => !nodesToRemove.includes(rel.source) && !nodesToRemove.includes(rel.target));

            const newData = {
              nodes: newNodes,
              edges: newRelationships
            }

            console.log("New Data: ", newData, data, response, nodesToRemove)
            setData(newData)
          } else {
            message.warn("Unknown merge mode, please retry later.")
          }
          message.success(`Find ${response.nodes.length} entities and ${response.edges.length} relationships.`)
        }).catch(error => {
          message.warn("Unknown error, please retry later.")
          console.log("getNodes Error: ", error)
          message.warn("Cannot find any entities or relationships.")
        })
    }
  }, [searchObject])

  const onChangeConfig = (config: Config, layout: any) => {
    console.log("Config: ", config, layout);
    setLayout(layout)
    setConfig(config)
  }

  const enableAdvancedSearch = () => {
    setAdvancedSearchPanelActive(true)
  }

  const disableAdvancedSearch = () => {
    setAdvancedSearchPanelActive(false)
  }

  const updateSearchObject = (searchObject: SearchObject) => {
    console.log("Search Object: ", searchObject);
    disableAdvancedSearch();
    setSearchObject(searchObject);
  }

  const searchLabel = (label: string, value: string | undefined) => {
    setSearchObject({
      node_type: label,
      node_id: value,
      merge_mode: "replace",
      nsteps: 1,
      limit: 100,
      enable_prediction: false
    })
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
      enableAdvancedSearch();
      setSearchObject({
        node_type: menuData.nlabel,
        node_id: menuData.data.id,
        merge_mode: "append"
      })
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

  const DataArea: React.FC<{ data: [ReactNode, string | number][], style?: any }> = ({ data, style }) => {
    const items = data.map((item, index) => {
      return (
        <Descriptions.Item key={index} label={item[0]}>
          {item[1]}
        </Descriptions.Item>
      )
    })
    return (
      items.length > 0 ?
        (<Descriptions size={"small"} column={1} title={null}
          labelStyle={{ backgroundColor: 'transparent' }}
          bordered style={{ ...style }}>
          {items}
        </Descriptions>)
        : (<span style={style}>No Properties</span>)
    )
  }

  return (
    <Row className='knowledge-graph-container'>
      {
        config?.infoPanelEnabled ?
          <DataArea data={statistics}
            style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 1 }}></DataArea>
          : null
      }
      <MenuButton config={config} onChangeConfig={onChangeConfig}
        style={{ zIndex: 10, position: 'relative', maxWidth: 'unset', maxHeight: 'unset' }}>
      </MenuButton>
      <QueryBuilder onChange={searchLabel} onAdvancedSearch={enableAdvancedSearch}></QueryBuilder>
      <AdvancedSearch onOk={updateSearchObject} visible={advancedSearchPanelActive}
        onCancel={disableAdvancedSearch} searchObject={searchObject} key={searchObject.node_id}>
      </AdvancedSearch>
      <Col className='graphin' style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Toolbar position='right' width={'60%'} title="Charts" closable={true}>
          <ComplexChart data={data}></ComplexChart>
        </Toolbar>
        <Toolbar position='bottom' width='300px' height='300px'>
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
          config={config} data={data} layout={layout} style={style}>
        </GraphinWrapper>
      </Col>
    </Row >
  );

};

export default KnowledgeGraph;
