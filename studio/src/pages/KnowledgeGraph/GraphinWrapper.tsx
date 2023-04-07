import React, { useEffect, useState, useContext } from "react";
import Graphin, { Components, Behaviors, GraphinContext, IG6GraphEvent } from '@antv/graphin';
import { INode, NodeConfig } from '@antv/g6';
import { ContextMenu, FishEye, Toolbar } from '@antv/graphin-components';
import {
    TagFilled,
    BoxPlotOutlined,
    BarChartOutlined,
    HeatMapOutlined,
    DotChartOutlined,
    DeleteFilled,
    ExpandAltOutlined,
    QuestionCircleOutlined,
    CloudDownloadOutlined,
    EyeOutlined,
    BranchesOutlined,
    AimOutlined
} from '@ant-design/icons';
import type { TooltipValue, LegendChildrenProps, LegendOptionType } from '@antv/graphin';
import DataArea from './DataArea';
import { message, Descriptions, Switch, Button, Select, Empty, Menu as AntdMenu } from 'antd';
import { makeDataSource } from './utils';
import type { NodeOnClickFn, EdgeOnClickFn, GraphNode } from "./typings";
import voca from 'voca';
import './graphin-wrapper.less';

const { MiniMap, SnapLine, Tooltip, Legend } = Components;

const {
    ZoomCanvas, ActivateRelations, ClickSelect, Hoverable,
    FitView, DragNodeWithForce, DragNode
} = Behaviors;
const { Menu } = ContextMenu;

const snapLineOptions = {
    line: {
        stroke: 'lightgreen',
        lineWidth: 1,
    },
};

type EdgeMenuProps = {
    onChange?: EdgeOnClickFn,
    chatbotVisible?: boolean,
    item?: IG6GraphEvent['item'];
}

const EdgeMenu = (props: EdgeMenuProps) => {
    const { graph, apis } = useContext(GraphinContext);
    const { item, chatbotVisible } = props;

    const [visible, setVisible] = useState<boolean>(false);
    const [sourceNode, setSourceNode] = useState<GraphNode | undefined>(undefined);
    const [targetNode, setTargetNode] = useState<GraphNode | undefined>(undefined);

    useEffect(() => {
        if (item && item._cfg) {
            const source = item._cfg.source;
            const target = item._cfg.target;

            // Don't worry about the type of source and target.
            if (source && source._cfg && target && target._cfg) {
                setSourceNode(source._cfg.model)
                setTargetNode(target._cfg.model)
                setVisible(true)
            }
        }
    }, [item])

    const options = [
        {
            key: 'analyze-with-clinical-data',
            icon: <BarChartOutlined />,
            label: 'Analyze with Clinical Data',
            children: [
                {
                    key: 'barchart',
                    icon: <BarChartOutlined />,
                    label: 'Bar Chart',
                },
                {
                    key: 'boxchart',
                    icon: <BoxPlotOutlined />,
                    label: 'Box Plot',
                },
                {
                    key: 'heatmap',
                    icon: <HeatMapOutlined />,
                    label: 'Heatmap',
                },
                {
                    key: 'scatterchart',
                    icon: <DotChartOutlined />,
                    label: 'Scatter Chart',
                },
            ]
        },
        {
            key: 'analyze-with-omics-data',
            icon: <AimOutlined />,
            label: 'Analyze with Omics Data',
            children: [
                {
                    key: 'heatmap-omics',
                    icon: <HeatMapOutlined />,
                    label: 'Heatmap',
                },
                {
                    key: 'scatterchart-omics',
                    icon: <DotChartOutlined />,
                    label: 'Scatter Chart',
                },
            ]
        }
    ];

    if (chatbotVisible) {
        options.push({
            key: 'ask-question',
            icon: <QuestionCircleOutlined />,
            label: 'Ask Chatbot',
            children: [
                {
                    key: 'what-is-the-relationship',
                    icon: <BranchesOutlined />,
                    label: `What is the relationship between the two nodes?`,
                }
            ]
        })
    }

    const onChange = function (item: any) {
        if (props.onChange && graph && apis) {
            props.onChange(item, sourceNode, targetNode, graph, apis)
            setVisible(false);
        } else {
            message.warn("Cannot catch the changes.")
        }
    }

    return visible ? <AntdMenu items={options} onClick={onChange} /> : null;
}

type NodeMenuProps = {
    onChange?: NodeOnClickFn,
    chatbotVisible?: boolean,
    item?: IG6GraphEvent['item'];
}

const NodeMenu = (props: NodeMenuProps) => {
    const { graph, apis } = useContext(GraphinContext);
    const { item, chatbotVisible } = props;

    const [visible, setVisible] = useState<boolean>(false);

    console.log("NodeMenu", props.item)

    const [node, setNode] = useState<GraphNode | undefined>(undefined);

    useEffect(() => {
        if (item && item._cfg) {
            const nodeModel = item._cfg.model;

            // Don't worry about the type of nodeModel.
            setNode(nodeModel)
            setVisible(true)
        }
    }, [item])

    const options: any[] = [
        {
            key: 'expand-one-level',
            icon: <ExpandAltOutlined />,
            label: 'Expand One Level',
        },
        // {
        //     key: 'tag',
        //     icon: <TagFilled />,
        //     name: 'Tag Node',
        // },
        {
            key: 'delete-node',
            icon: <DeleteFilled />,
            label: 'Delete Node',
        },
    ];

    if (chatbotVisible) {
        options.push({
            key: 'ask-question',
            icon: <QuestionCircleOutlined />,
            label: 'Ask Chatbot',
            children: [
                {
                    key: 'what-is-the-node',
                    icon: <EyeOutlined />,
                    label: `What is the node?`,
                }
            ]
        })
    }

    const onChange = function (item: any) {
        if (props.onChange && graph && apis) {
            props.onChange(item, node, graph, apis)
            setVisible(false);
        } else {
            message.warn("Cannot catch the changes.")
        }
    }

    return visible ? <AntdMenu items={options} onClick={onChange} /> : null;
}

const CanvasMenu = (props: any) => {
    const { graph, contextmenu } = useContext(GraphinContext);
    const context = contextmenu.canvas;
    const handleDownload = () => {
        graph.downloadFullImage('canvas-contextmenu');
        context.handleClose();
    };

    // const handleClear = () => {
    //     message.info(`Clear canvas successfully`);
    //     graph.clear();
    //     context.handleClose();
    // };

    // const handleStopLayout = () => {
    //     message.info(`Stop layout successfully`);
    //     graph.stopAnimate();
    //     context.handleClose();
    // };

    const handleOpenFishEye = () => {
        props.handleOpenFishEye();
    };

    return (
        <Menu bindType="canvas">
            <Menu.Item onClick={handleOpenFishEye}>
                <EyeOutlined /> Enable FishEye
            </Menu.Item>
            {/* <Menu.Item onClick={handleClear}>
                <DeleteOutlined /> Clear Canvas
            </Menu.Item>
            <Menu.Item onClick={handleStopLayout}>
                <CloseCircleOutlined /> Stop Layout
            </Menu.Item> */}
            <Menu.Item onClick={handleDownload}>
                <CloudDownloadOutlined /> Download Layout
            </Menu.Item>
        </Menu>
    );
};

const CustomHoverable = (props: {
    bindType?: 'node' | 'edge';
    disabled?: boolean;
}) => {
    const { bindType, disabled } = props;
    const { graph } = useContext(GraphinContext);
    const [enableHoverable, setEnableHoverable] = useState<boolean>(false);

    // TODO: How to disable hoverable when there are multiple nodes selected?
    // useEffect(() => {
    //     const selectedNodes = graph.getNodes().filter(node => {
    //         return node.getStates().includes('selected')
    //     })
    //     setEnableHoverable(selectedNodes.length > 1)
    // }, [])

    return <Hoverable bindType={bindType} disabled={enableHoverable || disabled} />
}

const NodeLabelVisible = (props: {
    visible: boolean
}) => {
    const { visible } = props;

    const graph = useContext(GraphinContext).graph;

    useEffect(() => {
        graph.getNodes().forEach(node => {
            graph.updateItem(node, {
                style: {
                    // @ts-ignore
                    label: {
                        visible: visible,
                    },
                }
            })
        })
    }, [visible]);
    return null;
};

const EdgeLabelVisible = (props: {
    visible: boolean;
}) => {
    const { visible } = props;
    const graph = useContext(GraphinContext).graph;

    useEffect(() => {
        graph.getEdges().forEach(edge => {
            graph.updateItem(edge, {
                style: {
                    // @ts-ignore
                    label: {
                        visible: visible,
                    },
                }
            })
        })
    }, [visible]);
    return null;
};

const HighlightNode = (props: { selectedNode?: string }) => {
    if (props.selectedNode) {
        // More details on https://graphin.antv.vision/graphin/quick-start/interface
        const { graph } = useContext(GraphinContext);
        const nodes = graph.getNodes();
        const edges = graph.getEdges();
        // More details on https://graphin.antv.vision/graphin/render/status

        // Clear all status
        nodes.forEach(node => {
            graph.setItemState(node, 'inactive', false);
            graph.setItemState(node, 'active', false);
        });

        // Highlight the selected node.
        nodes.forEach(node => {
            const model = node.getModel();

            if (props.selectedNode && props.selectedNode !== model.id) {
                console.log("UnSelected Node: ", props.selectedNode, model.id)
                graph.setItemState(node, 'inactive', true);
            } else {
                console.log("Selected Node: ", props.selectedNode, model.id)
                graph.setItemState(node, 'active', true);
            }
        });
    }
    return null;
}

const FocusBehavior = (props: { queriedId?: string }) => {
    const { graph, apis } = useContext(GraphinContext);

    useEffect(() => {
        // 初始化聚焦到查询节点
        if (props.queriedId) {
            apis.focusNodeById(props.queriedId);
        }

        const handleClick = (evt: IG6GraphEvent) => {
            const node = evt.item as INode;
            const model = node.getModel() as NodeConfig;
            apis.focusNodeById(model.id);
        };
        // 每次点击聚焦到点击节点上
        graph.on('node:click', handleClick);
        return () => {
            graph.off('node:click', handleClick);
        };
    }, []);
    return null;
};

const NodeSearcher = () => {
    const { graph, apis } = useContext(GraphinContext);

    const [searchLoading, setSearchLoading] = useState(false);
    const [nodeOptions, setNodeOptions] = useState<any[]>([]);

    const handleNodeSelectorChange = (value: string) => {
        console.log("handleNodeSelectorChange: ", value)
        if (value) {
            apis.focusNodeById(value);
        }
    }

    const handleNodeSearch = (value: string) => {
        console.log("handleNodeSearch: ", value)
        setSearchLoading(true);
        if (value) {
            const nodeOptions: any[] = [];
            graph.getNodes().forEach(node => {
                const model = node.getModel() as NodeConfig & GraphNode;
                console.log("handleNodeSearch: ", model)
                if ((model.label && model.label.toLowerCase().includes(value.toLowerCase()))
                    || (model.data.name && model.data.name.toLowerCase().includes(value.toLowerCase()))) {
                    nodeOptions.push({
                        label: `${model.id} | ${model.data.name}`,
                        value: model.id,
                    })
                }
            });
            setNodeOptions(nodeOptions);
            setSearchLoading(false);
        } else {
            setNodeOptions([]);
            setSearchLoading(false);
        }
    }

    return (
        <Select
            className="node-searcher"
            showSearch
            allowClear
            loading={searchLoading}
            defaultActiveFirstOption={false}
            showArrow={true}
            placement={"topRight"}
            placeholder={"Search nodes"}
            onSearch={handleNodeSearch}
            onChange={handleNodeSelectorChange}
            options={nodeOptions}
            filterOption={false}
            notFoundContent={<Empty description={
                searchLoading ? "Searching..." :
                    (nodeOptions !== undefined ? "Not Found" : `Enter your interested node ...`)
            } />}
        >
        </Select>
    )
}

export type GraphinProps = {
    selectedNode?: string;
    data: any;
    layout: any;
    style: any;
    containerId?: string;
    onNodeMenuClick?: NodeOnClickFn;
    onEdgeMenuClick?: EdgeOnClickFn;
    queriedId?: string;
    statistics: any;
    chatbotVisible?: boolean;
    toolbarVisible?: boolean;
}

const GraphinWrapper: React.FC<GraphinProps> = (props) => {
    const { data, layout, style, onNodeMenuClick, onEdgeMenuClick, selectedNode } = props
    const [fishEyeVisible, setFishEyeVisible] = useState(false);

    const [autoPin, setAutoPin] = useState(false);
    const [nodeLabelVisible, setNodeLabelVisible] = useState(true);
    const [edgeLabelVisible, setEdgeLabelVisible] = useState(true);
    const [nodeTooltipEnabled, setNodeTooltipEnabled] = useState(true);
    const [edgeTooltipEnabled, setEdgeTooltipEnabled] = useState(false);
    const [selectedNodeEnabled, setSelectedNodeEnabled] = useState(true);
    const [focusNodeEnabled, setFocusNodeEnabled] = useState(false);
    const [miniMapEnabled, setMiniMapEnabled] = useState(true);
    const [snapLineEnabled, setSnapLineEnabled] = useState(true);
    const [infoPanelEnabled, setInfoPanelEnabled] = useState(true);

    const [currentEdge, setCurrentEdge] = useState<any>(null);
    const [currentNode, setCurrentNode] = useState<any>(null);

    const ref = React.useRef(null);

    // Save the node or edge when the context menu is clicked.
    useEffect(() => {
        if (ref && ref.current && ref.current.graph) {
            ref.current.graph.on("edge:contextmenu", e => {
                setCurrentEdge(e.item)
            })
            ref.current.graph.on("node:contextmenu", e => {
                setCurrentNode(e.item)
            })
        }
    }, [])

    const handleOpenFishEye = () => {
        setFishEyeVisible(true);
    };

    const onCloseFishEye = () => {
        setFishEyeVisible(false);
    };

    const HoverText: React.FC<{ data: Record<string, any>, style: any }> = ({ data, style }) => {
        console.log("HoverText: ", data)
        const dataSource = makeDataSource(data, ["comboId", "degree", "depth", "layoutOrder", "x", "y", "type", "category"])
        const items = Object.keys(dataSource).map(key => {
            if (dataSource[key]) {
                return (
                    <Descriptions.Item key={key} label={voca.titleCase(key)} style={{ height: '50px', overflowY: 'scroll' }}>
                        {dataSource[key]}
                    </Descriptions.Item>
                )
            } else {
                return null
            }
        })
        return (
            items.length > 0 ?
                (<Descriptions size={"small"} column={1} title={null} bordered style={style}>
                    {items}
                </Descriptions>)
                : (<span style={style}>No Properties</span>)
        )
    }

    const options = { enabledStack: true, filterCenter: true }

    const onChangeLegend = (checkedValue: LegendOptionType, options: LegendOptionType[]) => {
        console.log(checkedValue, options);
    };

    return (
        data && <Graphin ref={ref} layoutCache options={options} data={data} layout={layout} style={style}>
            <FitView></FitView>
            {/* BUG?: This seems like it doesn't work. Maybe we need a new layout algorithm. */}
            <DragNodeWithForce autoPin={autoPin} />
            {/* TODO: Cannot work. To expect all linked nodes follow the draged node. */}
            <DragNode />
            <ZoomCanvas />
            <NodeLabelVisible visible={nodeLabelVisible} />
            {/* BUG: Cannot restore the label of edges */}
            <EdgeLabelVisible visible={edgeLabelVisible} />
            <FishEye options={{}} visible={fishEyeVisible} handleEscListener={onCloseFishEye} />
            <HighlightNode selectedNode={selectedNode}></HighlightNode>
            <CustomHoverable bindType="node" disabled={selectedNodeEnabled} />
            <CustomHoverable bindType="edge" disabled={selectedNodeEnabled} />
            <ActivateRelations disabled={!selectedNodeEnabled} />
            <ContextMenu style={{ width: '160px' }}>
                <NodeMenu chatbotVisible={props.chatbotVisible}
                    item={currentNode} onChange={onNodeMenuClick} />
            </ContextMenu>
            <ContextMenu style={{ width: '160px' }} bindType="canvas">
                <CanvasMenu handleOpenFishEye={handleOpenFishEye} />
            </ContextMenu>
            <ContextMenu style={{ width: '160px' }} bindType="edge">
                <EdgeMenu item={currentEdge} chatbotVisible={props.chatbotVisible}
                    onChange={onEdgeMenuClick} />
            </ContextMenu>
            <Legend bindType="node" sortKey="nlabel">
                {(renderProps: LegendChildrenProps) => {
                    console.log('renderProps', renderProps);
                    return <Legend.Node {...renderProps} onChange={onChangeLegend} />;
                }}
            </Legend>
            {props.toolbarVisible ?
                <Toolbar style={{
                    top: 'unset', right: '5px',
                    bottom: '5px', left: 'unset',
                    marginBottom: '0px', opacity: 0.8,
                }}>
                    <Toolbar.Item>
                        <Switch onChange={(checked) => {
                            setAutoPin(checked)
                        }} checked={autoPin} />
                        Auto Pin
                    </Toolbar.Item>
                    <Toolbar.Item>
                        <Switch onChange={(checked) => {
                            setNodeLabelVisible(checked)
                        }} checked={nodeLabelVisible} />
                        Node Label
                    </Toolbar.Item>
                    <Toolbar.Item>
                        <Switch onChange={(checked) => {
                            setEdgeLabelVisible(checked)
                        }} checked={edgeLabelVisible} />
                        Edge Label
                    </Toolbar.Item>
                    <Toolbar.Item>
                        <Switch onChange={(checked) => {
                            setNodeTooltipEnabled(checked)
                        }} checked={nodeTooltipEnabled} />
                        Node Tooltip
                    </Toolbar.Item>
                    <Toolbar.Item>
                        <Switch onChange={(checked) => {
                            setEdgeTooltipEnabled(checked)
                        }} checked={edgeTooltipEnabled} />
                        Edge Tooltip
                    </Toolbar.Item>
                    <Toolbar.Item>
                        <Switch onChange={(checked) => {
                            setSelectedNodeEnabled(checked)
                        }} checked={selectedNodeEnabled} />
                        Select Mode
                    </Toolbar.Item>
                    <Toolbar.Item>
                        <Switch onChange={(checked) => {
                            setFocusNodeEnabled(checked)
                        }} checked={focusNodeEnabled} />
                        Focus Mode
                    </Toolbar.Item>
                    <Toolbar.Item>
                        <Switch onChange={(checked) => {
                            setMiniMapEnabled(checked)
                        }} checked={miniMapEnabled} />
                        MiniMap
                    </Toolbar.Item>
                    <Toolbar.Item>
                        <Switch onChange={(checked) => {
                            setSnapLineEnabled(checked)
                        }} checked={snapLineEnabled} />
                        SnapLine
                    </Toolbar.Item>
                    <Toolbar.Item>
                        <Switch onChange={(checked) => {
                            setInfoPanelEnabled(checked)
                        }} checked={infoPanelEnabled} />
                        Info Panel
                    </Toolbar.Item>
                    <Toolbar.Item>
                        <Button type="primary" size="small" style={{ width: '100%' }} onClick={() => {
                            localStorage.setItem('graphin-settings', JSON.stringify({
                                autoPin, nodeLabelVisible, edgeLabelVisible,
                                nodeTooltipEnabled, edgeTooltipEnabled,
                                selectedNodeEnabled, focusNodeEnabled,
                                miniMapEnabled, snapLineEnabled, infoPanelEnabled
                            }))
                            message.success('Settings saved')
                        }}>Save Settings</Button>
                    </Toolbar.Item>
                    <Toolbar.Item>
                        <Button danger size="small" style={{ width: '100%' }} onClick={() => {
                            const settings = JSON.parse(localStorage.getItem('graphin-settings') || '{}')
                            setAutoPin(settings.autoPin)
                            setNodeLabelVisible(settings.nodeLabelVisible)
                            setEdgeLabelVisible(settings.edgeLabelVisible)
                            setNodeTooltipEnabled(settings.nodeTooltipEnabled)
                            setEdgeTooltipEnabled(settings.edgeTooltipEnabled)
                            setSelectedNodeEnabled(settings.selectedNodeEnabled)
                            setFocusNodeEnabled(settings.focusNodeEnabled)
                            setMiniMapEnabled(settings.miniMapEnabled)
                            setSnapLineEnabled(settings.snapLineEnabled)
                            setInfoPanelEnabled(settings.infoPanelEnabled)
                            message.success('Settings loaded')
                        }}>Load Settings</Button>
                    </Toolbar.Item>
                </Toolbar>
                : null
            }

            <NodeSearcher></NodeSearcher>

            {focusNodeEnabled ?
                <FocusBehavior queriedId={props.queriedId} />
                : null
            }
            {(selectedNodeEnabled && !focusNodeEnabled) ?
                <ClickSelect multiple={true} trigger={"shift"}></ClickSelect>
                : null
            }
            {nodeTooltipEnabled ?
                <Tooltip bindType="node" hasArrow placement="bottom" style={{ opacity: 0.9 }}>
                    {(value: TooltipValue) => {
                        if (value.model) {
                            const { model } = value;
                            return (
                                <HoverText data={model} style={{ padding: '10px', width: 'fit-content', maxWidth: '400px' }}></HoverText>
                            );
                        }
                        return null;
                    }}
                </Tooltip>
                : null}
            {edgeTooltipEnabled ?
                <Tooltip bindType="edge" hasArrow placement="bottom" style={{ opacity: 0.9 }}>
                    {(value: TooltipValue) => {
                        if (value.model) {
                            const { model } = value;
                            return (
                                <HoverText data={model} style={{ padding: '10px', width: 'fit-content' }}></HoverText>
                            );
                        }
                        return null;
                    }}
                </Tooltip>
                : null}
            {miniMapEnabled ? <MiniMap /> : null}
            {snapLineEnabled ? <SnapLine options={snapLineOptions} visible /> : null}
            {infoPanelEnabled ? <DataArea data={props.statistics}
                style={{ position: 'absolute', top: '0px', left: '0px', zIndex: 1 }}></DataArea>
                : null
            }
        </Graphin>
    );
}

export default GraphinWrapper;