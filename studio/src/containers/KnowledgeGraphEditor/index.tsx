import React from 'react';
import { Row, Col, Tabs, Empty } from 'antd';
import GraphForm from './GraphForm';
import GraphTable from './GraphTable';
import type { GraphEdge, GraphTableData } from './typings';
import { TableOutlined, BulbOutlined } from '@ant-design/icons';
import { getKnowledges, postKnowledges } from '@/services/swagger/Graph';

import './index.less';

const span = 8;

const KnowledgeGraphEditor: React.FC = () => {
  const [refreshKey, setRefreshKey] = React.useState<number>(0);

  const onSubmitKnowledge = (data: GraphEdge): Promise<GraphEdge> => {
    console.log("Submit knowledge: ", data);
    return new Promise((resolve, reject) => {
      postKnowledges(data).then(response => {
        console.log("Post knowledge: ", response);
        setRefreshKey(refreshKey + 1);
        resolve(response);
      }).catch(error => {
        console.log("Post knowledge error: ", error);
        setRefreshKey(refreshKey + 1);
        reject(error);
      })
    })
  }

  const getKnowledgesData = (page: number, pageSize: number): Promise<GraphTableData> => {
    return new Promise((resolve, reject) => {
      getKnowledges({
        page: page,
        page_size: pageSize
      }).then(response => {
        console.log("Get knowledges: ", response);
        resolve({
          data: response.data,
          total: response.total,
          page: page,
          pageSize: pageSize
        });
      }).catch(error => {
        console.log("Get knowledges error: ", error);
        reject(error);
      })
    })
  }

  const items = [
    {
      key: 'table-viewer',
      label: <span><TableOutlined />Table Viewer</span>,
      children: <GraphTable key={refreshKey} getTableData={getKnowledgesData} />
    },
    {
      key: 'graph-viewer',
      label: <span><BulbOutlined />Graph Viewer</span>,
      children: <Empty />,
      disabled: true
    }
  ]

  return <Row gutter={8} className="knowledge-graph-editor">
    <Col xxl={span} xl={span} lg={span} md={24} sm={24} xs={24} className='form'>
      <GraphForm onSubmit={onSubmitKnowledge} />
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
