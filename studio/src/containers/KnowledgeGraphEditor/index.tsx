import { Row, Col, Tabs } from 'antd';
import GraphForm from './GraphForm';
import GraphTable from './GraphTable';
import { useEffect, useState } from 'react';
import './index.less';
import { TableOutlined, BulbOutlined } from '@ant-design/icons';

const span = 8;

const KnowledgeGraphEditor: React.FC = () => {
  const items = [
    {
      key: 'table-viewer',
      label: <span><TableOutlined />Table Viewer</span>,
      children: <GraphTable />
    },
    {
      key: 'graph-viewer',
      label: <span><BulbOutlined />Graph Viewer</span>,
      children: <GraphTable />
    }
  ]

  return <Row gutter={8} className="knowledge-graph-editor">
    <Col xxl={span} xl={span} lg={span} md={24} sm={24} xs={24} className='form'>
      <GraphForm />
    </Col>
    <Col xxl={24 - span} xl={24 - span} lg={24 - span} md={24} sm={24} xs={24} className='table'>
      <h3 className='title'>History Table</h3>
      <Tabs
        size='small'
        defaultActiveKey="table-viewer"
        items={items}
      />
    </Col>
  </Row>;
}

export default KnowledgeGraphEditor;
