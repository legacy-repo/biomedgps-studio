import React from 'react';
import { Space, Table, Tag, Row } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { GraphEdge } from './typings';

import './GraphTable.less';

const columns: ColumnsType<GraphEdge> = [
  {
    title: 'Source Name',
    dataIndex: 'source_name',
    key: 'source_name',
    render: (text) => <a>{text}</a>,
  },
  {
    title: 'Source ID',
    dataIndex: 'source_id',
    key: 'source_id',
  },
  {
    title: 'Source Type',
    dataIndex: 'source_type',
    key: 'source_type',
  },
  {
    title: 'Target Name',
    dataIndex: 'target_name',
    key: 'target_name',
  },
  {
    title: 'Target ID',
    dataIndex: 'target_id',
    key: 'target_id',
  },
  {
    title: 'Target Type',
    dataIndex: 'target_type',
    key: 'target_type',
  },
  {
    title: 'Relation Type',
    key: 'relation_type',
    dataIndex: 'relation_type',
  }
];

const data: GraphEdge[] = [
  {
    source_name: 'John Brown',
    source_id: '32',
    source_type: 'New York No. 1 Lake Park',
    target_name: 'John Brown',
    target_id: '32',
    target_type: 'New York No. 1 Lake Park',
    relation_type: 'relation_type',
    key_sentence: 'key_sentence',
  },
];

const GraphTable: React.FC = () => {
  return <Row className='graph-table-container'>
    <Table size='small' className='graph-table' columns={columns}
      dataSource={data} expandable={{
        expandedRowRender: (record) => <p style={{ margin: 0 }}>
          {record.key_sentence || 'No Key Sentence'}
        </p>
      }} rowKey={(record) => `${record.source_id}-${record.target_id}`}>
    </Table>
  </Row >
}

export default GraphTable;
