import { Settings as LayoutSettings } from '@ant-design/pro-components';

const Settings: LayoutSettings & {
  pwa?: boolean;
  logo?: string;
} = {
  navTheme: 'light',
  // 拂晓蓝
  primaryColor: '#1890ff',
  layout: 'mix',
  contentWidth: 'Fluid',
  fixedHeader: false,
  fixSiderbar: true,
  colorWeak: false,
  title: '',
  pwa: false,
  logo: '/logo-white.png',
  iconfontUrl: '',
};

export default Settings;

export type CustomSettings = {
  aboutUrl: string;
  helpUrl: string;
  websiteTitle: string;
  websiteLogo: string;
  websiteDescription: string;
  defaultDataset: string;
}

export const customSettings = {
  aboutUrl: '/README/about.md',
  helpUrl: '/README/help.md',
  websiteTitle: 'RAPEX',
  websiteLogo: '/logo.png',
  websiteDescription: 'RAPEX: a webserver for discovering response to air pollutant exposure based on transcriptomics data and knowledge graph.',
  defaultDataset: '000000'
}