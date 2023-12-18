import React, { useEffect, useState } from 'react';
import { Layout, Menu, Form, Input, InputNumber, Button, Select, Empty, Col, Row, Tooltip, message, Spin } from 'antd';
import { DotChartOutlined, DribbbleOutlined, AimOutlined, BranchesOutlined } from '@ant-design/icons';
const { Header, Sider } = Layout;
import GraphTable from 'biominer-components/dist/esm/components/KnowledgeGraph/Components/GraphTable';
import { makeDataSources } from 'biominer-components/dist/esm/components/KnowledgeGraph/utils';
import { APIs, GraphData, COMPOSED_ENTITY_DELIMITER } from 'biominer-components/dist/esm/components/typings';
import { fetchNodes } from 'biominer-components/dist/esm/components/utils';
import { fetchEntities, fetchSimilarityNodes } from '@/services/swagger/KnowledgeGraph';
import { EdgeAttribute } from 'biominer-components/dist/esm/components/EdgeTable/index.t';

import './index.less';
import { NodeAttribute } from 'biominer-components/dist/esm/components/NodeTable/index.t';

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
  name: string;
  icon: React.ReactNode;
  description: string;
  parameters: ModelParameter[];
  handler?: (params: any) => Promise<GraphData>;
  disabled?: boolean;
}

const ModelConfig: React.FC = (props) => {
  const leftSpan = 6;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState(0);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [edgeDataSources, setEdgeDataSources] = useState<EdgeAttribute[]>([]);
  const [nodeDataSources, setNodeDataSources] = useState<NodeAttribute[]>([]);

  useEffect(() => {
    if (graphData && graphData.edges) {
      setEdgeDataSources(makeDataSources(graphData.edges));
    }

    if (graphData && graphData.nodes) {
      setNodeDataSources(makeDataSources(graphData.nodes));
    }
  }, [graphData]);

  const [models, setModels] = useState<ModelItem[]>([{
    name: 'Similar Diseases',
    icon: <DotChartOutlined />,
    description: 'To find TopK similar diseases with a given disease',
    parameters: [{
      key: 'entity_id',
      name: 'Disease',
      type: 'NodeIdSearcher',
      description: 'Enter a name of disease for which you want to find similar diseases',
      required: true,
      entityType: 'Disease'
    }, {
      key: 'similarity',
      name: 'Similarity',
      type: 'number',
      description: 'Similarity threshold',
      defaultValue: 0.5,
      required: false
    }, {
      key: 'topk',
      name: 'TopK',
      type: 'number',
      description: 'Number of results to return',
      defaultValue: 10,
      required: false
    }],
    handler: (param: any) => {
      const query = {
        operator: 'in',
        value: ["Disease"],
        field: 'entity_type',
      };

      let params: any = {
        node_id: `${param.entity_type}${COMPOSED_ENTITY_DELIMITER}${param.entity_id}`,
        topk: param.topk || 10,
      };

      if (query) {
        params['query_str'] = JSON.stringify(query);
      }

      return new Promise((resolve, reject) => {
        fetchSimilarityNodes(params).then((data) => {
          console.log('Similar Diseases: ', data);
          resolve(data);
        }).catch((error) => {
          console.log('Similar Diseases Error: ', error);
          reject({ nodes: [], edges: [], error: error })
        });
      });
    }
  }, {
    name: 'Predicted Drugs',
    icon: < DribbbleOutlined />,
    description: 'To predict drugs which are on the market or in clinical trials',
    parameters: [{
      key: 'entity_id',
      name: 'Disease',
      type: 'NodeIdSearcher',
      description: 'Enter a name of disease for which you want to find drugs',
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
    disabled: true
  }, {
    name: 'Predicted Targets',
    icon: <AimOutlined />,
    description: 'To predict targets for a given disease',
    parameters: [{
      key: 'entity_id',
      name: 'Disease',
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
    disabled: true
  }, {
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
    setCurrentModel(e.key);
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
          model.handler(updatedValues).then((data) => {
            console.log('ModelConfig - onConfirm - handler: ', data);
            setGraphData(data);
          }).catch((error) => {
            console.log('ModelConfig - onConfirm - handler - Error: ', error);
            message.error("Cannot get the result. Please check your input or try again later.")
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
    <Layout className='model-panel'>
      <Sider width={80}>
        <Menu mode="inline" defaultSelectedKeys={['0']} style={{ height: '100%' }} onClick={handleMenuClick}>
          {models.map((model, index) => (
            <Menu.Item key={index} icon={null} disabled={model.disabled}>
              <Tooltip title={`${model.disabled ? 'Disabled' : ''} > ${model.name} | ${model.description}`} placement="right" key={index}>
                <Button icon={model.icon} shape='circle' size='large' style={{ color: detectColor(model.name) }}></Button>
              </Tooltip>
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
          <GraphTable edgeDataSources={edgeDataSources} nodeDataSources={nodeDataSources} />
        </Col>
      </Row>
    </Layout >
  );
};

export default ModelConfig;
