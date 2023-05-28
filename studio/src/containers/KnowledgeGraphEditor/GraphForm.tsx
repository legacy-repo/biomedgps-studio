import React, { useState, useEffect } from 'react';
import { Button, Form, Select, message, Empty, Input, Row } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { getNodeTypes, getLabels, getRelationships } from '@/services/swagger/Graph';
import { makeQueryStr } from './utils';
import { GraphEdge, OptionType } from './typings';

import './GraphForm.less';

let timeout: ReturnType<typeof setTimeout> | null;

type GraphFormProps = {
  onSubmit?: (data: GraphEdge) => void;
  onClose?: () => void;
};

const helpDoc = () => {
  return <>
    <span>Notice:</span>
    <br />
    <span>1. Select the source node type and target node type.</span>
    <br />
    <span>2. Select the source node and target node.</span>
    <br />
    <span>3. Select the relationship type.</span>
    <br />
    <span>4. Input the key sentence.</span>
  </>
}

const GraphForm: React.FC<GraphFormProps> = (props) => {
  const [form] = Form.useForm();
  const sourceType = Form.useWatch('source_type', form);
  const targetType = Form.useWatch('target_type', form);

  const [labelOptions, setLabelOptions] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [placeholder, setPlaceholder] = useState<string>("Search nodes ...");

  const [nodeOptions, setNodeOptions] = useState<any[] | undefined>(undefined);

  useEffect(() => {
    getNodeTypes()
      .then(response => {
        console.log("Get types of nodes: ", response)
        let o: OptionType[] = []
        if (response.node_types) {
          response.node_types.forEach((element: string) => {
            o.push({
              order: 0,
              label: element,
              value: element
            })
          });
          setLabelOptions(o);
        } else {
          setLabelOptions([]);
        }
      })
      .catch(error => {
        console.log('requestNodes Error: ', error);
        message.error("Get types of nodes error, please refresh the page");
        setLabelOptions([]);
      });
  }, [])

  // This function is used to fetch the nodes of the selected label.
  // All the nodes will be added to the options as a dropdown list.
  const fetchNode = async (label_type: string, value: string, callback: (any: any) => void) => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }

    const fetchData = () => {
      setLoading(true)
      getLabels({
        query_str: makeQueryStr({ id: value, name: value }, {}, {}),
        label_type: label_type
      })
        .then((response) => {
          const { data } = response;
          const formatedData = data.map((item: any) => ({
            value: `${item['id']}`,
            text: `${item['id']} | ${item['name']}`,
          }));
          console.log("getLabels results: ", formatedData);
          // const options = formatedData.map(d => <Option key={d.value}>{d.text}</Option>);
          const options = formatedData.map(d => {
            return { label: d.text, value: d.value }
          })
          setLoading(false);
          callback(options);
        })
        .catch((error) => {
          console.log('requestNodes Error: ', error);
          callback([]);
          setLoading(false)
        });
    };

    timeout = setTimeout(fetchData, 300);
  };

  const handleSelectNodeType = function (value: string) {
    setNodeOptions(undefined);
    setPlaceholder(`Search ${value} nodes ...`);
  }

  const handleSearchNode = function (nodeType: string, value: string) {
    if (value) {
      fetchNode(nodeType, value, setNodeOptions);
    } else {
      setNodeOptions(undefined);
    }
  }

  const handleSelectNode = (fieldName: "source" | "target", value: string, option: any) => {
    console.log("handleSelectNode: ", value, option);
    const id = value;
    const type = option.label.replace(`${id} | `, "");

    console.log("handleSelectNodeType: ", fieldName, value, option);
    if (fieldName == "source") {
      form.setFieldsValue({ source_id: id });
      form.setFieldsValue({ source_name: type });
    } else if (fieldName == "target") {
      form.setFieldsValue({ target_id: id });
      form.setFieldsValue({ target_name: type });
    }
  }

  const onConfirm = () => {
    form.validateFields()
      .then(values => {
        console.log("onConfirm form values: ", values);
        if (props.onSubmit) {
          let payload = {
            ...values
          }

          props.onSubmit(payload);
        }
      })
      .catch(errorInfo => {
        message.error("Unknow error, please try later!")
        console.log("errorInfo: ", errorInfo);
      })
  }

  return (
    <Row className='graph-form-container'>
      <h3 className='title'>Graph Form</h3>
      <p className='graph-help'>{helpDoc()}</p>
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        form={form}
        className='graph-form'
        initialValues={{ remember: true }}
        autoComplete="off"
      >
        <Form.Item label="Source Node Type" name="source_type"
          rules={[{ required: true, message: 'Please select a node type.' }]}>
          <Select
            allowClear
            defaultActiveFirstOption={false}
            showArrow={true}
            placeholder="Please select a node type."
            options={labelOptions}
            filterOption={true}
            onSelect={handleSelectNodeType}
          />
        </Form.Item>

        <Form.Item label="Source Node ID" name="source_id"
          rules={[{ required: true, message: 'Please enter your expected node.' }]}>
          <Select
            showSearch
            allowClear
            loading={loading}
            defaultActiveFirstOption={false}
            showArrow={true}
            placeholder={placeholder}
            onSearch={(value) => handleSearchNode(sourceType, value)}
            options={nodeOptions}
            filterOption={false}
            onSelect={(value, options) => handleSelectNode("source", value, options)}
            notFoundContent={<Empty description={
              loading ? "Searching..." : (nodeOptions !== undefined ? "Not Found" : `Enter your interested ${sourceType} ...`)
            } />}
          >
          </Select>
        </Form.Item>

        <Form.Item label="Source Node Name" name="source_name" hidden
          rules={[{ required: true, message: 'Please enter your expected node.' }]}>
          <Input placeholder="Please enter the source node name" disabled />
        </Form.Item>

        <Form.Item label="Target Node Type" name="target_type"
          rules={[{ required: true, message: 'Please select a node type.' }]}>
          <Select
            allowClear
            defaultActiveFirstOption={false}
            showArrow={true}
            placeholder="Please select a node type."
            options={labelOptions}
            filterOption={true}
            onSelect={handleSelectNodeType}
          />
        </Form.Item>

        <Form.Item label="Target Node ID" name="target_id"
          rules={[{ required: true, message: 'Please enter your expected node.' }]}>
          <Select
            showSearch
            allowClear
            loading={loading}
            defaultActiveFirstOption={false}
            showArrow={true}
            placeholder={placeholder}
            onSearch={(value) => handleSearchNode(targetType, value)}
            options={nodeOptions}
            filterOption={false}
            onSelect={(value, options) => handleSelectNode("target", value, options)}
            notFoundContent={<Empty description={
              loading ? "Searching..." : (nodeOptions !== undefined ? "Not Found" : `Enter your interested ${targetType} ...`)
            } />}
          >
          </Select>
        </Form.Item>

        <Form.Item label="Target Node Name" name="target_name" hidden
          rules={[{ required: true, message: 'Please enter your expected node.' }]}>
          <Input placeholder="Please enter the target node name" disabled />
        </Form.Item>

        <Form.Item label="Relation Type" name="relation_type"
          rules={[{ required: true, message: 'Please enter relationship type.' }]}>
          <Input placeholder="Please enter the target node name" />
        </Form.Item>

        <Form.Item label="Key Sentence" name="key_sentence"
          rules={[{ required: true, message: 'Please input key sentence!' }]}>
          <TextArea rows={12} placeholder="Please input key sentence!" />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 15 }}>
          <Button style={{ marginRight: '10px' }} onClick={props.onClose}>
            Cancel
          </Button>
          <Button type="primary" onClick={onConfirm}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Row>
  )
};

export default GraphForm;