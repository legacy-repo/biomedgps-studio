import React, { useState, useEffect } from 'react';
import { Button, Form, Select, message, Empty, Input, Row, InputNumber } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { getNodeTypes, getLabels, getStatistics } from '@/services/swagger/Graph';
import { makeQueryStr } from './utils';
import { GraphEdge, OptionType } from './typings';
import { sortBy } from 'lodash';

import './GraphForm.less';

// More details on the following papers:
export const relationshipTypeDict = {
  "AdG": "Anatomy-downregulates-Gene",
  "AeG": "Anatomy-expresses-Gene",
  "AuG": "Anatomy-upregulates-Gene",
  "CbG": "Compound-binds-Gene",
  "CcSE": "Compound-causes-Side Effect",
  "CdG": "Compound-downregulates-Gene",
  "CpD": "Compound-palliates-Disease",
  "CrC": "Compound-resembles-Compound",
  "CtD": "Compound-treats-Disease",
  "CuG": "Compound-upregulates-Gene",
  "DaG": "Disease-associates-Gene",
  "DdG": "Disease-downregulates-Gene",
  "DlA": "Disease-localizes-Anatomy",
  "DpS": "Disease-presents-Symptom",
  "DrD": "Disease-resembles-Disease",
  "DuG": "Disease-upregulates-Gene",
  "GcG": "Gene-covaries-Gene",
  "GiG": "Gene-interacts-Gene",
  "GpBP": "Gene-participates-Biological Process",
  "GpCC": "Gene-participates-Cellular Component",
  "GpMF": "Gene-participates-Molecular Function",
  "GpPW": "Gene-participates-Pathway",
  "Gr>G": "Gene-regulates-Gene",
  "PCiC": "Pharmacologic Class-includes-Compound",
  "AGONIST": "Agonist",
  "PARTIAL AGONIST": "Partial Agonist",
  "INHIBITOR": "Inhibitor",
  "ACTIVATOR": "Activator",
  "ANTAGONIST": "Antagonist",
  "BINDER": "Binder",
  "CHANNEL BLOCKER": "Channel Blocker",
  "BLOCKER": "Blocker",
  "POSITIVE ALLOSTERIC MODULATOR": "Positive Allosteric Modulator",
  "ALLOSTERIC MODULATOR": "Allosteric Modulator",
  "MODULATOR": "Modulator",
  "OTHER": "Other",
  "ANTIBODY": "Antibody",
  "enzyme": "enzyme",
  "target": "target",
  "x-atc": "x-atc",
  "treats": "treats",
  "carrier": "carrier",
  "PROTEIN CLEAVAGE": "Protein Cleavage",
  "PHYSICAL ASSOCIATION": "Physical Association",
  "ASSOCIATION": "Association",
  "DIRECT INTERACTION": "Direct Interaction",
  "COLOCALIZATION": "Colocalization",
  "DEPHOSPHORYLATION REACTION": "Dephosphorylation Reaction",
  "CLEAVAGE REACTION": "Cleavage Reaction",
  "PHOSPHORYLATION REACTION": "Phosphorylation Reaction",
  "ADP RIBOSYLATION REACTION": "Adp Ribosylation Reaction",
  "UBIQUITINATION REACTION": "Ubiquitination Reaction",
  "PTMOD": "Ptmod",
  "BINDING": "Binding",
  "ACTIVATION": "Activation",
  "REACTION": "Reaction",
  "CATALYSIS": "Catalysis",
  "INHIBITION": "Inhibition",
  "EXPRESSION": "Expression",
  "DrugVirGen": "DrugVirGen",
  "HumGenHumGen": "HumGenHumGen",
  "Coronavirus_ass_host_gene": "Coronavirus_ass_host_gene",
  "VirGenHumGen": "VirGenHumGen",
  "Covid2_acc_host_gene": "Covid2_acc_host_gene",
  "DrugHumGen": "DrugHumGen",
}

type RelationType = { source: string, relationType: string, fullRelationType: string }

export type EdgeStat = {
  source: string;
  relation_type: string;
  start_node_type: string;
  end_node_type: string;
  relation_count: number;
}

let timeout: ReturnType<typeof setTimeout> | null;

type GraphFormProps = {
  onSubmit?: (data: GraphEdge) => Promise<GraphEdge>;
  onClose?: () => void;
  formData?: GraphEdge;
};

const helpDoc = () => {
  return <>
    <span style={{ color: 'red', fontWeight: 'bold' }}>!!! Read me first !!! (Scroll down to see all the content):</span>
    <br />
    <span>1. Fill in the form to add a new edge to the graph. Each edge have two nodes, source and target. You should choose the type of the source and target node first, then search the node by ID or name. You need to choose the accurate node from the dropdown list. If you can't find the node, please use different ID or name to search again. If you still can't find the node, please contact the administrator.</span>
    <br />
    <span>2. After you choose the source and target node, you can fill in the other fields. The fields with * are required. The fields with tooltip have more details.</span>
    <br />
    <span>3. If you can find several knowledges from the literature, you need to add them one by one. After you submit the first knowledge, you can click the "Reset" button to reset the form. Then you can add the next knowledge.</span>
    <br />
    <span>4. After you submit the knowledge, the administrator will review it. If the knowledge is valid, it will be added to the graph. If the knowledge is invalid, it will be improved by the administrator and then added to the graph. So the pmid is very important.</span>
  </>
}

const idTooltip = () => {
  return <>
    <span>Please enter your interested node. Such as TP53, Fatigue, etc.</span>
    <br />
    <span>In case of duplicate ID:</span>
    <br />
    <span>- For disease, use the MESH ID</span>
    <br />
    <span>- For gene, use the correct ID corresponding to the source species</span>
  </>
}

const GraphForm: React.FC<GraphFormProps> = (props) => {
  const [form] = Form.useForm();
  const sourceType = Form.useWatch('source_type', form);
  const targetType = Form.useWatch('target_type', form);

  const [labelOptions, setLabelOptions] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);
  const [placeholder, setPlaceholder] = useState<string>("Search nodes ...");

  const [nodeOptions, setNodeOptions] = useState<any[] | undefined>(undefined);
  const [relationshipOptions, setRelationshipOptions] = useState<OptionType[]>([]);

  useEffect(() => {
    getNodeTypes()
      .then((response: any) => {
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
      .catch((error: any) => {
        console.log('requestNodes Error: ', error);
        message.error("Get types of nodes error, please refresh the page");
        setLabelOptions([]);
      });
  }, [])

  useEffect(() => {
    if (sourceType && targetType) {
      getStatistics({})
        .then((response: any) => {
          const relationshipStat = response.relationship_stat;
          const filtered = relationshipStat.filter((item: EdgeStat) => {
            return (item.start_node_type == sourceType && item.end_node_type == targetType) || (item.start_node_type == targetType && item.end_node_type == sourceType);
          });

          const relationshipTypes = filtered.map((item: EdgeStat) => {
            return {
              fullRelationType: item.relation_type,
              source: item.relation_type.split("::")[0],
              relationType: item.relation_type.replace(/^[a-zA-Z0-9]+::/g, '').replace(`::${item.start_node_type}:${item.end_node_type}`, "")
            }
          });

          const formatRelType = (item: RelationType) => {
            const r = relationshipTypeDict[item.relationType] ? relationshipTypeDict[item.relationType] : item.relationType
            return `${r} [${item.source}]`
          }

          const relationshipOptions = relationshipTypes.map((item: RelationType) => {
            return {
              order: 0,
              label: formatRelType(item),
              value: item.fullRelationType
            }
          });

          setRelationshipOptions(relationshipOptions);
        })
        .catch((error: any) => {
          console.log(error)
          message.error("Failed to get statistics, please check the network connection.")
        })

    }
  }, [sourceType, targetType])

  useEffect(() => {
    if (props.formData) {
      form.setFieldsValue(props.formData);
    }
  }, [props.formData])

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
        .then((response: any) => {
          const { data } = response;
          const formatedData = data.map((item: any) => ({
            value: `${item['id']}`,
            text: formatLabelOption(item),
          }));
          console.log("getLabels results: ", formatedData, data);
          // const options = formatedData.map(d => <Option key={d.value}>{d.text}</Option>);
          const options = formatedData.map((d: any) => {
            return { label: d.text, value: d.value }
          })

          setLoading(false);
          callback(sortBy(options, ['label']));
        })
        .catch((error: any) => {
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

  const formatLabelOption = (item: any) => {
    if (item._label == "Gene") {
      if (item.taxname) {
        return `${item.name} | ${item.id} | ${item.taxname} | ${item.resource}`
      } else {
        return `${item.name} | ${item.id} | Homo sapiens | ${item.resource}`
      }
    } else {
      return `${item.name} | ${item.id} | ${item.resource}`
    }
  }

  const handleSelectNode = (fieldName: "source" | "target", value: string, option: any) => {
    console.log("handleSelectNode: ", value, option);
    const id = value;
    // Please notice that the label is in the format of "name | id | resource"
    // NOTE: Must keep consistent with formatLabelOption function
    const type = option.label.split(" | ")[0];

    console.log("handleSelectNodeType: ", fieldName, value, option);
    if (fieldName == "source") {
      form.setFieldsValue({ source_id: id });
      form.setFieldsValue({ source_name: type });
    } else if (fieldName == "target") {
      form.setFieldsValue({ target_id: id });
      form.setFieldsValue({ target_name: type });
    }
  }

  const onClose = () => {
    form.resetFields();
    if (props.onClose) {
      props.onClose();
    }
  }

  const onConfirm = () => {
    setButtonLoading(true);
    form.validateFields()
      .then(values => {
        console.log("onConfirm form values: ", values);
        if (props.onSubmit) {
          let payload = {
            ...values
          }

          if (props.formData) {
            payload = {
              ...payload,
              relation_id: props.formData.relation_id
            }
          }

          props.onSubmit(payload).then(() => {
            form.resetFields();
            setButtonLoading(false);
          }).catch((error: any) => {
            console.log("onConfirm error: ", error);
            message.error("Submit error, please try later!");
            setButtonLoading(false);
          })
        }
      })
      .catch(errorInfo => {
        message.error("Unknow error, please try later!")
        console.log("errorInfo: ", errorInfo);
        setButtonLoading(false);
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
        autoComplete="off"
        labelAlign='left'
      >
        <Form.Item label="Source Node Type" name="source_type"
          tooltip="Please select a node type."
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
          tooltip={idTooltip()}
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
          tooltip="Please select a node type."
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
          tooltip={idTooltip()}
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
          tooltip="Please enter relationship type."
          rules={[{ required: true, message: 'Please enter relationship type.' }]}>
          <Select
            showSearch
            allowClear
            loading={loading}
            defaultActiveFirstOption={false}
            showArrow={true}
            placeholder="Please select a relationship type."
            options={relationshipOptions}
            filterOption={false}
            notFoundContent={<Empty description={
              relationshipOptions ? "Select source node and target node first." : "Not Found"
            } />}
          >
          </Select>
        </Form.Item>

        <Form.Item label="PMID" name="pmid"
          tooltip="Please enter pmid which is related with your curated knowledge."
          rules={[{ required: true, message: 'Please enter pmid which is related with your curated knowledge.' }]}>
          <InputNumber placeholder="Please enter the pmid" min={1} max={100000000} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Key Sentence" name="key_sentence"
          tooltip="Please choose the key sentence which can describe the relationship between the source node and the target node best from the paper.If necessary, please improve it for human readable."
          rules={[{ required: true, message: 'Please input key sentence!' }]}>
          <TextArea rows={8} placeholder="Please input key sentence!" />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 14 }}>
          <Button style={{ marginRight: '10px' }} onClick={onClose}>
            Cancel
          </Button>
          <Button type="primary" onClick={onConfirm} loading={buttonLoading}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Row>
  )
};

export default GraphForm;