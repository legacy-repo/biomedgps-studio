import {
  Form, Select, Empty, Switch, Radio,
  InputNumber, message, Button
} from "antd";
import React, { useState, useEffect } from "react";
import {
  makeQueryStr, getRelationshipOption, makeRelationshipTypes, getMaxDigits
} from '../utils';
import { OptionType, SearchObject, EdgeStat, APIs } from '../typings';

let timeout: ReturnType<typeof setTimeout> | null;

type AdvancedSearchProps = {
  onOk?: (searchObj: SearchObject) => void;
  onCancel?: () => void;
  searchObject?: SearchObject;
  edgeStat: EdgeStat[];
  getNodeTypes: APIs['GetNodeTypesFn'];
  getLabels: APIs['GetLabelsFn'];
  getRelationships: APIs['GetRelationshipsFn'];
}

const mergeModeOptions = [
  { label: "Replace", value: "replace" },
  { label: "Append", value: "append" },
  { label: "Subtract", value: "subtract" },
]

const queryModeOptions = [
  { label: "Query n nodes for each node", value: "each" },
  { label: "Query n nodes for all nodes", value: "total" },
]

const nStepsOptions = [
  { label: "1 Step", value: 1 },
  { label: "2 Steps", value: 2 },
  { label: "3 Steps", value: 3 },
  { label: "4 Steps", value: 4 },
  { label: "5 Steps", value: 5 },
]

const QueryForm: React.FC<AdvancedSearchProps> = (props) => {
  // Single Tab
  const [form] = Form.useForm();
  const mode = Form.useWatch('mode', form);
  const node_id = Form.useWatch('node_id', form);
  const node_type = Form.useWatch('node_type', form);
  const enable_prediction = Form.useWatch('enable_prediction', form);
  const nsteps = Form.useWatch('nsteps', form);
  const relation_types = Form.useWatch('relation_types', form);

  const [labelOptions, setLabelOptions] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [relationTypeOptions, setRelationTypeOptions] = useState<any[]>(makeRelationshipTypes(props.edgeStat));
  const [helpWarning, setHelpWarning] = useState<string>("");

  const [placeholder, setPlaceholder] = useState<string>("Search nodes ...");
  const [nodeOptions, setNodeOptions] = useState<any[] | undefined>(undefined);

  useEffect(() => {
    props.getNodeTypes()
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

  useEffect(() => {
    let mergeMode = "replace";
    if (props.searchObject?.merge_mode) {
      mergeMode = props.searchObject.merge_mode;
    }

    let fields = {}

    console.log("props.searchObject: ", props.searchObject);
    // Initialize limit to 50
    if (!props.searchObject?.limit) {
      fields = {
        ...fields,
        limit: 50
      }
    }

    if (!props.searchObject?.topk) {
      fields = {
        ...fields,
        topk: 10
      }
    }

    if (!props.searchObject?.query_mode) {
      fields = {
        ...fields,
        query_mode: "each"
      }
    }

    if (!props.searchObject?.nsteps) {
      fields = {
        ...fields,
        nsteps: 1
      }
    }

    if (props.searchObject) {
      for (const item in props.searchObject) {
        if (props.searchObject[item]) {
          fields = {
            ...fields,
            [item]: props.searchObject[item]
          }
        }
      }
    }

    fields = {
      ...fields,
      merge_mode: mergeMode
    }

    form.setFieldsValue(fields);

    // Initialize and load the node options
    if (props.searchObject?.node_type && props.searchObject?.node_id) {
      handleSearchNode(props.searchObject.node_type, props.searchObject.node_id);
    }
  }, [props.searchObject])

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

    return () => {
      setHelpWarning("");
    }
  }, [enable_prediction, nsteps, relation_types])

  useEffect(() => {
    if (node_id) {
      fetchRelationshipTypes(node_id, "node", (o: any) => {
        console.log("fetchRelationshipTypes within node mode: ", o);
        if (o.length > 0) {
          const merged = relationTypeOptions?.map((item: any) => {
            let matched = o.find((i: any) => {
              const newlabel = i.label.split(" ")[1]
              const oldlabel = item.label.split(" ")[1]
              return oldlabel === newlabel;
            });

            if (matched) {
              return matched;
            } else {
              const oldlabel = item.label.split(" ")[1]
              return {
                order: 9999,
                label: `[${'0'.padStart(4, '0')}] ${oldlabel}`,
                value: item.value
              }
            }
          })

          console.log("Update the number of relationships: ", merged);
          setRelationTypeOptions(merged?.sort((a: any, b: any) => a.order - b.order));
        }
      })
    }
  }, [node_id])

  const fetchRelationshipTypes = async (query: string, queryType: "node" | "nodeType",
    callback: (any: any) => void) => {
    let where_clause = "";
    let count_clause = "";
    let order_clause = "";
    if (queryType == "node" && query) {
      where_clause = `:where [:or [:= :start_id "${query}"]
                                  [:= :end_id "${query}"]]`
      count_clause = `[[:count :*] :ncount]`
      order_clause = `[[:ncount :desc]]`
    } else if (queryType == "nodeType" && query) {
      where_clause = `:where [:or [:= :source_type "${query}"]
                                  [:= :target_type "${query}"]]`
      count_clause = `[[:count :*] :ncount]`
      order_clause = `[[:ncount :desc]]`
    } else {
      fail("Invalid query type or query string.");
    }

    const query_str = `
    {:select [${count_clause} [:_type :relationship_type] 
              [:source_type :source_type] [:target_type :target_type] 
              [:resource :resource]]
      :from :relationships
      ${where_clause}
      :group-by [:relationship_type :source_type :target_type :resource]
      :order-by ${order_clause}}
    `;

    props.getRelationships({
      query_str: query_str,
      disable_total: "true"
    }).then(response => {
      console.log("Get relationships: ", response)
      let o: OptionType[] = []
      if (response.data.length > 0) {
        const maxDigits = getMaxDigits(response.data.map((item: any) => item.ncount));

        response.data.forEach((element: any, index: number) => {
          const relationship = getRelationshipOption(
            element.relationship_type, element.resource,
            element.source_type, element.target_type
          )

          o.push({
            order: index,
            label: `[${element.ncount.toString().padStart(maxDigits, '0')}] ${relationship}`,
            value: relationship
          })
        });

        callback(o);
      } else {
        callback([]);
      }
    }).catch(error => {
      message.error("Get relationships error, please refresh the page and try again.");
      console.log("Get relationships error: ", error)
      callback([]);
    })
  }

  // This function is used to fetch the nodes of the selected label.
  // All the nodes will be added to the options as a dropdown list.
  const fetchNode = async (label_type: string, value: string, callback: (any: any) => void) => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }

    const fetchData = () => {
      setLoading(true)
      props.getLabels({
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

  const updateFormStatus = function () {
    setHelpWarning("");
  }

  const onConfirm = () => {
    form.validateFields()
      .then(values => {
        console.log("onConfirm form values: ", values);
        if (props.onOk) {
          let payload = {
            ...values,
            all_relation_types: relationTypeOptions ? relationTypeOptions.map((item: any) => item.value) : [],
            enable_prediction: values.enable_prediction ? values.enable_prediction : false,
            relation_types: values.relation_types ? values.relation_types : [],
            nodes: props.searchObject?.nodes,
          }

          props.onOk(payload);
        }
      })
      .catch(errorInfo => {
        console.log("errorInfo: ", errorInfo);
      })
  }

  const isNodeMode = mode == "node";
  const isBatchIdsMode = mode == "batchIds";
  const isSimilarityMode = mode == "similarity";
  const isBatchNodesMode = mode == "batchNodes"

  return (
    <Form className="query-form" layout={"horizontal"}
      form={form} labelCol={{ span: 7 }} wrapperCol={{ span: 17 }}>
      <Form.Item name="mode" label="Mode" initialValue={"node"}>
        <Radio.Group>
          {/* Need to keep consistent with the value of mode in SearchObject class */}
          <Radio value="node">Relationship</Radio>
          <Radio value="batchIds">Nodes</Radio>
          <Radio value="similarity">Similarity</Radio>
          {
            (props.searchObject?.nodes && props.searchObject?.nodes.length > 0) &&
            <Radio value="batchNodes">BatchExpand</Radio>
          }
        </Radio.Group>
      </Form.Item>
      <Form.Item label="Node Type" name="node_type"
        rules={[{ required: true, message: 'Please select a node type.' }]}>
        <Select
          allowClear
          defaultActiveFirstOption={false}
          showArrow={true}
          placeholder={"Please select a node type"}
          options={labelOptions}
          filterOption={true}
          onSelect={handleSelectNodeType}
        />
      </Form.Item>
      <Form.Item label="Which Nodes" name="node_ids"
        hidden={!isBatchIdsMode}
        rules={[{ required: isBatchIdsMode ? true : false, message: 'Please enter your expected nodes.' }]}>
        <Select
          showSearch
          allowClear
          loading={loading}
          mode="multiple"
          defaultActiveFirstOption={false}
          showArrow={true}
          placeholder={placeholder}
          onSearch={(value) => handleSearchNode(node_type, value)}
          options={nodeOptions}
          filterOption={false}
          notFoundContent={<Empty description={
            loading ? "Searching..." : (nodeOptions !== undefined ? "Not Found" : `Enter your interested ${node_type} ...`)
          } />}
        >
        </Select>
      </Form.Item>
      <Form.Item label="Which Node" name="node_id"
        hidden={isBatchIdsMode || isBatchNodesMode}
        rules={[{
          required: (isBatchIdsMode || isBatchNodesMode) ? false : true,
          message: 'Please enter your expected node.'
        }]}>
        <Select
          showSearch
          allowClear
          loading={loading}
          defaultActiveFirstOption={false}
          showArrow={true}
          placeholder={placeholder}
          onSearch={(value) => handleSearchNode(node_type, value)}
          options={nodeOptions}
          filterOption={false}
          notFoundContent={<Empty description={
            loading ? "Searching..." : (nodeOptions !== undefined ? "Not Found" : `Enter your interested ${node_type} ...`)
          } />}
        >
        </Select>
      </Form.Item>
      <Form.Item
        name="relation_types"
        label="Relation Types"
        hidden={(isBatchIdsMode || isSimilarityMode)}
        validateStatus={helpWarning ? "warning" : ""} help={helpWarning}
        rules={[{ required: false, message: 'Please select your expected relation types!', type: 'array' }]}
      >
        <Select mode="multiple" onChange={updateFormStatus}
          filterOption={(input, option) =>
            option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          allowClear
          autoClearSearchValue={false}
          placeholder="Please select relation types"
          options={relationTypeOptions}>
        </Select>
      </Form.Item>
      <Form.Item label="Query Mode" name="query_mode" hidden={!isBatchNodesMode}>
        <Select
          placeholder="Please select query mode"
          options={queryModeOptions}>
        </Select>
      </Form.Item>
      <Form.Item
        name="nsteps"
        label="Num of Steps"
        hidden={(isBatchIdsMode || isSimilarityMode || isBatchNodesMode)}
        rules={[{ required: false, message: 'Please select your expected nsteps', type: 'number' }]}
      >
        <Select placeholder="Please select nsteps" options={nStepsOptions}>
        </Select>
      </Form.Item>
      <Form.Item
        name="limit"
        label="Max Num of Nodes"
        hidden={(isBatchIdsMode || isSimilarityMode)}
        rules={[{ required: false, message: 'Please input your expected value', type: 'number' }]}
      >
        <InputNumber min={1} max={500} />
      </Form.Item>
      <Form.Item label="Enable Prediction" name="enable_prediction"
        hidden={(isBatchIdsMode || isSimilarityMode || isBatchNodesMode)}
        valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item
        name="topk"
        label="Top K"
        hidden={isBatchIdsMode || isBatchNodesMode}
        rules={[{ required: false, message: 'Please input your expected value', type: 'number' }]}
      >
        <InputNumber min={1} max={100} />
      </Form.Item>
      <Form.Item label="Merging Mode" name="merge_mode">
        <Select
          placeholder="Please select mode for merging nodes & relationships"
          options={mergeModeOptions}>
        </Select>
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 19, span: 5 }}>
        <Button style={{ marginRight: '10px' }} onClick={props.onCancel}>Cancel</Button>
        <Button type="primary" onClick={onConfirm}>Search</Button>
      </Form.Item>
    </Form >
  )
};

export default QueryForm;
