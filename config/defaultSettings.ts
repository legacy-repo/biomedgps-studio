import { Settings as LayoutSettings } from '@ant-design/pro-components';

const Settings: LayoutSettings & {
  pwa?: boolean;
  logo?: string;
  description?: string;
  keywords?: string;
} = {
  navTheme: 'light',
  // 拂晓蓝
  primaryColor: '#1890ff',
  layout: 'top',
  contentWidth: 'Fluid',
  fixedHeader: false,
  fixSiderbar: true,
  colorWeak: false,
  title: '',
  description: 'RAPEX: a webserver for discovering response to air pollutant exposure based on transcriptomics data and knowledge graph.',
  keywords: 'RAPEX, transcriptomics, air pollution, knowledge graph',
  pwa: false,
  logo: '/logo.png',
  iconfontUrl: '',
};

export default Settings;

export type CustomSettings = {
  aboutUrl?: string;
  helpUrl?: string;
  websiteTitle?: string;
  websiteLogo?: string;
  websiteDescription?: string;
  websiteKeywords?: string;
  defaultDataset?: string;
  mode?: string;
}

export type AppVersion = {
  version: string;
  dbVersion: {
    id: number;
    applied: string;
    description: string;
  }
}
