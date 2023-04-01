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
    CloseCircleOutlined,
    CloudDownloadOutlined,
    EyeOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import type { TooltipValue, LegendChildrenProps, LegendOptionType } from '@antv/graphin';
import DataArea from './DataArea';
import { message, Descriptions, Switch, Button } from 'antd';
import { makeDataSource } from './utils';
import type { DataOnChangeFn } from "./typings";
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

type MenuProps = {
    onChange?: DataOnChangeFn
}

const EdgeMenu = (props: MenuProps) => {
    const { graph, apis } = useContext(GraphinContext);

    const options = [
        {
            key: 'barchart',
            icon: <BarChartOutlined />,
            name: 'Bar Chart',
        },
        {
            key: 'boxchart',
            icon: <BoxPlotOutlined />,
            name: 'Box Plot',
        },
        {
            key: 'heatmap',
            icon: <HeatMapOutlined />,
            name: 'Heatmap',
        },
        {
            key: 'scatterchart',
            icon: <DotChartOutlined />,
            name: 'Scatter Chart',
        },
    ];

    const onChange = function (item: any, data: any) {
        if (props.onChange && graph && apis) {
            props.onChange(item, data, graph, apis)
        } else {
            message.warn("Cannot catch the changes.")
        }
    }

    return <Menu options={options} onChange={onChange} bindType="node" />
}

const NodeMenu = (props: MenuProps) => {
    const { graph, apis } = useContext(GraphinContext);

    const options = [
        {
            key: 'expand',
            icon: <ExpandAltOutlined />,
            name: 'Expand One Level',
        },
        // {
        //     key: 'tag',
        //     icon: <TagFilled />,
        //     name: 'Tag Node',
        // },
        {
            key: 'delete',
            icon: <DeleteFilled />,
            name: 'Delete Node',
        },
    ];

    const onChange = function (item: any, data: any) {
        if (props.onChange && graph && apis) {
            props.onChange(item, data, graph, apis)
        } else {
            message.warn("Cannot catch the changes.")
        }
    }

    return <Menu options={options} onChange={onChange} bindType="node" />
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

export type GraphinProps = {
    selectedNode?: string;
    data: any;
    layout: any;
    style: any;
    containerId?: string;
    onNodeMenuClick?: DataOnChangeFn;
    onEdgeMenuClick?: DataOnChangeFn;
    queriedId?: string;
    statistics: any;
    toolbarVisible?: boolean;
}

const GraphinWrapper: React.FC<GraphinProps> = (props) => {
    const { data, layout, style, onNodeMenuClick, selectedNode } = props
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

    const ref = React.useRef(null);

    const handleOpenFishEye = () => {
        setVisible(true);
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
                <NodeMenu onChange={onNodeMenuClick}></NodeMenu>
            </ContextMenu>
            <ContextMenu style={{ width: '160px' }} bindType="canvas">
                <CanvasMenu handleOpenFishEye={handleOpenFishEye} />
            </ContextMenu>
            <ContextMenu style={{ width: '160px' }} bindType="edge">
                <EdgeMenu />
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