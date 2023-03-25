import React, { useState } from "react";
import { Collapse, Tooltip, Button, Col, Space, Select, Form, Switch } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import {
    RadarChartOutlined,
    BranchesOutlined,
    DeploymentUnitOutlined,
    GlobalOutlined,
    ForkOutlined,
    NodeIndexOutlined,
    ShareAltOutlined,
    SubnodeOutlined,
    GatewayOutlined,
    CaretRightOutlined,
    CustomerServiceFilled,
} from '@ant-design/icons';
import { defaultLayout } from './utils';
import './menu-button.less';


const { Panel } = Collapse;
const SelectOption = Select.Option;

export type Config = {
    snapLineEnabled: boolean,
    miniMapEnabled: boolean,
    nodeLabelEnabled: boolean,
    edgeLabelEnabled: boolean,
    nodeTooltipEnabled: boolean,
    edgeTooltipEnabled: boolean,
    infoPanelEnabled: boolean,
}

export type MenuButtonProps = {
    config?: Config;
    onChangeConfig: (config: Config, layout: any) => void;
    style?: any
}

const MenuButton: React.FC<MenuButtonProps> = (props) => {
    const { style, onChangeConfig, config } = props;
    const [form] = Form.useForm();
    const [menuActive, setMenuActive] = useState<boolean>(false);

    // force, comboForce, grid, radial, random, dagre, concentric, circle
    const iconMap = {
        'graphin-force': <DeploymentUnitOutlined />,
        random: <NodeIndexOutlined />,
        concentric: <GlobalOutlined />,
        force: <ForkOutlined />,
        dagre: <SubnodeOutlined />,
        grid: <BranchesOutlined />,
        radial: <RadarChartOutlined />,
    };

    const layouts = [
        defaultLayout,
        {
            type: 'grid',
            // begin: [0, 0], // 可选，
            // preventOverlap: true, // 可选，必须配合 nodeSize
            // preventOverlapPdding: 20, // 可选
            // nodeSize: 30, // 可选
            // condense: false, // 可选
            // rows: 5, // 可选
            // cols: 5, // 可选
            // sortBy: 'degree', // 可选
            // workerEnabled: false, // 可选，开启 web-worker
        },
        {
            type: 'radial',
            // center: [200, 200], // 可选，默认为图的中心
            // linkDistance: 50, // 可选，边长
            // maxIteration: 1000, // 可选
            // focusNode: 'node11', // 可选
            // unitRadius: 100, // 可选
            // preventOverlap: true, // 可选，必须配合 nodeSize
            // nodeSize: 30, // 可选
            // strictRadial: false, // 可选
            // workerEnabled: false, // 可选，开启 web-worker
        },
        {
            type: 'force',
            preventOverlap: true,
            // center: [200, 200], // 可选，默认为图的中心
            linkDistance: 50, // 可选，边长
            nodeStrength: 30, // 可选
            edgeStrength: 0.8, // 可选
            collideStrength: 0.8, // 可选
            nodeSize: 30, // 可选
            alpha: 0.9, // 可选
            alphaDecay: 0.3, // 可选
            alphaMin: 0.01, // 可选
            forceSimulation: null, // 可选
            onTick: () => {
                // 可选
                console.log('ticking');
            },
            onLayoutEnd: () => {
                // 可选
                console.log('force layout done');
            },
        },
        {
            type: 'concentric',
            maxLevelDiff: 0.5,
            sortBy: 'degree',
            // center: [200, 200], // 可选，

            // linkDistance: 50, // 可选，边长
            // preventOverlap: true, // 可选，必须配合 nodeSize
            // nodeSize: 30, // 可选
            // sweep: 10, // 可选
            // equidistant: false, // 可选
            // startAngle: 0, // 可选
            // clockwise: false, // 可选
            // maxLevelDiff: 10, // 可选
            // sortBy: 'degree', // 可选
            // workerEnabled: false, // 可选，开启 web-worker
        }
    ];

    return (
        <Space style={{ ...style }}>
            <Tooltip title="Knowledge Graph Configuration">
                <Button onClick={() => setMenuActive(!menuActive)}
                    className='hover-button' type="ghost"
                    shape="circle" icon={<SettingOutlined />} />
            </Tooltip>
            {
                menuActive ?
                    <Col className="hover-menu">
                        <Collapse defaultActiveKey={['canvas']} expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}>
                            <Panel header="Canvas" key="canvas">
                                <Form
                                    labelCol={{ span: 10 }}
                                    layout={'horizontal'}
                                    form={form}
                                    initialValues={config}
                                    onValuesChange={(changedValues, values) => {
                                        const config = {
                                            miniMapEnabled: values.miniMapEnabled,
                                            snapLineEnabled: values.snapLineEnabled,
                                            nodeLabelEnabled: values.nodeLabelEnabled,
                                            edgeLabelEnabled: values.edgeLabelEnabled,
                                            nodeTooltipEnabled: values.nodeTooltipEnabled,
                                            edgeTooltipEnabled: values.edgeTooltipEnabled,
                                            infoPanelEnabled: values.infoPanelEnabled,
                                        }

                                        const layout = layouts.find(item => item.type === values.layout);
                                        onChangeConfig(config, layout)
                                    }}
                                >
                                    <Form.Item label="Layout" name="layout">
                                        <Select style={{ width: '100%' }} allowClear
                                            placeholder="Select a layout" >
                                            {layouts.map(item => {
                                                const { type } = item;
                                                const iconComponent = iconMap[type] || <CustomerServiceFilled />;
                                                return (
                                                    <SelectOption key={type} value={type}>
                                                        {iconComponent} &nbsp;
                                                        {type}
                                                    </SelectOption>
                                                );
                                            })}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item label="MiniMap" name="miniMapEnabled" valuePropName="checked">
                                        <Switch />
                                    </Form.Item>
                                    <Form.Item label="SnapLine" name="snapLineEnabled" valuePropName="checked">
                                        <Switch />
                                    </Form.Item>
                                    <Form.Item label="Node Label" name="nodeLabelEnabled" valuePropName="checked">
                                        <Switch />
                                    </Form.Item>
                                    <Form.Item label="Edge Label" name="edgeLabelEnabled" valuePropName="checked">
                                        <Switch />
                                    </Form.Item>
                                    <Form.Item label="Node Tooltip" name="nodeTooltipEnabled" valuePropName="checked">
                                        <Switch />
                                    </Form.Item>
                                    <Form.Item label="Edge Tooltip" name="edgeTooltipEnabled" valuePropName="checked">
                                        <Switch />
                                    </Form.Item>
                                    <Form.Item label="Info Panel" name="infoPanelEnabled" valuePropName="checked">
                                        <Switch />
                                    </Form.Item>
                                </Form>
                            </Panel>
                        </Collapse>
                    </Col>
                    : null
            }
        </Space>
    )
}

export default MenuButton;