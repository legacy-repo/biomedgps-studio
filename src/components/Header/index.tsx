import { QuestionCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Space, Menu } from 'antd';
import React, { useState } from 'react';
import { SelectLang } from 'umi';
// import HeaderSearch from '../HeaderSearch';
import { useHistory } from 'react-router-dom';
import type { MenuProps } from 'antd';
import styles from './index.less';
import './extra.less'

export type SiderTheme = 'light' | 'dark';

export interface GlobalHeaderRightProps {
}

const GlobalHeaderRight: React.FC<GlobalHeaderRightProps> = (props) => {
  const [current, setCurrent] = useState('mail');
  const history = useHistory();

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

  const onClick = (item: any) => {
    if (item.key === 'about') {
      history.push('/about')
    } else if (item.key === 'help') {
      history.push('/help')
    }
  };

  return (
    <Space className={`${styles.right}  ${styles.light} right-content`}>
      <Menu onClick={onClick} selectedKeys={[current]} theme="light" mode="inline" items={items} />
      <SelectLang className={styles.action} />
    </Space>
  );
};
export default GlobalHeaderRight;
