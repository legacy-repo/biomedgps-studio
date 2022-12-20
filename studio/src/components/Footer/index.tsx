import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import { Row } from 'antd';
import { useIntl, useModel } from 'umi';
import './index.less';

const Footer: React.FC = () => {
  const intl = useIntl();
  const defaultMessage = intl.formatMessage({
    id: 'app.copyright.produced',
    defaultMessage: 'Rapex Team',
  });

  const { initialState } = useModel('@@initialState');
  const version = initialState?.appVersion?.version
  const dbVersion = initialState?.appVersion?.dbVersion.id
  const currentYear = new Date().getFullYear();

  return (
    <Row className='footer-container'>
      <DefaultFooter
        copyright={`${currentYear} ${defaultMessage}`}
        links={[
          {
            key: 'gliomarker',
            title: 'GlioMarker',
            href: 'http://www.prophetdb.org/',
            blankTarget: true,
          },
          {
            key: 'github',
            title: <GithubOutlined />,
            href: 'https://github.com/rapex-lab/rapex',
            blankTarget: true,
          },
          {
            key: 'biominer',
            title: 'BioMiner',
            href: 'http://biominer.3steps.cn/',
            blankTarget: true,
          },
        ]}
      />
      <span>App Version ({version}) | Database Version ({dbVersion}) </span>
    </Row>
  );
};

export default Footer;
