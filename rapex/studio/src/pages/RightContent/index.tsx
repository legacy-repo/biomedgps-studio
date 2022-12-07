import { QuestionCircleOutlined, DatabaseOutlined } from '@ant-design/icons';
import { Space, Modal, Dropdown } from 'antd';
import React, { useState } from 'react';
import { SelectLang, useModel, FormattedMessage } from 'umi';
// import HeaderSearch from '../HeaderSearch';
import type { DataType } from '@/pages/DatasetList';
import DatasetList from '../DatasetList';
import styles from './index.less';
import './extra.less'

export type SiderTheme = 'light' | 'dark';

const GlobalHeaderRight: React.FC = () => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = (record: DataType) => {
    setIsModalOpen(false);
    setInitialState({ ...initialState, defaultDataset: record.dataset_abbr });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  if (!initialState || !initialState.settings) {
    return null;
  }

  const { navTheme, layout } = initialState.settings;
  let className = styles.right;

  if ((navTheme === 'dark' && layout === 'top') || layout === 'mix') {
    className = `${styles.right}  ${styles.dark}`;
  }

  return (
    <Space className={className}>
      <Dropdown.Button overlay={<></>}
        onClick={showModal}
        className="dataset-selector-btn"
        icon={
          <span onClick={showModal}>
            <DatabaseOutlined />&nbsp;
            <FormattedMessage id="pages.RightContent.selectDataset" defaultMessage="Select Dataset" />
          </span>
        }>
        {initialState.defaultDataset}
      </Dropdown.Button>
      <Modal className="dataset-selector" width={'80%'} onCancel={handleCancel}
        title="Select Dataset" visible={isModalOpen} footer={null}>
        <DatasetList selectDataset={handleOk}></DatasetList>
      </Modal>
      <span
        className={styles.action}
        onClick={() => {
          window.open('https://pro.ant.design/docs/getting-started');
        }}
      >
        <QuestionCircleOutlined />
      </span>
      <SelectLang className={styles.action} />
    </Space>
  );
};
export default GlobalHeaderRight;
