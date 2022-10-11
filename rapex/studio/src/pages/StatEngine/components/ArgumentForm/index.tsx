import { DownloadOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';
import type { ProFormColumnsType, ProFormLayoutType } from '@ant-design/pro-form';
import { BetaSchemaForm, ProFormSelect } from '@ant-design/pro-form';
import { Button, Col, Empty, Row, Space, Tooltip } from 'antd';
import FormItem from 'antd/lib/form/FormItem';
import React, { memo, useState } from 'react';
import { useIntl } from 'umi';
import type { ChartResult } from '../ChartList/data';

import './index.less';

import type { DataItem } from './data';
import { langData } from './lang';

export type ArgumentProps = {
  columns: ProFormColumnsType<DataItem>[];
  height?: string;
  labelSpan?: number;
  onSubmit?: (values: any) => Promise<ChartResult>;
};

type UIContext = Record<string, any>;

const ArgumentForm: React.FC<ArgumentProps> = (props) => {
  const { columns, height, labelSpan, onSubmit } = props;

  const activateBtn = (
    <FormItem
      label="Editor"
      style={{ width: '50%' }}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
    >
      <Button style={{ width: '100%' }}>
        <EditOutlined />
        Edit
      </Button>
    </FormItem>
  );

  const [layoutType, setLayoutType] = useState<ProFormLayoutType>('QueryFilter');

  const intl = useIntl();

  const uiContext: UIContext = {};
  Object.keys(langData).forEach((key) => {
    uiContext[key] = intl.formatMessage(langData[key]);
  });

  console.log('ArgumentForm updated');

  return columns.length > 0 ? (
    <Row className="argument-form">
      <Col className="argument-form__header">
        <ProFormSelect
          label="Layout"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          options={['ModalForm', 'QueryFilter']}
          fieldProps={{
            value: layoutType,
            onChange: (e) => setLayoutType(e),
          }}
        />
        <Space className="btn-group">
          <Tooltip title={uiContext.importTooltip}>
            <Button disabled icon={<UploadOutlined />}>
              {`${uiContext.import}`}
            </Button>
          </Tooltip>
          <Tooltip title={uiContext.exportTooltip}>
            <Button disabled icon={<DownloadOutlined />}>
              {`${uiContext.export}`}
            </Button>
          </Tooltip>
        </Space>
      </Col>
      <BetaSchemaForm<DataItem>
        className="schema-form vertical"
        trigger={activateBtn}
        style={{ height }}
        span={labelSpan}
        defaultCollapsed={false}
        layoutType={layoutType}
        layout="vertical"
        onFinish={async (values) => {
          if (onSubmit) {
            onSubmit(values)
              .then((response) => {
                console.log('onSubmit ArgumentForm: ', response);
              })
              .catch((error) => {
                console.log('onSubmit ArgumentForm Error: ', error);
              });
          }
        }}
        columns={columns}
      />
    </Row>
  ) : (
    <Empty />
  );
};

export default memo(ArgumentForm);
