import { Drawer } from 'antd';
import React, { useState, useRef, useEffect } from 'react';
import { useIntl, FormattedMessage } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import type { ProColumns, ActionType } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import type { ProDescriptionsItemProps } from '@ant-design/pro-descriptions';
import ProDescriptions from '@ant-design/pro-descriptions';
import { getTasks } from '../../services/StatEngine';
import type { SortOrder } from 'antd/es/table/interface';
import { StatEngineAPI as API } from '../../services/typings';
import { useHistory } from 'react-router-dom';
import { ChartResult } from '@/pages/StatEngine/components/ChartList/data';
import './index.less';

type PageParams = {
  current?: number | undefined;
  pageSize?: number | undefined;
};

export type HistoryTableProps = {
  onClickItem?: (chart: string, result?: ChartResult, task?: API.TaskListItem) => void;
  pluginName?: string;
  forceUpdateKey?: string;
};

const TableList: React.FC<HistoryTableProps> = (props) => {
  const { onClickItem, pluginName, forceUpdateKey } = props;

  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [, setForceUpdate] = useState<string>();

  useEffect(() => {
    setForceUpdate('');
  }, [forceUpdateKey])

  const history = useHistory();
  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.TaskListItem>();
  // const [selectedRowsState, setSelectedRows] = useState<API.TaskListItem[]>([]);

  const listTasks = (
    params: PageParams,
    sort: Record<string, SortOrder>,
    filter: Record<string, React.ReactText[] | null>,
  ) => {
    const queryParams = {
      page: params.current,
      pape_size: params.pageSize,
    }

    if (pluginName) {
      queryParams['plugin_name'] = pluginName
    }

    return(getTasks(queryParams))
  }

  /**
   * @en-US International configuration
   * @zh-CN 国际化配置
   * */
  const intl = useIntl();

  const columns: ProColumns<API.TaskListItem>[] = [
    {
      title: <FormattedMessage id="stat-engine.history-table.id" defaultMessage="Task ID" />,
      dataIndex: 'id',
      tip: 'The task id is the unique key',
      hideInTable: false,
      hideInSearch: true,
      hideInForm: true,
      render: (dom, entity) => {
        return (
          <a
            onClick={() => {
              if (onClickItem) {
                onClickItem(entity.plugin_name, entity.response, entity)
              }
            }}
          >
            {dom}
          </a>
        );
      },
    },
    {
      title: <FormattedMessage id="stat-engine.history-table.taskName" defaultMessage="Task Name" />,
      dataIndex: 'name',
      hideInSearch: true,
      hideInForm: true,
      tip: 'The task name is the unique key',
      render: (dom, entity) => {
        return (
          <a
            onClick={() => {
              setCurrentRow(entity);
              setShowDetail(true);
            }}
          >
            {dom}
          </a>
        );
      },
    },
    {
      title: <FormattedMessage id="stat-engine.history-table.pluginName" defaultMessage="Chart Name" />,
      dataIndex: 'plugin_name',
      valueType: 'text',
    },
    {
      title: <FormattedMessage id="stat-engine.history-table.pluginVersion" defaultMessage="Version" />,
      dataIndex: 'plugin_version',
      hideInSearch: true,
      hideInForm: true,
      valueType: 'text',
    },
    {
      title: <FormattedMessage id="stat-engine.history-table.percentage" defaultMessage="Percentage" />,
      dataIndex: 'percentage',
      hideInSearch: true,
      hideInForm: true,
      hideInTable: true,
      hideInSetting: true,
      valueType: 'progress',
    },
    {
      title: <FormattedMessage id="stat-engine.history-table.status" defaultMessage="Status" />,
      dataIndex: 'status',
      hideInForm: true,
      valueEnum: {
        Started: {
          text: <FormattedMessage id="stat-engine.history-table.started" defaultMessage="Started" />,
          status: 'Processing',
        },
        Finished: {
          text: <FormattedMessage id="stat-engine.history-table.finished" defaultMessage="Finished" />,
          status: 'Success',
        },
        Failed: {
          text: <FormattedMessage id="stat-engine.history-table.failed" defaultMessage="Failed" />,
          status: 'Error',
        },
      },
    },
    {
      title: <FormattedMessage id="stat-engine.history-table.startedAt" defaultMessage="Started" />,
      // sorter: true,
      dataIndex: 'started_time',
      hideInSearch: true,
      valueType: 'dateTime',
      renderFormItem: (item, { defaultRender, ...rest }, form) => {
        return defaultRender(item);
      },
    },
    {
      title: <FormattedMessage id="stat-engine.history-table.finishedAt" defaultMessage="Finished" />,
      // sorter: true,
      hideInSearch: true,
      dataIndex: 'finished_time',
      valueType: 'dateTime',
      renderFormItem: (item, { defaultRender, ...rest }, form) => {
        return defaultRender(item);
      },
    },
    {
      title: <FormattedMessage id="stat-engine.history-table.payload" defaultMessage="Payload" />,
      dataIndex: 'payload',
      hideInSearch: true,
      hideInForm: true,
      hideInTable: true,
      hideInSetting: true,
      valueType: 'jsonCode',
      renderText: (text, record, index, action) => {
        return JSON.stringify(text);
      },
      colSpan: 2,
    },
  ];

  return (
    <PageContainer className="history-table-page-container">
      <ProTable<API.TaskListItem, API.PageParams>
        className="history-table"
        headerTitle={intl.formatMessage({
          id: 'stat-engine.history-table.title',
          defaultMessage: 'Task History',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => []}
        request={listTasks}
        columns={columns}
        // rowSelection={{
        //   onChange: (_, selectedRows) => {
        //     setSelectedRows(selectedRows);
        //   },
        // }}
      />

      <Drawer
        width={'50%'}
        visible={showDetail}
        className="task-details"
        onClose={() => {
          setCurrentRow(undefined);
          setShowDetail(false);
        }}
        closable={false}
      >
        {currentRow?.name && (
          <ProDescriptions<API.TaskListItem>
            column={1}
            title={currentRow?.name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.name,
            }}
            columns={columns as ProDescriptionsItemProps<API.TaskListItem>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default TableList;
