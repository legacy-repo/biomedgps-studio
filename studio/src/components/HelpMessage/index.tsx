// @ts-ignore
import { Button, Col, Empty, Space } from 'antd';
import React, { ReactNode, useState } from 'react';
import type { PropsWithChildren } from 'react';
// import { QuestionCircleOutlined } from '@ant-design/icons';
import './index.less';

type HelpMessageProps = PropsWithChildren<{
  title: string | HTMLElement | ReactNode;
  position?: 'center' | 'left' | 'right';
  icon?: string | HTMLElement | ReactNode;
}>;

const HelpMessage: React.FC<HelpMessageProps> = (props) => {
  const { title, position, icon, children } = props;

  const [showMessage, setShowMessage] = useState<boolean>(false);

  return (title && children) ? (
    <div className='help-message-container'>
      <h3 className={`title ${position ? position : 'center'}`}>
        {title}
        <a onClick={() => { setShowMessage(!showMessage) }}>
          {/* <QuestionCircleOutlined />  */}
          &nbsp;{icon ? icon : <span>&lt;&lt;&lt; Help &gt;&gt;&gt;</span>}
        </a>
      </h3>
      {
        showMessage ?
          <div className='message'>{children}</div>
          : null
      }
    </div>
  ) : (
    null
  );
};

export default HelpMessage;
