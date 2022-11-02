import React from "react";
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
import voca from 'voca';
import './graphin-wrapper.less';

const { MiniMap, SnapLine, Tooltip } = Components;

const { ZoomCanvas, ActivateRelations, ClickSelect, Hoverable, FitView } = Behaviors;
const { Menu } = ContextMenu;

export type GraphinProps = {
    config?: Config;
    selectedNode?: string;
    data: any;
    layout: any;
    style: any;
    handleChange?: (item: any, data: any) => void
}

const snapLineOptions = {
    line: {
        stroke: 'lightgreen',
        lineWidth: 1,
    },
};

const options = [
    {
        key: 'expand',
        icon: <ExpandAltOutlined />,
        name: 'Expand One Level',
    },
    {
        key: 'tag',
        icon: <TagFilled />,
        name: 'Tag Node',
    },
    {
        key: 'delete',
        icon: <DeleteFilled />,
        name: 'Delete Node',
    },
];

const CanvasMenu = (props: any) => {
    const { graph, contextmenu } = React.useContext(GraphinContext);
    const context = contextmenu.canvas;
    const handleDownload = () => {
        graph.downloadFullImage('canvas-contextmenu');
        context.handleClose();
    };
    const handleClear = () => {
        message.info(`Clear canvas successfully`);
        context.handleClose();
    };
    const handleStopLayout = () => {
        message.info(`Stop layout successfully`);
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

    const [visible, setVisible] = React.useState(false);
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
                return (<Descriptions.Item key={voca.titleCase(key)} label={key}>{dataSource[key]}</Descriptions.Item>)
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

    return (
        data && <Graphin fitCenter={true} data={data} layout={layout} style={style}>
            <FitView></FitView>
            <HighlightNode selectedNode={selectedNode}></HighlightNode>
            <ClickSelect multiple={true} trigger={"shift"}></ClickSelect>
            {(config ? config.nodeTooltipEnabled : null) ?
                <Tooltip bindType="node" hasArrow>
                    {(value: TooltipValue) => {
                        if (value.model) {
                            const { model } = value;
                            return (
                                <HoverText data={model} style={{ padding: '10px', width: '300px' }}></HoverText>
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
            <ZoomCanvas />
            {(config ? config.miniMapEnabled : null) ? <MiniMap /> : null}
            <Hoverable bindType="node" />
            {/* <Hoverable bindType="edge" /> */}
            {(config ? config.snapLineEnabled : null) ? <SnapLine options={snapLineOptions} visible /> : null}
            <ActivateRelations />
            <ContextMenu style={{ width: '150px' }}>
                <Menu options={options} onChange={handleChange} bindType="node" />
            </ContextMenu>
            <ContextMenu style={{ width: '150px' }} bindType="canvas">
                <CanvasMenu handleOpenFishEye={handleOpenFishEye} />
            </ContextMenu>
            <ContextMenu style={{ width: '200px' }} bindType="edge">
                <Menu
                    options={options.map(item => {
                        return { ...item, name: `${item.name}-EDGE` };
                    })}
                    onChange={handleChange}
                    bindType="edge"
                />
            </ContextMenu>
            <FishEye options={{}} visible={visible} handleEscListener={handleClose} />
        </Graphin>
    );
}

export default GraphinWrapper;