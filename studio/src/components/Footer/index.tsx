import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import { useIntl } from 'umi';
import './index.less';

const Footer: React.FC = () => {
  const intl = useIntl();
  const defaultMessage = intl.formatMessage({
    id: 'app.copyright.produced',
    defaultMessage: 'Rapex Team',
  });

  const currentYear = new Date().getFullYear();

  return (
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
          href: 'https://github.com/rapex-lab/rapex-studio',
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
  );
};

export default Footer;
