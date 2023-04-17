import {
  Form, Select, Button, Empty, Switch, Modal,
  InputNumber, Radio, message, Tabs, Input
} from "antd";
import React, { useState, useEffect } from "react";
import { getNodeTypes, getLabels, getRelationshipTypes } from '@/services/swagger/Graph';
import { makeQueryStr } from './utils';
import { OptionType, SearchObject } from './typings';
import TransferTable from './Components/TransferTable';

import './advanced-search.less'
import { UploadOutlined } from "@ant-design/icons";

let timeout: ReturnType<typeof setTimeout> | null;

type AdvancedSearchProps = {
  visible: boolean;
  onOk?: (searchObj: SearchObject) => void;
  onCancel?: () => void;
  searchObject?: SearchObject;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = (props) => {
  const [form] = Form.useForm();
  const mode = Form.useWatch('mode', form);
  const enable_prediction = Form.useWatch('enable_prediction', form);
  const nsteps = Form.useWatch('nsteps', form);
  const relation_types = Form.useWatch('relation_types', form);

  const [labelOptions, setLabelOptions] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [placeholder, setPlaceholder] = useState<string>("Search Gene nodes ...");
  const [nodeOptions, setNodeOptions] = useState<any[] | undefined>(undefined);
  const [relationTypeOptions, setRelationTypeOptions] = useState<any[] | undefined>(undefined);
  const [label, setLabel] = useState<string>("");
  const [helpWarning, setHelpWarning] = useState<string>("");

  const [activeKey, setActiveKey] = useState<string>("single");

  useEffect(() => {
    let mergeMode = "replace";
    if (mode === "node") {
      if (props.searchObject?.merge_mode) {
        mergeMode = props.searchObject.merge_mode;
      } else {
        mergeMode = "replace";
      }
    } else {
      mergeMode = "append";
    }

    form.setFieldsValue({
      merge_mode: mergeMode
    })
  }, [props.searchObject, mode])

  useEffect(() => {
    if (relation_types && relation_types.length === 0) {
      if (mode === "path" || nsteps > 1) {
        setHelpWarning("Use all relation types instead of none, but it may take a long time to search.");
        // setHelpWarning("Please select at least one relation type for performance if you want to link nodes by paths.");
        // return;
      } else if (enable_prediction) {
        setHelpWarning("Please select at least one relation type for performance if you enable prediction.");
        // return;
      } else {
        setHelpWarning("");
      }
    } else {
      setHelpWarning("");
    }
  }, [enable_prediction, nsteps, relation_types, mode])

  const mergeModeOptions = [
    { label: "Replace", value: "replace" },
    { label: "Append", value: "append" },
    { label: "Subtract", value: "subtract" },
  ]

  const nStepsOptions = [
    { label: "1 Step", value: 1 },
    { label: "2 Steps", value: 2 },
    { label: "3 Steps", value: 3 },
    { label: "4 Steps", value: 4 },
    { label: "5 Steps", value: 5 },
  ]

  // This function is used to fetch the nodes of the selected label.
  // All the nodes will be added to the options as a dropdown list.
  const fetch = async (label_type: string, value: string) => {
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
            value: item['id'],
            text: `${item['id']} | ${item['name']}`,
          }));
          console.log("getLabels results: ", formatedData);
          // const options = formatedData.map(d => <Option key={d.value}>{d.text}</Option>);
          const options = formatedData.map(d => { return { label: d.text, value: d.value } })
          setLoading(false);
          setNodeOptions(options);
        })
        .catch((error) => {
          console.log('requestNodes Error: ', error);
          setNodeOptions([]);
          setLoading(false)
        });
    };

    timeout = setTimeout(fetchData, 300);
  };

  const handleSelectLabel = function (value: string) {
    setLabel(value);
    setNodeOptions(undefined);
    setPlaceholder(`Search ${value} nodes ...`);
  }

  const handleSearch = function (value: string) {
    if (value) {
      fetch(label, value);
    } else {
      setNodeOptions(undefined);
    }
  }

  const validateForm = function () {
    form.validateFields()
      .then(values => {
        console.log("values: ", values);
        if (props.onOk) {
          props.onOk({
            ...values,
            all_relation_types: relationTypeOptions ? relationTypeOptions.map((item: any) => item.value) : [],
            relation_types: values.relation_types ? values.relation_types : [],
            enable_prediction: values.enable_prediction ? values.enable_prediction : false
          });
        }
      })
      .catch(errorInfo => {
        console.log("errorInfo: ", errorInfo);
      })
  }

  useEffect(() => {
    getNodeTypes()
      .then(response => {
        console.log("Get types of nodes: ", response)
        let o: OptionType[] = []
        if (response.node_types) {
          response.node_types.forEach((element: string) => {
            o.push({
              label: element,
              value: element
            })
          });
          setLabelOptions(o);
          setLabel(response.node_types[0]);
        } else {
          setLabelOptions([]);
          setLabel("");
        }
      })
  }, [])

  const updateFormStatus = function () {
    setHelpWarning("");
  }

  useEffect(() => {
    getRelationshipTypes({ node_type: label }).then(response => {
      console.log("Get types of relation: ", response)
      let o: OptionType[] = []
      if (response.relationship_types) {
        response.relationship_types.forEach((element: string) => {
          o.push({
            label: element,
            value: element
          })
        });
        setRelationTypeOptions(o);
      } else {
        setRelationTypeOptions([]);
      }
    }).catch(error => {
      message.error("Get types of relation error, please refresh the page and try again.");
      console.log("Get types of relation error: ", error)
    })
  }, [label])

  const QueryForm = function () {
    return (
      <Form layout={"horizontal"} form={form} labelCol={{ span: 7 }} wrapperCol={{ span: 17 }}>
        <Form.Item name="mode" label="Mode" initialValue={"node"}>
          <Radio.Group>
            <Radio value="node">Node</Radio>
            <Radio value="path">Path</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="Node Type" name="node_type"
          initialValue={props.searchObject?.node_type ? props.searchObject?.node_type : undefined}
          rules={[{ required: true, message: 'Please select a node type.' }]}>
          <Select
            allowClear
            defaultActiveFirstOption={false}
            showArrow={true}
            placeholder={"Please select a node type"}
            options={labelOptions}
            filterOption={true}
            onSelect={handleSelectLabel}
          />
        </Form.Item>
        <Form.Item label="Which Node" name="node_id"
          initialValue={props.searchObject?.node_id ? props.searchObject?.node_id : undefined}
          rules={[{ required: true, message: 'Please enter your expected node.' }]}>
          <Select
            showSearch
            allowClear
            loading={loading}
            defaultActiveFirstOption={false}
            showArrow={true}
            placeholder={placeholder}
            onSearch={handleSearch}
            options={nodeOptions}
            filterOption={false}
            notFoundContent={<Empty description={
              loading ? "Searching..." : (nodeOptions !== undefined ? "Not Found" : `Enter your interested ${label} ...`)
            } />}
          >
          </Select>
        </Form.Item>
        <Form.Item label="Node Type (2)" name="node_type2"
          hidden={mode === "node"}
          initialValue={props.searchObject?.node_type ? props.searchObject?.node_type : undefined}
          rules={[{ required: mode === "path" ? true : false, message: 'Please select a node type.' }]}>
          <Select
            allowClear
            defaultActiveFirstOption={false}
            showArrow={true}
            placeholder={"Please select a node type"}
            options={labelOptions}
            filterOption={true}
            onSelect={handleSelectLabel}
          />
        </Form.Item>
        <Form.Item label="Which Node (2)" name="node_id2"
          hidden={mode === "node"}
          initialValue={props.searchObject?.node_id ? props.searchObject?.node_id : undefined}
          rules={[{ required: mode === "path" ? true : false, message: 'Please enter your expected node.' }]}>
          <Select
            showSearch
            allowClear
            loading={loading}
            defaultActiveFirstOption={false}
            showArrow={true}
            placeholder={placeholder}
            onSearch={handleSearch}
            options={nodeOptions}
            filterOption={false}
            notFoundContent={<Empty description={
              loading ? "Searching..." : (nodeOptions !== undefined ? "Not Found" : `Enter your interested ${label} ...`)
            } />}
          >
          </Select>
        </Form.Item>
        <Form.Item
          name="relation_types"
          label="Relation Types"
          validateStatus={helpWarning ? "warning" : ""} help={helpWarning}
          initialValue={props.searchObject?.relation_types ? props.searchObject?.relation_types : []}
          rules={[{ required: false, message: 'Please select your expected relation types!', type: 'array' }]}
        >
          <Select mode="multiple" onChange={updateFormStatus}
            placeholder="Please select relation types" options={relationTypeOptions}>
          </Select>
        </Form.Item>
        <Form.Item
          name="nsteps"
          label="Num of Steps"
          initialValue={props.searchObject?.nsteps ? props.searchObject?.nsteps : 1}
          rules={[{ required: false, message: 'Please select your expected nsteps', type: 'number' }]}
        >
          <Select placeholder="Please select nsteps" options={nStepsOptions}>
          </Select>
        </Form.Item>
        <Form.Item
          name="limit"
          label="Max Num of Nodes"
          hidden={mode === "path"}
          initialValue={props.searchObject?.limit ? props.searchObject?.limit : 10}
          rules={[{ required: false, message: 'Please input your expected value', type: 'number' }]}
        >
          <InputNumber min={1} max={1000} />
        </Form.Item>
        <Form.Item label="Enable Prediction" name="enable_prediction"
          hidden={mode === "path"}
          initialValue={props.searchObject?.enable_prediction ? props.searchObject?.enable_prediction : false}
          valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="Merging Mode" name="merge_mode">
          <Select disabled={mode == 'path'}
            placeholder="Please select mode for merging nodes & relationships"
            options={mergeModeOptions}>
          </Select>
        </Form.Item>
      </Form>
    )
  }

  const items = [
    {
      label: "Single Query",
      key: "single",
      children: QueryForm()
    },
    {
      label: "Batch Query",
      key: "batch",
      children: <TransferTable />
    },
    {
      label: "Similarity Analysis",
      key: "similarity",
      children: "Do the similarity analysis with the uploaded nodes and then show the result in the graph."
    },
    {
      label: "Relationship Prediction",
      key: "prediction",
      children: "Do the relationship prediction with the uploaded nodes and then show the result in the graph."
    },
    {
      label: "Ask Question",
      key: "question",
      children: <div>
        <h3>Question:</h3>
        <Input.TextArea rows={4} placeholder="Please input your question" maxLength={6} />
        <h3>Query (generated by AI):</h3>
        <Input.TextArea rows={4} placeholder="Wait for your input..." maxLength={6} />
      </div>
    }
  ]

  return (
    <Modal className="advanced-search" title="Advanced Search"
      visible={props.visible} onOk={validateForm} destroyOnClose={true}
      onCancel={props.onCancel}>
      <Tabs
        defaultActiveKey="single"
        activeKey={activeKey}
        tabPosition="left"
        items={items}
        destroyInactiveTabPane={true}
        onChange={(key) => { setActiveKey(key) }}
        tabBarExtraContent={
          // TODO: add upload function
          activeKey === "batch" ?
            <Button icon={<UploadOutlined />} onClick={() => { }}>Upload</Button>
            : null
        }
      />
    </Modal>
  );
};

export default AdvancedSearch;
