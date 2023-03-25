import React, { useState } from "react";
import Graphin, { Components, Behaviors, GraphinContext } from '@antv/graphin';
import { ContextMenu, FishEye } from '@antv/graphin-components';
import {
    TagFilled,
    DeleteFilled,
    ExpandAltOutlined,
    CloseCircleOutlined,
    CloudDownloadOutlined,
    EyeOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import type { TooltipValue } from '@antv/graphin';
import { Config } from './MenuButton';
import { message, Descriptions } from 'antd';
import { makeDataSource } from './utils';
import type { DataOnChangeFn } from "./typings";
import voca from 'voca';
import './graphin-wrapper.less';

const { MiniMap, SnapLine, Tooltip } = Components;

const {
    ZoomCanvas, ActivateRelations, ClickSelect, Hoverable,
    FitView, DragNodeWithForce
} = Behaviors;
const { Menu } = ContextMenu;

export type GraphinProps = {
    config?: Config;
    selectedNode?: string;
    data: any;
    layout: any;
    style: any;
    containerId?: string;
    handleChange?: DataOnChangeFn
}

const snapLineOptions = {
    line: {
        stroke: 'lightgreen',
        lineWidth: 1,
    },
};

type MenuProps = {
    onChange?: DataOnChangeFn
}

const NodeMenu = (props: MenuProps) => {
    const { graph, apis } = React.useContext(GraphinContext);

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
    const { graph, contextmenu } = React.useContext(GraphinContext);
    const context = contextmenu.canvas;
    const handleDownload = () => {
        graph.downloadFullImage('canvas-contextmenu');
        context.handleClose();
    };
    const handleClear = () => {
        message.info(`Clear canvas successfully`);
        graph.clear();
        context.handleClose();
    };

    const handleStopLayout = () => {
        message.info(`Stop layout successfully`);
        graph.stopAnimate();
        context.handleClose();
    };

    const handleOpenFishEye = () => {
        props.handleOpenFishEye();
    };

    return (
        <Menu bindType="canvas">
            <Menu.Item onClick={handleOpenFishEye}>
                <EyeOutlined /> Enable FishEye
            </Menu.Item>
            <Menu.Item onClick={handleClear}>
                <DeleteOutlined /> Clear Canvas
            </Menu.Item>
            <Menu.Item onClick={handleStopLayout}>
                <CloseCircleOutlined /> Stop Layout
            </Menu.Item>
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
    const { graph } = React.useContext(GraphinContext);
    const [enableHoverable, setEnableHoverable] = useState<boolean>(false);

    // TODO: How to disable hoverable when there are multiple nodes selected?
    // React.useEffect(() => {
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

    const graph = React.useContext(GraphinContext).graph;

    React.useEffect(() => {
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
    const graph = React.useContext(GraphinContext).graph;

    React.useEffect(() => {
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
        const { graph } = React.useContext(GraphinContext);
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

const GraphinWrapper: React.FC<GraphinProps> = (props) => {
    const { data, layout, style, handleChange, config, selectedNode } = props
    const [visible, setVisible] = useState(false);
    const ref = React.useRef(null);

    const handleOpenFishEye = () => {
        setVisible(true);
    };

    const handleClose = () => {
        setVisible(false);
    };

    const HoverText: React.FC<{ data: Record<string, any>, style: any }> = ({ data, style }) => {
        console.log("HoverText: ", data)
        const dataSource = makeDataSource(data, ["comboId", "degree", "depth", "layoutOrder", "x", "y", "type", "category"])
        const items = Object.keys(dataSource).map(key => {
            if (dataSource[key]) {
                return (
                    <Descriptions.Item key={key} label={voca.titleCase(key)}>
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

    const options = { enabledStack: true, groupType: "nlabel", filterCenter: true }

    return (
        data && <Graphin ref={ref} layoutCache options={options} data={data} layout={layout} style={style}>
            <FitView></FitView>
            <DragNodeWithForce autoPin={true} />
            <HighlightNode selectedNode={selectedNode}></HighlightNode>
            <ZoomCanvas />
            <FishEye options={{}} visible={visible} handleEscListener={handleClose} />
            <ClickSelect multiple={true} trigger={"shift"}></ClickSelect>
            {config ?
                <NodeLabelVisible visible={config.nodeLabelEnabled} />
                : null
            }
            {config ?
                <EdgeLabelVisible visible={config.edgeLabelEnabled} />
                : null
            }
            {(config ? config.nodeTooltipEnabled : null) ?
                <Tooltip bindType="node" hasArrow>
                    {(value: TooltipValue) => {
                        if (value.model) {
                            const { model } = value;
                            return (
                                <HoverText data={model} style={{ padding: '10px', minWidth: '300px', maxWidth: '500px' }}></HoverText>
                            );
                        }
                        return null;
                    }}
                </Tooltip>
                : null}
            {(config ? config.edgeTooltipEnabled : null) ?
                <Tooltip bindType="edge" hasArrow>
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
            {(config ? config.miniMapEnabled : null) ? <MiniMap /> : null}
            <CustomHoverable bindType="node" />
            <CustomHoverable bindType="edge" />
            {(config ? config.snapLineEnabled : null) ? <SnapLine options={snapLineOptions} visible /> : null}
            <ActivateRelations />
            <ContextMenu style={{ width: '160px' }}>
                <NodeMenu onChange={handleChange}></NodeMenu>
            </ContextMenu>
            <ContextMenu style={{ width: '160px' }} bindType="canvas">
                <CanvasMenu handleOpenFishEye={handleOpenFishEye} />
            </ContextMenu>
            {/* <ContextMenu style={{ width: '200px' }} bindType="edge">
                <Menu
                    options={options.map(item => {
                        return { ...item, name: `${item.name}-EDGE` };
                    })}
                    onChange={onChange}
                    bindType="edge"
                />
            </ContextMenu> */}
        </Graphin>
    );
}

export default GraphinWrapper;