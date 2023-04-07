import { QuestionCircleOutlined, InfoCircleOutlined, DatabaseOutlined } from '@ant-design/icons';
import { Space, Modal, Dropdown, Menu, Row, Button } from 'antd';
import React, { useEffect, useState } from 'react';
import { SelectLang, useModel, FormattedMessage } from 'umi';
// import HeaderSearch from '../HeaderSearch';
import { useHistory } from 'react-router-dom';
import type { MenuProps } from 'antd';
import type { DataType } from '@/pages/Datasets';
import DatasetList from '../Datasets';
import styles from './index.less';
import './extra.less'

export type SiderTheme = 'light' | 'dark';

const GlobalHeaderRight: React.FC = () => {
  const { initialState, refresh, setInitialState } = useModel('@@initialState');
  const { defaultDataset, setDataset } = useModel('dataset', (ret) => ({
    defaultDataset: ret.defaultDataset,
    setDataset: ret.setDataset,
  }));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDataset, setCurrentDataset] = useState("");
  const [currentMode, setCurrentMode] = useState("");
  const [current, setCurrent] = useState('mail');
  const history = useHistory();

  useEffect(() => {
    if (!currentDataset) {
      setDataset(initialState?.customSettings?.defaultDataset || "");
    }

    if (!currentMode) {
      setCurrentMode(initialState?.customSettings?.mode || "Developer");
    }
  }, [initialState])

  const items: MenuProps['items'] = [
    {
      label: 'About',
      key: 'about',
      icon: <InfoCircleOutlined />,
    },
    {
      label: 'Help',
      key: 'help',
      icon: <QuestionCircleOutlined />,
    }
  ]

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = (record: DataType) => {
    setIsModalOpen(false);

    setDataset(record.dataset_abbr);
    setCurrentDataset(record.dataset_abbr);
    const customSettings = {
      ...initialState?.customSettings,
      defaultDataset: record.dataset_abbr
    }
    setInitialState({ ...initialState, customSettings: customSettings })
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const switchMode = (mode: string) => {
    console.log("Change the mode: ", mode)
    if (mode === 'Developer') {
      setCurrentMode("User")
      setInitialState({
        ...initialState, customSettings: {
          ...initialState?.customSettings,
          mode: 'User'
        }
      })
    } else {
      setCurrentMode("Developer")
      setInitialState({
        ...initialState, customSettings: {
          ...initialState?.customSettings,
          mode: 'Developer'
        }
      })
    }
    history.push('/');
  }

  const onClick = (item: any) => {
    if (item.key === 'about') {
      history.push('/about')
    } else if (item.key === 'help') {
      history.push('/help')
    }
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
    <Space className={`${className} right-content`}>
      <Menu onClick={onClick} selectedKeys={[current]} theme="dark" mode="inline" items={items} />
      <Row>
        <Dropdown.Button overlay={<></>}
          onClick={showModal}
          className="dataset-selector-btn"
          icon={
            <span onClick={showModal}>
              <DatabaseOutlined />&nbsp;
              <FormattedMessage id="pages.RightContent.selectDataset" defaultMessage="Select Dataset" />
            </span>
          }>
          {defaultDataset}
        </Dropdown.Button>
        <Modal className="dataset-selector" width={'80%'} onCancel={handleCancel}
          title="Select Dataset" visible={isModalOpen} footer={null} style={{ display: 'none' }}>
          <DatasetList selectDataset={handleOk}></DatasetList>
        </Modal>
      </Row>
      {/* <Button onClick={() => switchMode(currentMode)}>{currentMode} Mode</Button> */}
      <SelectLang className={styles.action} />
    </Space>
  );
};
export default GlobalHeaderRight;
