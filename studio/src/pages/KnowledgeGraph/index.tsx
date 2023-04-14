/* eslint-disable no-undef */
import React, { ReactNode, useEffect, useState } from 'react';
import { Row, Col, Tag, Tabs, Table, message, Button, Spin } from 'antd';
import type { TableColumnType } from 'antd';
import { DeleteFilled, DownloadOutlined, SettingOutlined } from '@ant-design/icons';
// import { Utils } from '@antv/graphin';
import Toolbar from './Toolbar';
import { uniqBy, uniq } from 'lodash';
import GraphinWrapper from './GraphinWrapper';
import QueryBuilder from './QueryBuilder';
import AdvancedSearch from './AdvancedSearch';
import ComplexChart from './Chart/ComplexChart';
import StatisticsChart from './Chart/StatisticsChart';
import ReactResizeDetector from 'react-resize-detector';
import {
  makeColumns, makeDataSources,
  makeGraphQueryStrWithSearchObject, defaultLayout, makeGraphQueryStrWithIds
} from './utils';
import NodeInfoPanel from './NodeInfoPanel';
import EdgeInfoPanel from './EdgeInfoPanel';
import { getStatistics } from '@/services/swagger/Graph';
import {
  SearchObject, GraphData, GraphEdge, GraphNode,
  NodeStat, EdgeStat, EdgeInfo, OnClickEdgeFn
} from './typings';

import './index.less';

const style = {
  backgroundImage: `url(${window.publicPath + "graph-background.png"})`
}

type KnowledgeGraphProps = {
  storeId?: string
  postMessage?: (message: any) => void
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = (props) => {
  // const [data, setData] = useState(Utils.mock(8).circle().graphin())
  const [data, setData] = useState<GraphData>({
    nodes: [],
    edges: []
  });

  const [internalStoreId, setInternalStoreId] = useState<string>(props.storeId || "graphData")
  const [statistics, setStatistics] = useState<[ReactNode, string | number][]>([]);
  const [nodeColumns, setNodeColumns] = useState<TableColumnType<any>[]>([]);
  const [nodeDataSources, setNodeDataSources] = useState<Array<Record<string, any>>>([]);
  const [edgeColumns, setEdgeColumns] = useState<TableColumnType<any>[]>([]);
  const [edgeDataSources, setEdgeDataSources] = useState<Array<Record<string, any>>>([]);
  const [toolbarVisible, setToolbarVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [graphRefreshKey, setGraphRefreshKey] = useState<number>(0);

  const [nodeStat, setNodeStat] = useState<NodeStat[]>([]);
  const [edgeStat, setEdgeStat] = useState<EdgeStat[]>([]);

  const [nodeInfoPanelVisible, setNodeInfoPanelVisible] = useState<boolean>(false);
  const [clickedNode, setClickedNode] = useState<GraphNode | undefined>(undefined);
  const [edgeInfoPanelVisible, setEdgeInfoPanelVisible] = useState<boolean>(false);
  const [clickedEdge, setClickedEdge] = useState<EdgeInfo | undefined>(undefined);

  const [currentNode, setCurrentNode] = useState<string>("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string>>([]);
  const [advancedSearchPanelActive, setAdvancedSearchPanelActive] = useState<boolean>(false);
  const [searchObject, setSearchObject] = useState<SearchObject>({
    node_type: "",
    node_id: "",
    nsteps: 1,
    merge_mode: "replace",
    enable_prediction: false,
    limit: 50,
  });

  // You must have a oldLayout to make the layout work before user select a layout from the menu
  const [layout, setLayout] = React.useState<any>(defaultLayout);

  const checkAndSetData = (data: GraphData) => {
    const nodeIds = new Set(data.nodes.map(node => node.id));
    const nonexistentEdges = data.edges.filter(edge => !nodeIds.has(edge.source) || !nodeIds.has(edge.target));
    const edges = data.edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target));

    if (nonexistentEdges.length > 0) {
      message.warn(`There are ${nonexistentEdges.length} edges that connect to nonexistent nodes, they will be added soon.`);
      const ids = nonexistentEdges.map(edge => parseInt(edge.source)).concat(nonexistentEdges.map(edge => parseInt(edge.target)));
      makeGraphQueryStrWithIds(uniq(ids))
        .then(response => {
          const nodes = response.nodes as GraphNode[];
          const edges = response.edges as GraphEdge[];
          checkAndSetData({
            nodes: data.nodes.concat(nodes),
            edges: data.edges.concat(edges)
          })
        })
        .catch(error => {
          message.error("Failed to fetch data from server.");
          console.error(error);
        })
    }

    setData({
      nodes: data.nodes,
      edges: edges
    })
  }

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
      [<span>Entities <Tag color="#108ee9">graph</Tag></span>, nodeStat.reduce((acc, cur) => acc + cur.node_count, 0).toLocaleString()],
      [<span>Relationships <Tag color="#108ee9">graph</Tag></span>, edgeStat.reduce((acc, cur) => acc + cur.relation_count, 0).toLocaleString()],
    ])
  }, [data, edgeStat, nodeStat])

  useEffect(() => {
    let graphData = localStorage.getItem(internalStoreId)
    graphData = graphData ? JSON.parse(graphData) : null
    if (graphData) {
      // Don't worry about it
      checkAndSetData(graphData.data)
      setLayout(graphData.layout)
      setToolbarVisible(graphData.toolbarVisible)
    }

    getStatistics()
      .then(response => {
        setNodeStat(response.node_stat as NodeStat[])
        setEdgeStat(response.relationship_stat as EdgeStat[])
      })
      .catch(error => {
        console.log(error)
        message.error("Failed to get statistics, please check the network connection.")
      })
  }, [])

  useEffect(() => {
    if (searchObject.node_id && searchObject.node_type && advancedSearchPanelActive === false) {
      setLoading(true)
      message.info("Loading data, please wait...")
      makeGraphQueryStrWithSearchObject(searchObject)
        .then(response => {
          console.log("Query Graph Response: ", response)
          if (searchObject.merge_mode == "replace") {
            checkAndSetData(response)
          } else if (searchObject.merge_mode == "append") {
            checkAndSetData({
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
            checkAndSetData(newData)
          } else {
            message.warn("Unknown merge mode, please retry later.")
          }
          message.success(`Find ${response.nodes.length} entities and ${response.edges.length} relationships.`)
          setLoading(false)
        }).catch(error => {
          console.log("getNodes Error: ", error)
          message.warn("Unknown errors or Cannot find any entities & relationships.")
          setLoading(false)
        })
    }
  }, [searchObject])

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
      limit: 50,
      enable_prediction: false
    })
  }

  const onEdgeMenuClick = (
    menuItem: { key: string, name: string },
    source: GraphNode, target: GraphNode,
    edge: GraphEdge, graph: any, graphin: any
  ) => {
    if (menuItem.key == 'what-is-the-relationship') {
      if (props.postMessage) {
        props.postMessage(`what is the relationship between ${source.data.name} and ${target.data.name}`)
      }
    } else if (menuItem.key == 'show-edge-details') {
      setEdgeInfoPanelVisible(true)
      setClickedEdge({
        startNode: source,
        endNode: target,
        edge: edge,
      })
      // TODO: Get edge details and show in the info panel
    }
  }

  const onNodeMenuClick = (menuItem: any, node: GraphNode, graph: any, graphin: any) => {
    console.log(`onNodeMenuClick [${menuItem.key}]: `, menuItem, node);
    if (menuItem.key == 'delete-node') {
      const id = node.id;
      const item = graph.findById(id);

      if (item) {
        graph.removeItem(item);
        checkAndSetData({
          nodes: data.nodes.filter(node => node.id != id),
          edges: data.edges.filter(edge => edge.source != id && edge.target != id)
        });
      }
    } else if (menuItem.key == 'expand-one-level') {
      enableAdvancedSearch();
      setSearchObject({
        node_type: node.nlabel,
        node_id: node.data.id,
        merge_mode: "append"
      })
    } else if (menuItem.key == 'what-is-the-node') {
      if (props.postMessage) {
        props.postMessage(`what is ${node.data.name}`)
      }
    } else if (menuItem.key == 'show-node-details') {
      setNodeInfoPanelVisible(true)
      setClickedNode(node)
      // TODO: Get node details and show in the info panel
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
      <Tabs className="tabs-nav-center">
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

  const saveGraphData = () => {
    localStorage.setItem(internalStoreId, JSON.stringify({
      data: data,
      layout: layout,
      toolbarVisible: toolbarVisible
    }))
    message.success("Graph data saved.")
  }

  const onChangeToolbarVisible = () => {
    setToolbarVisible(!toolbarVisible)
  }

  const clearGraphData = () => {
    localStorage.removeItem(internalStoreId)
    message.success("Graph data cleared.")
    checkAndSetData({ nodes: [], edges: [] })
  }

  const onWidthChange = (width?: number, height?: number) => {
    // message.info(`Graph width changed to ${width}`)
    // TODO: Fix this hacky way to refresh graph
    if (width) {
      setGraphRefreshKey(width)
    } else if (height) {
      setGraphRefreshKey(height)
    }
  }

  const onClickNode = (nodeId: string, node: GraphNode): void => {
    // TODO: Get node details and pass to InfoPanel
    console.log("Node Clicked: ", nodeId, data, node)
    if (node) {
      setNodeInfoPanelVisible(true)
      setClickedNode(node)
    }
  }


  const onClickEdge = (
    edgeId: string, startNode: GraphNode,
    endNode: GraphNode, edge: GraphEdge
  ): void => {
    console.log("Edge Clicked: ", edgeId)
    if (edgeId) {
      setEdgeInfoPanelVisible(true)
      setClickedEdge({
        edge: edge,
        startNode: startNode,
        endNode: endNode
      })
    }
  }

  const onCloseInfoPanel = () => {
    setEdgeInfoPanelVisible(false);
    setNodeInfoPanelVisible(false);
  }

  return (
    <ReactResizeDetector onResize={onWidthChange}>
      <Row className='knowledge-graph-container'>
        <Spin spinning={loading}>
          <Button className='toolbar-button' onClick={onChangeToolbarVisible} shape="circle" icon={<SettingOutlined />} />
          <Button className='save-button' onClick={saveGraphData}
            shape="circle" icon={<DownloadOutlined />} />
          <Button className='clear-button' onClick={clearGraphData}
            shape="circle" icon={<DeleteFilled />} />
          <QueryBuilder onChange={searchLabel} onAdvancedSearch={enableAdvancedSearch}></QueryBuilder>
          <AdvancedSearch onOk={updateSearchObject} visible={advancedSearchPanelActive}
            onCancel={disableAdvancedSearch} searchObject={searchObject} key={searchObject.node_id}>
          </AdvancedSearch>
          <Col className='graphin' style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Toolbar position='top' width='300px' height='100%' closable={true} title="Statistics">
              <StatisticsChart nodeStat={nodeStat} edgeStat={edgeStat}></StatisticsChart>
            </Toolbar>
            <Toolbar position='left' width={'60%'} title="Charts" closable={true}>
              <ComplexChart data={data}></ComplexChart>
            </Toolbar>
            <Toolbar position='right' width={'80%'} closable={false}
              maskVisible visible={nodeInfoPanelVisible} onClose={onCloseInfoPanel}>
              {clickedNode ? <NodeInfoPanel node={clickedNode}></NodeInfoPanel> : null}
            </Toolbar>
            <Toolbar position='right' width={'80%'} closable={false}
              maskVisible visible={edgeInfoPanelVisible} onClose={onCloseInfoPanel}>
              {clickedEdge ? <EdgeInfoPanel edgeInfo={clickedEdge}></EdgeInfoPanel> : null}
            </Toolbar>
            <Toolbar position='bottom' width='300px' height='300px' onClick={() => {
              setCurrentNode("") // Clear the selected node
            }}>
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
            <GraphinWrapper selectedNode={currentNode} onNodeMenuClick={onNodeMenuClick}
              data={data} layout={layout} style={style} queriedId={searchObject.node_id}
              statistics={statistics} toolbarVisible={toolbarVisible} key={graphRefreshKey}
              onEdgeMenuClick={onEdgeMenuClick} chatbotVisible={props.postMessage ? true : false}
              onClickNode={onClickNode} onClickEdge={onClickEdge}>
            </GraphinWrapper>
          </Col>
        </Spin>
      </Row >
    </ReactResizeDetector>
  );

};

export default KnowledgeGraph;
