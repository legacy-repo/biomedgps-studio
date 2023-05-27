/* eslint-disable no-undef */
import React, { ReactNode, useEffect, useState } from 'react';
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { Row, Col, Tag, Tabs, Table, message, Button, Spin, Empty, Tooltip, Modal } from 'antd';
import type { TableColumnType } from 'antd';
import {
  CloudDownloadOutlined, FullscreenExitOutlined, FullscreenOutlined,
  SettingOutlined, CloudUploadOutlined, SettingFilled, ExclamationCircleOutlined
} from '@ant-design/icons';
// import { Utils } from '@antv/graphin';
import Toolbar from './Toolbar';
import { uniqBy, uniq } from 'lodash';
import GraphinWrapper from './GraphinWrapper';
import QueryBuilder from './QueryBuilder';
import AdvancedSearch from './AdvancedSearch';
import ComplexChart from './Chart/ComplexChart';
import StatisticsChart from './Chart/StatisticsChart';
// import ReactResizeDetector from 'react-resize-detector';
import {
  makeColumns, makeDataSources, autoConnectNodes,
  makeGraphQueryStrWithSearchObject, defaultLayout, predictRelationships,
  isValidSearchObject, isUUID, getDimensions, getNodes, getSelectedNodes
} from './utils';
import NodeInfoPanel from './NodeInfoPanel';
import EdgeInfoPanel from './EdgeInfoPanel';
import GraphTable from './GraphStore/GraphTable';
import GraphForm from './GraphStore/GraphForm';
import type { Graph } from '@antv/graphin';
import type { Graph as GraphItem } from './GraphStore/typings';
import { getStatistics, getGraphs, postGraphs, deleteGraphsId } from '@/services/swagger/Graph';
import {
  SearchObject, GraphData, GraphEdge, GraphNode,
  NodeStat, EdgeStat, EdgeInfo, DimensionArray
} from './typings';

import './index.less';
import SimilarityChart from './Chart/SimilarityChart';
import Movable from './Components/Movable';

const style = {
  backgroundImage: `url(${window.publicPath + "graph-background.png"})`
}

type KnowledgeGraphProps = {
  postMessage?: (message: any) => void
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = (props) => {
  const [modal, contextHolder] = Modal.useModal();
  // const [data, setData] = useState(Utils.mock(8).circle().graphin())
  const [data, setData] = useState<GraphData>({
    nodes: [],
    edges: []
  });

  const [statistics, setStatistics] = useState<[ReactNode, string | number | ReactNode][]>([]);
  const [nodeColumns, setNodeColumns] = useState<TableColumnType<any>[]>([]);
  const [nodeDataSources, setNodeDataSources] = useState<Array<Record<string, any>>>([]);
  const [edgeColumns, setEdgeColumns] = useState<TableColumnType<any>[]>([]);
  const [edgeDataSources, setEdgeDataSources] = useState<Array<Record<string, any>>>([]);
  const [toolbarVisible, setToolbarVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [nodeStat, setNodeStat] = useState<NodeStat[]>([]);
  const [edgeStat, setEdgeStat] = useState<EdgeStat[]>([]);

  const [nodeInfoPanelVisible, setNodeInfoPanelVisible] = useState<boolean>(false);
  const [clickedNode, setClickedNode] = useState<GraphNode | undefined>(undefined);
  const [edgeInfoPanelVisible, setEdgeInfoPanelVisible] = useState<boolean>(false);
  const [clickedEdge, setClickedEdge] = useState<EdgeInfo | undefined>(undefined);

  const [similarityChartVisible, setSimilarityChartVisible] = useState<boolean>(false);
  const [similarityArray, setSimilarityArray] = useState<GraphNode[]>([]);
  const [hightlightMode, setHightlightMode] = useState<'activate' | 'focus'>('activate');

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

  // Graph store
  // Why we need a parentGraphUUID and a currentGraphUUID? Because the platform don't support multiple branches for each history chain. So we always use the latest graph as the parent graph, and the current graph is the graph that user is editing.
  const [parentGraphUUID, setParentGraphUUID] = useState<string>("New Graph");
  const [currentGraphUUID, setCurrentGraphUUID] = useState<string>("New Graph");
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const [graphs, setGraphs] = useState<GraphItem[]>([]);
  const [graphTableVisible, setGraphTableVisible] = useState<boolean>(false);
  const [graphFormVisible, setGraphFormVisible] = useState<boolean>(false);
  const [graphFormPayload, setGraphFormPayload] = useState<Record<string, any>>({});

  const checkAndSetData = (data: GraphData) => {
    const nodeIds = new Set(data.nodes.map(node => node.id));
    const nonexistentEdges = data.edges.filter(edge => !nodeIds.has(edge.source) || !nodeIds.has(edge.target));
    const edges = data.edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target));

    // TODO: Why does this happen? The backend have some bugs, so that it will return some edges that connect to nonexistent nodes.
    // if (nonexistentEdges.length > 0) {
    //   message.warn(`There are ${nonexistentEdges.length} edges that connect to nonexistent nodes, they will be added soon.`);
    //   console.log(`There are ${nonexistentEdges.length} edges that connect to nonexistent nodes, they will be added soon.`)
    //   const ids = nonexistentEdges.map(edge => parseInt(edge.source)).concat(nonexistentEdges.map(edge => parseInt(edge.target)));
    //   makeGraphQueryStrWithIds(uniq(ids))
    //     .then(response => {
    //       const nodes = response.nodes as GraphNode[];
    //       const edges = response.edges as GraphEdge[];
    //       checkAndSetData({
    //         nodes: data.nodes.concat(nodes),
    //         edges: data.edges.concat(edges)
    //       })
    //     })
    //     .catch(error => {
    //       message.error("Failed to fetch data from server.");
    //       console.error(error);
    //     })
    // }

    setIsDirty(true);
    setData({
      nodes: data.nodes,
      edges: edges
    })
  }

  const onClearGraph = () => {
    setData({
      nodes: [],
      edges: []
    })
    setParentGraphUUID("");
    setCurrentGraphUUID("");
  }

  const DirtyStatus = (status: boolean) => {
    return status ? <Tag color="#f50">dirty</Tag> : <Tag color="#87d068">cleaned</Tag>
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
      [<span>Nodes <Tag color="#2db7f5">Canvas</Tag></span>, data.nodes.length],
      [<span>Edges <Tag color="#2db7f5">Canvas</Tag></span>, data.edges.length],
      [<span>Nodes <Tag color="#108ee9">KGraph</Tag></span>, nodeStat.reduce((acc, cur) => acc + cur.node_count, 0).toLocaleString()],
      [<span>Edges <Tag color="#108ee9">KGraph</Tag></span>, edgeStat.reduce((acc, cur) => acc + cur.relation_count, 0).toLocaleString()],
      [<span>Status <Tag color="#2db7f5">Canvas</Tag></span>, DirtyStatus(isDirty)],
    ])
  }, [data, edgeStat, nodeStat, currentGraphUUID])

  const loadGraphs = () => {
    getGraphs({ page: 1, page_size: 100 }).then(response => {
      setGraphs(response.data)
    }).catch(error => {
      console.log(error)
      message.error("Failed to get graphs, please check the network connection.")
    })
  }

  const loadGraph = (graph: GraphItem, latestChild: GraphItem) => {
    const payload = graph.payload;
    if (payload) {
      setIsDirty(false);
      // Only support one level of graph hierarchy, so the parent graph is always the latest child graph.
      setParentGraphUUID(latestChild.id);
      setCurrentGraphUUID(graph.id);
      checkAndSetData(payload.data);
      setLayout(payload.layout);
      setToolbarVisible(payload.toolbarVisible);
      setGraphTableVisible(false);
    }
  }

  const onLoadGraph = (graph: GraphItem, latestChild: GraphItem) => {
    console.log("Load graph: ", graph, latestChild);
    if (isDirty) {
      modal.confirm({
        title: "You have unsaved changes",
        icon: <ExclamationCircleOutlined />,
        content: "Are you sure to load another graph?",
        okText: "Load",
        cancelText: "Cancel",
        onOk() {
          setIsDirty(false);
          loadGraph(graph, latestChild)
        },
        onCancel() {
          // TODO: anything else?
        }
      })
    } else {
      loadGraph(graph, latestChild)
    }
  }

  const onDeleteGraph = (graph: GraphItem) => {
    // TODO: add confirm dialog, it will delete the graph cascade.
    deleteGraphsId({ id: graph.id }).then(response => {
      message.success("Graph deleted successfully.")
      loadGraphs()
      setGraphTableVisible(false)
    }).catch(error => {
      console.log(error)
      setGraphTableVisible(false)
      message.error("Failed to delete graph, please check the network connection.")
    })
  }

  useEffect(() => {
    getStatistics()
      .then(response => {
        setNodeStat(response.node_stat as NodeStat[])
        setEdgeStat(response.relationship_stat as EdgeStat[])
      })
      .catch(error => {
        console.log(error)
        message.error("Failed to get statistics, please check the network connection.")
      })

    loadGraphs()
  }, [])

  useEffect(() => {
    // You need to check if the data is empty, otherwise it will update on an unmounted component. 
    if (advancedSearchPanelActive === false && isValidSearchObject(searchObject)) {
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
    } else {
      console.log("Advanced Search Panel is active or search object is invalid: ", advancedSearchPanelActive, searchObject);
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
      mode: 'node',
      node_type: label,
      node_id: value,
      merge_mode: "replace",
      nsteps: 1,
      limit: 50,
      enable_prediction: false
    })
  }

  const onCanvasMenuClick = (
    menuItem: { key: string, name: string },
    graph: any, apis: any
  ) => {
    if (menuItem.key == 'auto-connect') {
      message.info("Auto connecting nodes, please wait...")
      setLoading(true)
      const nodes = graph.getNodes().map((node: any) => node.getModel() as GraphNode);
      autoConnectNodes(nodes).then((response: GraphData) => {
        console.log("Auto Connect Response: ", response)
        checkAndSetData({
          nodes: uniqBy([...data.nodes, ...response.nodes], "id"),
          edges: uniqBy([...data.edges, ...response.edges], "relid")
        })

        if (response.nodes.length == 0 && response.edges.length == 0) {
          message.warn("No more relationships can be found.")
        } else {
          message.success(`Find ${response.nodes.length} entities and ${response.edges.length} relationships.`)
        }
      }).catch((error: any) => {
        console.log("Auto Connect Error: ", error)
        message.warn("Something went wrong, please try again later.")
      }).finally(() => {
        setLoading(false)
      })
    }
  }

  const onEdgeMenuClick = (
    menuItem: { key: string, name: string },
    source: GraphNode, target: GraphNode,
    edge: GraphEdge, graph: Graph, graphin: any
  ) => {
    if (menuItem.key == 'what-is-the-relationship') {
      if (props.postMessage) {
        props.postMessage(`what is the relationship between ${source.data.name} and ${target.data.name}?`)
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

  const onNodeMenuClick = (menuItem: any, node: GraphNode, graph: Graph, graphin: any) => {
    console.log(`onNodeMenuClick [${menuItem.key}]: `, menuItem, node);
    if (menuItem.key == 'delete-nodes') {
      const nodes = getSelectedNodes(graph);
      const ids = [...nodes.map(node => node.id)]
      if (nodes.length == 0) {
        message.info("Please select one or more nodes to delete.")
        return
      } else {
        message.info(`Deleting ${nodes.length} nodes, please wait...`)
        nodes.forEach(node => {
          graph.removeItem(node.id)
        })
        checkAndSetData({
          nodes: data.nodes.filter(node => !ids.includes(node.id)),
          edges: data.edges.filter(edge => !ids.includes(edge.source) && !ids.includes(edge.target))
        });
      }
    } else if (menuItem.key == 'expand-one-level') {
      enableAdvancedSearch();
      setSearchObject({
        node_type: node.nlabel,
        node_id: node.data.id,
        merge_mode: "append"
      })
    } else if (['expand-all-paths-1', 'expand-all-paths-2', 'expand-all-paths-3'].includes(menuItem.key)) {
      console.log("Expand All Paths: ", menuItem.key);
      const selectedNodes = getSelectedNodes(graph);
      if (selectedNodes.length == 0) {
        message.info("Please select one or more nodes to expand.")
        return
      } else {
        setSearchObject({
          nodes: selectedNodes,
          merge_mode: "append",
          mode: "path",
          nsteps: parseInt(menuItem.key.split('-').pop() || '1'),
          limit: 50,
        })
      }
    } else if (menuItem.key == 'expand-selected-nodes') {
      const nodes = getSelectedNodes(graph);

      // If no nodes are selected, use the right clicked node
      if (nodes.length == 0 && node) {
        nodes.push(node)
      }

      enableAdvancedSearch();
      setSearchObject({
        nodes: nodes,
        merge_mode: "append",
        mode: "batchNodes",
        node_id: "",
        node_type: "",
      })
    } else if (menuItem.key == 'what-is-the-node') {
      if (props.postMessage) {
        props.postMessage(`what is the ${node.data.name}?`)
      }
    } else if (menuItem.key == 'predict-relationships') {
      const sourceId = `${node.nlabel}::${node.data.id}`;
      const selectedNodes = getSelectedNodes(graph);
      let targetIds = selectedNodes.map(node => `${node.nlabel}::${node.data.id}`);
      targetIds = targetIds.filter(id => id != sourceId);
      console.log("Predict Relationships: ", menuItem, sourceId, targetIds, selectedNodes);
      predictRelationships(sourceId, targetIds).then((response: GraphData) => {
        console.log("Predict Relationships Response: ", response)
        if (response.nodes.length == 0 && response.edges.length == 0) {
          message.warn("No more relationships can be found.")
        } else {
          checkAndSetData({
            nodes: uniqBy([...data.nodes, ...response.nodes], "id"),
            edges: uniqBy([...data.edges, ...response.edges], "relid")
          })
        }
      }).catch((error: any) => {
        console.log("Predict Relationships Error: ", error)
        message.warn("Something went wrong, please try again later.")
      })
    } else if (menuItem.key == 'visulize-similarities') {
      const nodes = getNodes(graph);
      const sourceType = node.nlabel;
      const sourceId = node.data.id;
      const filteredNodes = nodes.filter(node => node.data.id != sourceId);
      const targetTypes = filteredNodes.map(node => node.nlabel);
      const targetIds = filteredNodes.map(node => node.data.id);
      setLoading(true);
      getDimensions(sourceId, sourceType, targetIds, targetTypes).then((response: DimensionArray) => {
        console.log("Get Dimensions Response: ", response, targetIds, targetTypes, sourceId, sourceType);
        const graphData = response.map(item => {
          const filteredNodes = nodes.filter(node => node.data.id == item.node_id && node.nlabel == item.node_type)
          if (filteredNodes.length > 0) {
            return {
              ...filteredNodes[0],
              x: item.x,
              y: item.y,
            }
          } else {
            return {}
          }
        }).filter(item => Object.keys(item).length > 0) as GraphNode[];
        setSimilarityArray(graphData);
        setSimilarityChartVisible(true);
        setLoading(false);
      }).catch((error: any) => {
        console.log("Get Dimensions Error: ", error);
        setSimilarityArray([]);
        setSimilarityChartVisible(false);
        message.error("Failed to get similarities, please check the network connection.")
        setLoading(false);
      }).finally(() => {
        setLoading(false);
      })
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
    setGraphFormVisible(true)
    // TODO: Can we save the position of all nodes and edges and more configurations?
    setGraphFormPayload({
      data: data,
      layout: layout,
      toolbarVisible: toolbarVisible
    })
  }

  const onChangeToolbarVisible = () => {
    setToolbarVisible(!toolbarVisible)
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

  // const onWidthChange = (width?: number, height?: number) => {
  //   // message.info(`Graph width changed to ${width}`)
  //   // TODO: Fix this hacky way to refresh graph
  //   if (width) {
  //     setGraphRefreshKey(width)
  //   } else if (height) {
  //     setGraphRefreshKey(height)
  //   }
  // }

  const enterFullScreenHandler = useFullScreenHandle();

  return (
    <FullScreen handle={enterFullScreenHandler}>
      <Row className='knowledge-graph-container' id='knowledge-graph-container'>
        <Spin spinning={loading}>
          <GraphTable visible={graphTableVisible} graphs={graphs}
            onLoad={onLoadGraph} onDelete={onDeleteGraph} treeFormat
            parent={document.getElementById('knowledge-graph-container') as HTMLElement}
            onClose={() => { setGraphTableVisible(false) }}
            selectedGraphId={currentGraphUUID}>
          </GraphTable>
          <GraphForm visible={graphFormVisible}
            payload={graphFormPayload}
            parent={document.getElementById('knowledge-graph-container') as HTMLElement}
            onClose={() => { setGraphFormVisible(false) }}
            onSubmit={(data) => {
              setGraphFormVisible(false)
              if (parentGraphUUID && isUUID(parentGraphUUID)) {
                data = { ...data, parent: parentGraphUUID }
              }

              postGraphs(data).then(response => {
                message.success("Graph data saved.")
                loadGraphs()
              }).catch(error => {
                console.log("Post Graphs Error: ", error)
                message.error("Graph save failed.")
              })
            }}></GraphForm>
          <Row className='left-toolbar'>
            <Tooltip title={enterFullScreenHandler.active ? 'Exit Full Screen' : 'Enter Full Screen'}
              placement='right'>
              <Button className='full-screen-button'
                onClick={enterFullScreenHandler.active ? enterFullScreenHandler.exit : enterFullScreenHandler.enter} shape="circle"
                icon={enterFullScreenHandler.active ? <FullscreenExitOutlined /> : <FullscreenOutlined />} />
            </Tooltip>
            <Tooltip title={toolbarVisible ? 'Hide Toolbar' : 'Show Toolbar'} placement='right'>
              <Button className='toolbar-button' onClick={onChangeToolbarVisible} shape="circle"
                icon={toolbarVisible ? <SettingOutlined /> : <SettingFilled />} />
            </Tooltip>
            <Tooltip title='Save Graph Data' placement='right'>
              <Button className='save-button' onClick={saveGraphData} shape="circle"
                icon={<CloudUploadOutlined />} />
            </Tooltip>
            <Tooltip title='Load Graph Data' placement='right'>
              <Button className='clear-button' onClick={() => { setGraphTableVisible(true) }}
                shape="circle" icon={<CloudDownloadOutlined />} />
            </Tooltip>
          </Row>
          <Row className='top-toolbar'>
            <QueryBuilder onChange={searchLabel} onAdvancedSearch={enableAdvancedSearch}></QueryBuilder>
            <AdvancedSearch onOk={updateSearchObject} visible={advancedSearchPanelActive}
              onCancel={disableAdvancedSearch} searchObject={searchObject} edgeStat={edgeStat}
              parent={document.getElementById('knowledge-graph-container') as HTMLElement}
              key={searchObject.node_id}>
            </AdvancedSearch>
          </Row>
          <Col className='graphin' style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Toolbar position='top' width='300px' height='100%' closable={true} title="Statistics">
              <StatisticsChart nodeStat={nodeStat} edgeStat={edgeStat}></StatisticsChart>
            </Toolbar>
            <Toolbar position='left' width={'60%'} title="Charts" closable={true}>
              <ComplexChart data={data}></ComplexChart>
            </Toolbar>
            <Toolbar position='right' width={'80%'} closable={false}
              maskVisible visible={nodeInfoPanelVisible} onClose={onCloseInfoPanel}>
              {
                clickedNode ?
                  <NodeInfoPanel node={clickedNode}></NodeInfoPanel> :
                  <Empty description="No node selected" />
              }
            </Toolbar>
            <Toolbar position='right' width={'80%'} closable={false}
              maskVisible visible={edgeInfoPanelVisible} onClose={onCloseInfoPanel}>
              {
                clickedEdge ?
                  <EdgeInfoPanel edgeInfo={clickedEdge}></EdgeInfoPanel> :
                  <Empty description="No edge selected" />
              }
            </Toolbar>
            <Toolbar position='bottom' width='300px' height='300px'
              onClick={() => { setCurrentNode("") }}>
              <TableTabs>
                {
                  nodeColumns.length > 0 ?
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
                    : null
                }
                {
                  nodeColumns.length > 0 ?
                    <Table size={"small"} scroll={{ y: 200 }} rowKey={"id"}
                      dataSource={edgeDataSources} columns={edgeColumns} pagination={false} />
                    : null
                }
              </TableTabs>
            </Toolbar>
            <GraphinWrapper selectedNode={currentNode} highlightMode={hightlightMode}
              data={data} layout={layout} style={style} queriedId={searchObject.node_id}
              statistics={statistics} toolbarVisible={toolbarVisible} onClearGraph={onClearGraph}
              onEdgeMenuClick={onEdgeMenuClick} chatbotVisible={props.postMessage ? true : false}
              onClickNode={onClickNode} onClickEdge={onClickEdge} onCanvasMenuClick={onCanvasMenuClick}
              changeLayout={(layout) => { setLayout(layout) }} onNodeMenuClick={onNodeMenuClick}>
              {
                similarityChartVisible ?
                  <Movable onClose={() => {
                    setSimilarityChartVisible(false)
                    setHightlightMode('activate')
                  }} width='600px'
                    title='Node Similarity [t-SNE]'>
                    <SimilarityChart data={similarityArray}
                      description='If you expect to highlight nodes on the chart, you need to enable the "Focus" and "Select" mode.'
                      onClick={(node: GraphNode) => {
                        setCurrentNode(node.id)
                        setHightlightMode('focus')
                      }}>
                    </SimilarityChart>
                  </Movable> : null
              }
            </GraphinWrapper>
            {contextHolder}
          </Col>
        </Spin>
      </Row >
    </FullScreen>
  );

};

export default KnowledgeGraph;
