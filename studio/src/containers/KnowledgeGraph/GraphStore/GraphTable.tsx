import React from 'react';
import { Space, Table, Modal, Button } from 'antd';
import type { Graph } from './typings';
import type { ColumnsType } from 'antd/es/table';
import './GraphTable.less';

type GraphTableProps = {
  graphs: Graph[];
  visible: boolean;
  onLoad: (graph: Graph) => void;
  onDelete: (graph: Graph) => void;
  onClose: () => void;
  parent?: HTMLElement;
};

const GraphTable: React.FC<GraphTableProps> = (props) => {
  const columns: ColumnsType<Graph> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      width: 150,
    },
    {
      title: 'Desc',
      dataIndex: 'description',
      key: 'description',
      align: 'center',
    },
    {
      title: 'Created At',
      dataIndex: 'created_time',
      key: 'created_time',
      align: 'center',
      render: (created_time) => new Date(created_time).toLocaleString(),
      width: 200
    },
    {
      title: 'Instance Version',
      key: 'version',
      align: 'center',
      dataIndex: 'version',
      width: 150
    },
    {
      title: 'DB Version',
      key: 'db_version',
      align: 'center',
      dataIndex: 'db_version',
      width: 150
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={(e) => props.onLoad(record)}>
            Load
          </Button>
          <Button type="link" danger onClick={(e) => props.onDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return <Modal className='graph-table' title={null} open={props.visible}
    footer={null} width={1000} closable={true} onCancel={props.onClose}
    getContainer={props.parent ? props.parent : document.body}>
    <Table columns={columns} dataSource={props.graphs} pagination={false} scroll={{ y: 500, x: 900 }} />
  </Modal>
}

export default GraphTable;