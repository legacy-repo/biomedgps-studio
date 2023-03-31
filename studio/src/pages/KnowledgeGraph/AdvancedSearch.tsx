import { Form, Select, Empty, Switch, Button, Modal, InputNumber } from "antd";
import React, { useState, useEffect } from "react";
import { getNodeTypes, getLabels, getRelationshipTypes } from '@/services/swagger/Graph';
import { makeQueryStr } from './utils';
import { OptionType, SearchObject } from './typings';

let timeout: ReturnType<typeof setTimeout> | null;

type AdvancedSearchProps = {
  visible: boolean;
  onOk?: (searchObj: SearchObject) => void;
  onCancel?: () => void;
  searchObject?: SearchObject;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = (props) => {
  const [form] = Form.useForm();

  const [labelOptions, setLabelOptions] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [placeholder, setPlaceholder] = useState<string>("Search Gene nodes ...");
  const [nodeOptions, setNodeOptions] = useState<any[] | undefined>(undefined);
  const [relationTypeOptions, setRelationTypeOptions] = useState<any[] | undefined>(undefined);
  const [label, setLabel] = useState<string>("");

  const mergeModeOptions = [
    { label: "Replace", value: "replace" },
    { label: "Append", value: "append" },
    { label: "Subtract", value: "subtract" },
  ]

  const nStepsOptions = [
    { label: "1 Step", value: 1 },
    { label: "2 Steps", value: 2 },
    { label: "3 Steps", value: 3 },
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
    })
  }, [label])

  return (
    <Modal title="Advanced Search" visible={props.visible} onOk={validateForm} onCancel={props.onCancel}>
      <Form layout={"horizontal"} form={form} labelCol={{ span: 7 }} wrapperCol={{ span: 17 }}>
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
        <Form.Item
          name="relation_types"
          label="Relation Types"
          initialValue={props.searchObject?.relation_types ? props.searchObject?.relation_types : []}
          rules={[{ required: false, message: 'Please select your expected relation types!', type: 'array' }]}
        >
          <Select mode="multiple" placeholder="Please select relation types" options={relationTypeOptions}>
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
          initialValue={props.searchObject?.limit ? props.searchObject?.limit : 100}
          rules={[{ required: false, message: 'Please input your expected value', type: 'number' }]}
        >
          <InputNumber min={1} max={1000} />
        </Form.Item>
        <Form.Item label="Enable Prediction" name="enable_prediction"
          initialValue={props.searchObject?.enable_prediction ? props.searchObject?.enable_prediction : false}
          valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="Merging Mode" name="merge_mode"
          initialValue={props.searchObject?.merge_mode ? props.searchObject?.merge_mode : "replace"}>
          <Select placeholder="Please select mode for merging nodes & relationships" options={mergeModeOptions}>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AdvancedSearch;
