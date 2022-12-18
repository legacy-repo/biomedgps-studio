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

import './menu-button.less';

const { Panel } = Collapse;
const SelectOption = Select.Option;

export type Config = {
    snapLineEnabled: boolean,
    miniMapEnabled: boolean,
    nodeTooltipEnabled: boolean,
    edgeTooltipEnabled: boolean,
    infoPanelEnabled: boolean
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
        concentric: <ShareAltOutlined />,
        circle: <GlobalOutlined />,
        force: <ForkOutlined />,
        dagre: <SubnodeOutlined />,
        grid: <BranchesOutlined />,
        radial: <RadarChartOutlined />,
    };

    const layouts = [
        {
            type: 'graphin-force',
            workerEnabled: true, // 可选，开启 web-worker
            gpuEnabled: true, // 可选，开启 GPU 并行计算，G6 4.0 支持
        },
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
                                    labelCol={{ span: 9 }}
                                    layout={'horizontal'}
                                    form={form}
                                    initialValues={config}
                                    onValuesChange={(changedValues, values) => {
                                        const config = {
                                            miniMapEnabled: values.miniMapEnabled,
                                            snapLineEnabled: values.snapLineEnabled,
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