import React from 'react';
import { Button, Form, Input, message, Modal } from 'antd';
import './GraphForm.less';
import TextArea from 'antd/lib/input/TextArea';

type OnSubmitPayload = {
  payload: Record<string, unknown>;
  name: string;
  description?: string;
}

type GraphFormProps = {
  payload: Record<string, unknown>;
  visible: boolean;
  onSubmit: (data: OnSubmitPayload) => void;
  onClose: () => void;
  parent?: HTMLElement;
};

const GraphForm: React.FC<GraphFormProps> = (props) => {
  const onFinish = (values: any) => {
    if (props.payload) {
      props.onSubmit({ payload: props.payload, ...values });
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
    message.error('Failed to submit graph');
  };

  return (
    <Modal className='graph-form' title="Save the current graph" open={props.visible}
      footer={null} width={500} closable={true} onCancel={props.onClose} destroyOnClose
      getContainer={props.parent ? props.parent : document.body}>
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item
          label="name"
          name="name"
          rules={[{ required: true, message: 'Please input a graph name!' }]}
        >
          <Input placeholder="Please input a graph name" />
        </Form.Item>

        <Form.Item
          label="description"
          name="description"
          rules={[{ required: false, message: 'Please input description!' }]}
        >
          <TextArea rows={5} placeholder="Please input description!" />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 20, span: 4 }}>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
};

export default GraphForm;