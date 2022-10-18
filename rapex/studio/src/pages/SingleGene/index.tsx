import {
    BarChartOutlined,
    EditOutlined,
    FullscreenExitOutlined,
    HistoryOutlined,
    IssuesCloseOutlined,
    // SnippetsOutlined,
} from '@ant-design/icons';
import { Button, Col, Drawer, Row, Space, Tabs, Tooltip } from 'antd';
import React, { memo, useEffect, useState } from 'react';
import PlotlyViewer from '@/pages/StatEngine/PlotlyViewer/indexClass';
import HistoryTable from '@/pages/StatEngine/HistoryTable';
import { StatEngineAPI } from '@/pages/StatEngine/services/typings';
import { useIntl } from 'umi';

import './index.less';
import { langData } from './lang';

const { TabPane } = Tabs;

export type ReportProps = {
    results: string[];
    charts: string[];
    responsiveKey: number | string;
};

type UIContext = Record<string, any>;

const ReportPanel: React.FC<ReportProps> = (props) => {
    const intl = useIntl();

    const uiContext: UIContext = {};
    Object.keys(langData).forEach((key) => {
        uiContext[key] = intl.formatMessage(langData[key]);
    });

    const { responsiveKey, results, charts } = props;

    const [chartTask, setChartTask] = useState<StatEngineAPI.TaskListItem | undefined>(undefined);
    const [plotlyEditorMode, setPlotlyEditorMode] = useState<string>('Plotly');
    const [chartsVisible, setChartsVisible] = useState<boolean>(false);
    const [historyVisible, setHistoryVisible] = useState<boolean>(false);
    const [activeKey, setActiveKey] = useState<string>("chart");

    return (
        <Row className="report-panel">
            <Tabs
                onChange={(activeKey) => { setActiveKey(activeKey) }}
                activeKey={activeKey}
                className="tabs-result">
                <TabPane
                    tab={
                        <span>
                            <BarChartOutlined />
                            {uiContext.figure}
                        </span>
                    }
                    key="chart"
                >
                    <Col id="graph-container">
                        <PlotlyViewer
                            responsiveKey={responsiveKey}
                            dataSources={{}}
                            dataSourceOptions={[]}
                            plotlyId={charts[0]}
                            key={charts[0]}
                            mode={plotlyEditorMode}
                        ></PlotlyViewer>
                    </Col>
                </TabPane>
            </Tabs>

            <Drawer
                title="Chart History"
                placement="right"
                closable
                width="70%"
                onClose={() => {
                    setHistoryVisible(false);
                }}
                visible={historyVisible}
            >
                <HistoryTable
                    forceUpdateKey={`${historyVisible}`}
                    pluginName={currentChart || undefined}
                    onClickItem={(chart_name, result, task) => {
                        onClickItem(chart_name, result, task);
                        setHistoryVisible(false);
                        setChartTask(task)
                    }}
                ></HistoryTable>
            </Drawer>
        </Row>
    );
};

export default memo(ReportPanel);
