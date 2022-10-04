import type { ProFormColumnsType } from '@ant-design/pro-form';
import { GridContent } from '@ant-design/pro-layout';
import { Button, Col, message, Modal, Row, Space, Spin, Tabs, Tooltip } from 'antd';
import Draggable from 'react-draggable';
import type { StaticContext } from 'react-router';
import type { RouteComponentProps } from 'react-router-dom';
import { useIntl } from 'umi';

import {
  CheckCircleOutlined,
  ContainerOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import React, { useCallback, useEffect, useState } from 'react';
import './index.less';

// Custom Component
import ArgumentForm from './components/ArgumentForm';
import DataTable from './components/DataTable';
import ImportForm from './components/ImportForm';
import MarkdownViewer from './components/MarkdownViewer';
import Resizer from './components/Resizer';
import ResultPanel from './components/ResultPanel';

// Custom DataType
import type { ChartResult, DataItem, DataKey } from './components/ChartList/data';
import type { DataLoader } from './components/Common/data';
import type { Bound } from './data';
type UIContext = Record<string, any>;

// Custom API
import { getChartTask, getChartUiSchema, postChart } from './services/StatEngine';

// Custom Data
import { langData } from './lang';

// Custom Helper
import { render as renderTemplate } from './util';

const { TabPane } = Tabs;

const StatEngine: React.FC<RouteComponentProps<{}, StaticContext>> = (props) => {
  const intl = useIntl();

  console.log('StatEngine Props: ', props);

  const uiContext: UIContext = {};
  Object.keys(langData).forEach((key) => {
    uiContext[key] = intl.formatMessage(langData[key]);
  });

  const [leftSpan, setLeftSpan] = useState<number>(12);
  const [resizeBtnActive, setResizeBtnActive] = useState<boolean>(false);

  // Left Panel
  const [currentActiveKey, setCurrentActiveKey] = useState<string>('arguments');
  const [inDataContext, setInDataContext] = useState<boolean>(false);

  // Chart
  const [currentChart, setCurrentChart] = useState<string | null>('');
  const [markdownLink, setMarkdownLink] = useState<string>('');
  const [argumentColumns, setArgumentColumns] = useState<ProFormColumnsType<DataItem>[]>([]);
  const [dataKey, setDataKey] = useState<DataKey>({
    annoData: 'Anno',
    data: 'Data',
  });
  // Must be a json string
  const [argumentFields, setArgumentFields] = useState<string>('{}');

  // Data & Anno Data
  // const [data, setData] = useState<any[][]>([]);
  // const [annoData, setAnnoData] = useState<any[][]>([]);
  const [dataLoader, setDataLoader] = useState<{ [key: string]: DataLoader }>({});
  const [resultData, setResultData] = useState<ChartResult | undefined>({
    results: [],
    charts: [],
    taskId: '',
    log: '',
  });

  // Result
  const [resultLoading, setResultLoading] = useState<boolean>(false);

  // Modal
  const [modalDisabled, setModalDisabled] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [bounds, setBounds] = useState<Bound>({ left: 0, top: 0, bottom: 0, right: 0 });
  const draggleRef: React.RefObject<HTMLDivElement> = React.createRef();

  useEffect(() => {
    setCurrentChart('corrplot');
  }, []);

  const onModalStart = (event: any, uiData: any) => {
    const { clientWidth, clientHeight } = window?.document?.documentElement;
    const targetRect = draggleRef?.current?.getBoundingClientRect();
    if (targetRect) {
      setBounds({
        left: -targetRect?.left + uiData?.x,
        right: clientWidth - (targetRect?.right - uiData?.x),
        top: -targetRect?.top + uiData?.y,
        bottom: clientHeight - (targetRect?.bottom - uiData?.y),
      });
    }
  };

  const onLoadData = (loader: DataLoader) => {
    const currentDataLoader = {};
    currentDataLoader[currentActiveKey] = { ...dataLoader[currentActiveKey], ...loader };
    setDataLoader({ ...dataLoader, ...currentDataLoader });
    // Close the modal
    setModalVisible(false);
  };

  const resetFields = (fields: any[] | undefined): any => {
    if (fields && Object.entries(fields).length > 0) {
      const fieldsString = JSON.stringify(fields);

      setArgumentFields(fieldsString);
      const renderedFields = renderTemplate(fieldsString, {
        columns: [],
        datafile: [],
      });

      setArgumentColumns(renderedFields);
      console.log('Fields: ', fields, renderedFields);
    }
  };

  const setChart = (chart: string, result?: ChartResult) => {
    getChartUiSchema({ chart_name: chart }).then((response) => {
      const schema = {
        ...response.schema,
      };

      // Reset README
      setMarkdownLink(response.readme);

      // Reset Argument
      resetFields(schema.fields);

      // Reset DataKey
      setDataKey(schema.dataKey);
    });

    if (result) {
      setResultData(result);
    } else {
      setResultData(undefined);
    }
  };

  const selectItem = useCallback(setChart, []);

  const isInDataContext = (key: string) => {
    return ['data', 'annoData'].includes(key) || false;
  };

  const changeDataTab = (key: string) => {
    // Why?
    // if (key !== 'arguments') {
    //   setInDataContext(isInDataContext(key));
    // }
    setInDataContext(isInDataContext(key));

    setCurrentActiveKey(key);
  };

  const autoFetchTask = (taskId: string) => {
    const interval = setInterval(() => {
      if (taskId.length > 0) {
        getChartTask({ id: taskId })
          .then((resp) => {
            if (resp.status === 'Finished') {
              setResultData({
                results: resp.response.results,
                charts: resp.response.charts,
                log: resp.response.log,
                taskId: resp.response.task_id,
              });
              setResultLoading(false);
              message.success('Load chart...');
              clearInterval(interval);
            } else if (resp.status === 'Failed') {
              setResultLoading(false);
              message.error('Something wrong, please check the log for more details.');
              clearInterval(interval);
            }
          })
          .catch((error) => {
            console.log('Get Task Error: ', error);
            clearInterval(interval);
          });
      }
    }, 1000);
  };

  const summaryOperations = false ? (
    <Space>
      <Tooltip title={uiContext.resetTooltip}>
        <Button disabled type="primary" danger icon={<StopOutlined />}>
          {uiContext.reset}
        </Button>
      </Tooltip>
      <Tooltip title={uiContext.exampleTooltip}>
        <Button disabled icon={<DatabaseOutlined />}>
          {leftSpan >= 12 ? `${uiContext.example}` : ''}
        </Button>
      </Tooltip>
      <Button
        disabled={!inDataContext}
        onClick={() => {
          setModalVisible(true);
        }}
        icon={<ContainerOutlined />}
      >
        {uiContext.loadData}
      </Button>
    </Space>
  ) : null;

  const updateData = useCallback(
    (key: string, tableData: any[][], tableHeader: string[]) => {
      console.log('Table Header: ', tableHeader);
      if (key === 'data') {
        // setData([tableHeader].concat(tableData));

        // Initial Arguments
        if (
          tableHeader.length > 0 &&
          dataLoader.data.dataSource &&
          dataLoader.data.dataSource.length > 0 &&
          argumentFields.length > 0
        ) {
          const fields = renderTemplate(argumentFields, {
            columns: tableHeader,
            datafile: [dataLoader.data.dataSource],
          });
          setArgumentColumns(fields);
          console.log('updateData - Updated Fields: ', argumentFields, fields);
        }
      }

      if (key === 'annoData') {
        // setAnnoData([tableHeader].concat(tableData));
      }
    },
    [dataLoader, argumentFields],
  );

  const onSubmit = (values: any) => {
    const chartName: string = currentChart || '';
    console.log('onSubmit Chart: ', currentChart, values);
    return new Promise<ChartResult>((resolve, reject) => {
      postChart({ chart_name: chartName }, values)
        .then((response) => {
          console.log('Post Chart: ', response);
          message.success(`Create the chart ${chartName} successfully.`);
          setResultLoading(true);
          autoFetchTask(response.task_id);
          // resolve(response);
        })
        .catch((error) => {
          message.warn('Unknown error, please retry later.');
          console.log('Post Chart Error: ', error);
          reject(error);
        });
    });
  };

  const getRightSpan = (customLeftSpan: number): number => {
    return 24 - customLeftSpan ? 24 - customLeftSpan : 24;
  };

  useEffect(() => {
    if (currentChart) {
      selectItem(currentChart, resultData);
    }
  }, [currentChart, resultData, selectItem]);

  return (
    <GridContent>
      <Spin spinning={resultLoading} style={{ marginTop: '50px' }}>
        <Row className="stat-engine" gutter={8}>
          <Col className="left" xxl={leftSpan} xl={leftSpan} lg={leftSpan} md={24} sm={24} xs={24}>
            <Row className="left__content">
              <Col className="left__tabs">
                <Tabs
                  onChange={(key) => {
                    changeDataTab(key);
                  }}
                  activeKey={currentActiveKey}
                  defaultActiveKey="arguments"
                  className="left__tabs__arguments"
                  tabBarExtraContent={summaryOperations}
                >
                  <TabPane
                    tab={
                      <span>
                        <CheckCircleOutlined />
                        {uiContext.arguments}
                      </span>
                    }
                    key="arguments"
                  >
                    <ArgumentForm
                      labelSpan={12}
                      height="calc(100% - 62px)"
                      onSubmit={onSubmit}
                      columns={argumentColumns}
                    ></ArgumentForm>
                  </TabPane>
                  <TabPane
                    tab={
                      <span>
                        <InfoCircleOutlined />
                        {uiContext.summary}
                      </span>
                    }
                    key="summary"
                  >
                    <MarkdownViewer url={markdownLink} />
                  </TabPane>
                  {false ? (
                    <TabPane tab={<span>Data</span>} key="data">
                      <DataTable
                        dataKey="data"
                        updateData={updateData}
                        dataLoader={dataLoader['data']}
                        height="calc(100vh - 145px)"
                        width="100%"
                      ></DataTable>
                    </TabPane>
                  ) : null}
                  {false && dataKey['annoData'] ? (
                    <TabPane tab={<span>Anno</span>} key="annoData">
                      <DataTable
                        dataKey="annoData"
                        updateData={updateData}
                        dataLoader={dataLoader['annoData']}
                        height="calc(100vh - 145px)"
                        width="100%"
                      ></DataTable>
                    </TabPane>
                  ) : null}
                </Tabs>
              </Col>
              <Resizer
                className="left__divider"
                HoverHandler={setResizeBtnActive}
                ClickHandler={setLeftSpan}
                btnActive={resizeBtnActive}
              ></Resizer>
            </Row>
          </Col>
          <Col
            className="right"
            xxl={getRightSpan(leftSpan)}
            xl={getRightSpan(leftSpan)}
            lg={getRightSpan(leftSpan)}
            md={24}
            sm={24}
            xs={24}
          >
            <Row className="right__content">
              <ResultPanel
                results={resultData?.results || []}
                charts={resultData?.charts || []}
                taskId={resultData?.taskId || ''}
                responsiveKey={leftSpan}
                logLink={resultData?.log || ''}
                onClickItem={selectItem}
              ></ResultPanel>
            </Row>
          </Col>
        </Row>
      </Spin>
      <Modal
        className="import-form-modal"
        width="50%"
        title={
          <div
            style={{
              width: '100%',
              cursor: 'move',
            }}
            onMouseOver={() => {
              if (modalDisabled) {
                setModalDisabled(false);
              }
            }}
            onMouseOut={() => {
              setModalDisabled(true);
            }}
            // fix eslintjsx-a11y/mouse-events-have-key-events
            // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/mouse-events-have-key-events.md
            onFocus={() => {}}
            onBlur={() => {}}
            // end
          >
            Data Loader
          </div>
        }
        visible={modalVisible}
        footer={null}
        onCancel={() => {
          setModalVisible(false);
        }}
        modalRender={(modal) => (
          <Draggable
            disabled={modalDisabled}
            bounds={bounds}
            onStart={(event, uiData) => onModalStart(event, uiData)}
          >
            <div ref={draggleRef}>{modal}</div>
          </Draggable>
        )}
      >
        <ImportForm onLoad={onLoadData}></ImportForm>
      </Modal>
    </GridContent>
  );
};

export default StatEngine;
