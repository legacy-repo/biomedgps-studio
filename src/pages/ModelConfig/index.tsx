import React, { useEffect, useState } from 'react';
import { Layout, Menu, Form, Input, InputNumber, Button, Select, Empty, Col, Row, Tooltip, message, Spin } from 'antd';
import { DotChartOutlined, DribbbleOutlined, AimOutlined, BranchesOutlined, BugOutlined, ZoomInOutlined } from '@ant-design/icons';
import { history } from 'umi';
// import { createFromIconfontCN } from '@ant-design/icons';
import { useAuth0 } from "@auth0/auth0-react";
import { GraphTable } from 'biominer-components';
import { makeDataSources, pushGraphDataToLocalStorage } from 'biominer-components/dist/esm/components/KnowledgeGraph/utils';
import { APIs, GraphData, COMPOSED_ENTITY_DELIMITER } from 'biominer-components/dist/esm/components/typings';
import { fetchNodes } from 'biominer-components/dist/esm/components/utils';
import { fetchEntities, fetchPredictedNodes } from '@/services/swagger/KnowledgeGraph';
import { EdgeAttribute } from 'biominer-components/dist/esm/components/EdgeTable/index.t';
import { NodeAttribute } from 'biominer-components/dist/esm/components/NodeTable/index.t';
import { sortBy } from 'lodash';

import './index.less';

const { Header, Sider } = Layout;

// const IconFont = createFromIconfontCN({
//   scriptUrl: '//at.alicdn.com/t/c/font_3865804_no8ogbfj0q.js',
// });

type NodeIdSearcherProps = {
  placeholder?: string;
  entityType: string;
  handleSearchNode?: (entityType: string, value: string) => void;
  getEntities: APIs['GetEntitiesFn'];
  onSelect?: (value: string) => void;
}

const NodeIdSearcher = (props: NodeIdSearcherProps) => {
  const [entityOptions, setEntityOptions] = useState(undefined);
  const [loading, setLoading] = useState(false);

  const handleSearchNode = function (entityType: string, value: string) {
    if (value) {
      setLoading(true);
      fetchNodes(props.getEntities, entityType, value, (options) => {
        setEntityOptions(options);
        setLoading(false);
      });
    } else {
      setEntityOptions(undefined);
    }
  };

  return <Select
    showSearch
    allowClear
    defaultActiveFirstOption={false}
    loading={loading}
    showArrow={true}
    placeholder={props.placeholder}
    onChange={(value) => { props.onSelect && props.onSelect(value) }}
    onSearch={(value) => handleSearchNode(props.entityType, value)}
    getPopupContainer={(triggerNode: HTMLElement) => {
      return triggerNode.parentNode as HTMLElement;
    }}
    options={entityOptions}
    filterOption={false}
    notFoundContent={
      <Empty
        description={
          loading
            ? 'Searching...'
            : entityOptions !== undefined
              ? 'Not Found or Too Short Input'
              : props.entityType === undefined
                ? 'Please select a node type first.'
                : `Enter your interested ${props.entityType} ...`
        }
      />
    }
  ></Select>;
}

type ModelParameter = {
  key: string;
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: any;
  entityType?: string;
}

type ModelItem = {
  shortName: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  parameters: ModelParameter[];
  handler?: (params: any) => Promise<{
    params: any;
    data: GraphData;
  }>;
  disabled?: boolean;
}

const ModelConfig: React.FC = (props) => {
  const leftSpan = 6;
  const [form] = Form.useForm();
  const { isAuthenticated } = useAuth0();
  const [loading, setLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState(0);
  const [params, setParams] = useState({});
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [edgeDataSources, setEdgeDataSources] = useState<EdgeAttribute[]>([]);
  const [nodeDataSources, setNodeDataSources] = useState<NodeAttribute[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      history.push('/not-authorized');
    }
  }, [isAuthenticated])

  const formatScore = (score: number) => {
    // Keep 3 decimal places
    return score.toFixed(3);
  }

  useEffect(() => {
    if (graphData && graphData.edges) {
      const data = makeDataSources(graphData.edges).map((edge) => {
        return {
          ...edge,
          score: formatScore(edge.score)
        }
      });
      setEdgeDataSources(sortBy(data, ['score']).reverse());
    }

    if (graphData && graphData.nodes) {
      setNodeDataSources(makeDataSources(graphData.nodes));
    }
  }, [graphData]);

  useEffect(() => {
    cleanup();
  }, [currentModel]);

  const cleanup = () => {
    form.resetFields();
    setParams({});
    setGraphData({ nodes: [], edges: [] });
    setEdgeDataSources([]);
    setNodeDataSources([]);
  }

  const [models, setModels] = useState<ModelItem[]>([{
    shortName: 'SimDises',
    name: 'Similar Diseases',
    icon: <DotChartOutlined />,
    description: 'To find TopK similar diseases with a given disease',
    parameters: [{
      key: 'entity_id',
      name: 'Disease Name',
      type: 'NodeIdSearcher',
      description: 'Enter a name of disease for which you want to find similar diseases',
      required: true,
      entityType: 'Disease'
    },
    // {
    //   key: 'similarity_score_threshold',
    //   name: 'Similarity',
    //   type: 'number',
    //   description: 'Similarity threshold',
    //   defaultValue: 0.5,
    //   required: false
    // },
    {
      key: 'topk',
      name: 'TopK',
      type: 'number',
      description: 'Number of results to return',
      defaultValue: 10,
      required: false
    }],
    handler: (param: any) => {
      // const query = {
      //   operator: 'in',
      //   value: ["Disease"],
      //   field: 'entity_type',
      // };

      // TODO: Need to update the relation_type automatically
      const relation_type = 'Hetionet::DrD::Disease:Disease';

      let params: any = {
        node_id: `${param.entity_type}${COMPOSED_ENTITY_DELIMITER}${param.entity_id}`,
        relation_type: relation_type,
        topk: param.topk || 10,
      };

      // TODO: Do we need to add a query string?
      // if (query) {
      //   params['query_str'] = JSON.stringify(query);
      // }

      // TODO: How to use similarity_score_threshold?

      return new Promise((resolve, reject) => {
        fetchPredictedNodes(params).then((data) => {
          console.log('Similar Diseases: ', params, data);
          resolve({
            params,
            data
          });
        }).catch((error) => {
          console.log('Similar Diseases Error: ', error);
          reject({ nodes: [], edges: [], error: error })
        });
      });
    }
  },
  {
    shortName: 'Drg4Dises',
    name: 'Predicted Drugs',
    icon: < DribbbleOutlined />,
    description: 'To predict drugs which are on the market or in clinical trials for a given disease.',
    parameters: [{
      key: 'entity_id',
      name: 'Disease Name',
      type: 'NodeIdSearcher',
      description: 'Enter a name of disease for which you want to find drugs',
      required: true,
      entityType: 'Disease'
    },
    // {
    //   key: 'score_threshold',
    //   name: 'Score',
    //   type: 'number',
    //   description: 'Score threshold',
    //   required: false,
    //   defaultValue: 0.5
    // },
    {
      key: 'topk',
      name: 'TopK',
      type: 'number',
      description: 'Number of results to return',
      required: false,
      defaultValue: 10
    }],
    handler: (param: any) => {
      // TODO: Need to update the relation_type automatically
      const relation_type = 'DRUGBANK::treats::Compound:Disease';

      let params: any = {
        node_id: `${param.entity_type}${COMPOSED_ENTITY_DELIMITER}${param.entity_id}`,
        relation_type: relation_type,
        topk: param.topk || 10,
      };

      // TODO: Do we need to add a query string?
      // if (query) {
      //   params['query_str'] = JSON.stringify(query);
      // }

      // TODO: How to use similarity_score_threshold?

      return new Promise((resolve, reject) => {
        fetchPredictedNodes(params).then((data) => {
          console.log('Predicted Drugs: ', params, data);
          resolve({
            params,
            data
          });
        }).catch((error) => {
          console.log('Predicted Drugs Error: ', error);
          reject({ nodes: [], edges: [], error: error })
        });
      });
    }
  },
  {
    shortName: 'Tgt4Dises',
    name: 'Predicted Targets for Diseases',
    icon: <AimOutlined />,
    description: 'To predict targets for a given disease, which means the genes might play a role in the pathogenesis of the disease',
    parameters: [{
      key: 'entity_id',
      name: 'Disease Name',
      type: 'NodeIdSearcher',
      description: 'Enter a name of disease for which you want to find targets',
      required: true,
      entityType: 'Disease'
    }, {
      key: 'topk',
      name: 'TopK',
      type: 'number',
      description: 'Number of results to return',
      required: false,
      defaultValue: 10
    }],
    handler: (param: any) => {
      // TODO: Need to update the relation_type automatically
      const relation_type = 'GNBR::J::Gene:Disease';

      let params: any = {
        node_id: `${param.entity_type}${COMPOSED_ENTITY_DELIMITER}${param.entity_id}`,
        relation_type: relation_type,
        topk: param.topk || 10,
      };

      // TODO: Do we need to add a query string?
      // if (query) {
      //   params['query_str'] = JSON.stringify(query);
      // }

      // TODO: How to use similarity_score_threshold?

      return new Promise((resolve, reject) => {
        fetchPredictedNodes(params).then((data) => {
          console.log('Predicted Targets: ', params, data);
          resolve({
            params,
            data
          });
        }).catch((error) => {
          console.log('Predicted Targets Error: ', error);
          reject({ nodes: [], edges: [], error: error })
        });
      });
    }
  },
  {
    shortName: 'SimDrgs',
    name: 'Predicted Similar Drugs',
    icon: <DotChartOutlined />,
    description: 'To predict similar drugs for a given drug',
    parameters: [{
      key: 'entity_id',
      name: 'Drug Name',
      type: 'NodeIdSearcher',
      description: 'Enter a name of drug for which you want to find similar drugs',
      required: true,
      entityType: 'Compound'
    },
    // {
    //   key: 'score_threshold',
    //   name: 'Score',
    //   type: 'number',
    //   description: 'Score threshold',
    //   required: false,
    //   defaultValue: 0.5
    // },
    {
      key: 'topk',
      name: 'TopK',
      type: 'number',
      description: 'Number of results to return',
      required: false,
      defaultValue: 10
    }],
    handler: (param: any) => {
      // TODO: Need to update the relation_type automatically
      const relation_type = 'Hetionet::CrC::Compound:Compound';

      let params: any = {
        node_id: `${param.entity_type}${COMPOSED_ENTITY_DELIMITER}${param.entity_id}`,
        relation_type: relation_type,
        topk: param.topk || 10,
      };

      // TODO: Do we need to add a query string?
      // if (query) {
      //   params['query_str'] = JSON.stringify(query);
      // }

      // TODO: How to use similarity_score_threshold?

      return new Promise((resolve, reject) => {
        fetchPredictedNodes(params).then((data) => {
          console.log('Predicted Drugs: ', params, data);
          resolve({
            params,
            data
          });
        }).catch((error) => {
          console.log('Predicted Drugs Error: ', error);
          reject({ nodes: [], edges: [], error: error })
        });
      });
    }
  },
  {
    shortName: 'Ind4Drgs',
    name: 'Predicted Indications',
    icon: <BugOutlined />,
    description: 'To predict indications for a given drug',
    parameters: [{
      key: 'entity_id',
      name: 'Drug Name',
      type: 'NodeIdSearcher',
      description: 'Enter a name of drug for which you want to find indications',
      required: true,
      entityType: 'Compound'
    },
    // {
    //   key: 'score_threshold',
    //   name: 'Score',
    //   type: 'number',
    //   description: 'Score threshold',
    //   required: false,
    //   defaultValue: 0.5
    // },
    {
      key: 'topk',
      name: 'TopK',
      type: 'number',
      description: 'Number of results to return',
      required: false,
      defaultValue: 10
    }],
    handler: (param: any) => {
      // TODO: Need to update the relation_type automatically
      const relation_type = 'DRUGBANK::treats::Compound:Disease';

      let params: any = {
        node_id: `${param.entity_type}${COMPOSED_ENTITY_DELIMITER}${param.entity_id}`,
        relation_type: relation_type,
        topk: param.topk || 10,
      };

      // TODO: Do we need to add a query string?
      // if (query) {
      //   params['query_str'] = JSON.stringify(query);
      // }

      // TODO: How to use similarity_score_threshold?

      return new Promise((resolve, reject) => {
        fetchPredictedNodes(params).then((data) => {
          console.log('Predicted Indications: ', params, data);
          resolve({
            params,
            data
          });
        }).catch((error) => {
          console.log('Predicted Indications Error: ', error);
          reject({ nodes: [], edges: [], error: error })
        });
      });
    }
  },
  {
    shortName: 'Tgt4Drgs',
    name: 'Predicted Targets for Drugs',
    icon: <ZoomInOutlined />,
    description: 'To predict targets for a given drug, which means the genes might be affected by the drug.',
    parameters: [{
      key: 'entity_id',
      name: 'Drug Name',
      type: 'NodeIdSearcher',
      description: 'Enter a name of drug for which you want to find targets',
      required: true,
      entityType: 'Compound'
    }, {
      key: 'topk',
      name: 'TopK',
      type: 'number',
      description: 'Number of results to return',
      required: false,
      defaultValue: 10
    }],
    handler: (param: any) => {
      // TODO: Need to update the relation_type automatically
      const relation_type = 'DRUGBANK::target::Compound:Gene';

      let params: any = {
        node_id: `${param.entity_type}${COMPOSED_ENTITY_DELIMITER}${param.entity_id}`,
        relation_type: relation_type,
        topk: param.topk || 10,
      };

      // TODO: Do we need to add a query string?
      // if (query) {
      //   params['query_str'] = JSON.stringify(query);
      // }

      // TODO: How to use similarity_score_threshold?

      return new Promise((resolve, reject) => {
        fetchPredictedNodes(params).then((data) => {
          console.log('Predicted Targets: ', params, data);
          resolve({
            params,
            data
          });
        }).catch((error) => {
          console.log('Predicted Targets Error: ', error);
          reject({ nodes: [], edges: [], error: error })
        });
      });
    }
  },
  {
    shortName: 'MOA',
    name: 'Predicted MOAs',
    icon: <BranchesOutlined />,
    description: 'To predict MOAs for a given drug and disease',
    parameters: [{
      key: 'entity_id',
      name: 'Disease',
      type: 'NodeIdSearcher',
      description: 'Enter a name of disease for which you want to find mode of actions',
      required: true,
      entityType: 'Disease'
    }, {
      key: 'entity_id',
      name: 'Drug',
      type: 'NodeIdSearcher',
      description: 'Enter a name of drug for which you want to find mode of actions',
      required: true,
      entityType: 'Drug'
    }, {
      key: 'topk',
      name: 'TopK',
      type: 'number',
      description: 'Number of results to return',
      required: false,
      defaultValue: 10
    }],
    disabled: true
  }])

  const handleMenuClick = (e: any) => {
    console.log('handleMenuClick: ', e);
    if (models[e.key]) {
      setCurrentModel(e.key);
    }
  };

  const detectComponent = (item: ModelParameter, onChange: (value: any) => void): React.ReactNode => {
    if (item.type === 'NodeIdSearcher') {
      return <NodeIdSearcher
        placeholder={item.description}
        entityType={item.entityType || 'Disease'}
        onSelect={(value) => {
          onChange(value);
        }}
        handleSearchNode={(entityType, value) => console.log(entityType, value)}
        getEntities={fetchEntities}
      />
    } else if (item.type === 'number') {
      return <InputNumber
        style={{ width: '100%' }}
        onChange={(value) => onChange(value)}
        placeholder={item.description}
        min={1}
        max={500}
      />
    } else {
      return <Input
        style={{ width: '100%' }}
        onChange={(event) => onChange(event.target.value)}
        placeholder={item.description}
      />
    }
  }

  const renderForm = () => {
    const parameters = models[currentModel].parameters;
    const entityIdIndex = parameters.findIndex((param) => param.key === 'entity_id');

    const formItems = models[currentModel].parameters.map((param, index) => {
      return (
        <Form.Item
          key={index}
          label={param.name}
          initialValue={param.defaultValue || undefined}
          name={param.key}
          required={param.required}
          tooltip={param.description}
          rules={[{ required: param.required, message: `${param.description}` }]}
        >
          {detectComponent(param, (value) => {
            form.setFieldValue(param.key, value);
            if (param.entityType) {
              form.setFieldValue('entity_type', param.entityType);
            }
            console.log("onSelect: ", param.key, value, form.getFieldsValue(), form.getFieldValue('entity_type'));
          })}
        </Form.Item>
      );
    });

    if (entityIdIndex !== -1) {
      const param = parameters[entityIdIndex];
      // Add entity type field into the formItems array where the position is entityIdIndex + 1
      formItems.splice(entityIdIndex, 0, <Form.Item
        key='entity_type'
        label='Which Type'
        hidden={true}
        initialValue={param.entityType || 'Disease'}
        name='entity_type'
        required={param.required}
        tooltip="The type of entity you want to search for."
      >
        <Input disabled value={param.entityType} />
      </Form.Item>);
    }

    return formItems;
  };

  // Placeholder function for submitting the form
  const handleSubmit = () => {
    setLoading(true);
    form
      .validateFields()
      .then((values) => {
        const updatedValues = form.getFieldsValue();
        console.log('ModelConfig - onConfirm: ', values, updatedValues);

        const model = models[currentModel];
        if (model && model.handler) {
          model.handler(updatedValues).then((resp) => {
            const { params, data } = resp;
            console.log('ModelConfig - onConfirm - handler: ', params, data);
            setParams(params);
            setGraphData(data);
          }).catch((error) => {
            console.log('ModelConfig - onConfirm - handler - Error: ', error);
            message.warn("Cannot find any result for the given parameters.")
            setParams({});
            setGraphData(error);
          }).finally(() => {
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.log('onConfirm Error: ', error);
        setLoading(false);
      });
  };

  const detectColor = (modelName: string) => {
    if (modelName === models[currentModel].name) {
      return '#000000d9';
    } else {
      return '#999';
    }
  }

  return (
    <Layout className='model-panel' key={currentModel}>
      <Sider width={100}>
        <Menu mode="inline" defaultSelectedKeys={['0']} style={{ height: '100%' }} onClick={handleMenuClick} selectedKeys={[currentModel.toString()]}>
          {models.map((model, index) => (
            <Menu.Item key={index} icon={null} disabled={model.disabled}>
              <Tooltip title={`${model.disabled ? 'Disabled' : ''} > ${model.name} | ${model.description}`} placement="right" key={index}>
                <Button icon={model.icon} shape='circle' size='large' style={{ color: detectColor(model.name) }}></Button>
              </Tooltip>
              <span>{model.shortName}</span>
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
      <Row className='model-config-panel' gutter={16}>
        <Col className="model-parameter" span={leftSpan}>
          <Header className="model-parameter-header">
            <h3>{models[currentModel].name}</h3>
            <p>{models[currentModel].description}</p>
          </Header>
          <Form layout="vertical" onFinish={handleSubmit} className='model-parameter-body' form={form}>
            {renderForm()}
            <Button type="primary" htmlType="submit" className='model-parameter-button'
              size='large' loading={loading}>
              Apply Parameters
            </Button>
          </Form>
        </Col>
        <Col className="model-result" span={24 - leftSpan}>
          {loading ?
            <Empty description='Predicting using the given parameters...'
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
              <Spin size="large" />
            </Empty> :
            <GraphTable edgeDataSources={edgeDataSources} nodeDataSources={nodeDataSources} key={JSON.stringify(params)}
              emptyMessage='Please setup related parameters in the left side and generate some predicted result first.'
              onLoadGraph={(graph) => {
                console.log('onLoadGraph: ', graph);
                if (graph && graph.nodes && graph.nodes.length > 0) {
                  pushGraphDataToLocalStorage(graph);
                  history.push('/knowledge-graph');
                }
              }}
            />
          }
        </Col>
      </Row>
    </Layout>
  );
};

export default ModelConfig;
