import { Button, Result } from 'antd';
import React from 'react';

const NotAuthorizedPage: React.FC = () => (
  <Result
    style={{
      width: '50%',
      justifyContent: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      margin: 'auto'
    }}
    status="403"
    title="Not Authorized"
    subTitle="Sorry, you are not authorized to access this page. If you have an account on prophet-studio.3steps.cn or this website, please login first. If you don't have an account, please contact the administrator to get an account"
    extra={
      <Button type="primary" onClick={() => {
        window.open("https://www.prophetdb.org/contact/", "_blank")
      }}>
        Contact Administrator
      </Button>
    }
  />
);

export default NotAuthorizedPage;
