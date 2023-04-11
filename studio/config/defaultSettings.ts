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
  layout: 'mix',
  contentWidth: 'Fluid',
  fixedHeader: false,
  fixSiderbar: true,
  colorWeak: false,
  title: '',
  description: 'RAPEX: a webserver for discovering response to air pollutant exposure based on transcriptomics data and knowledge graph.',
  keywords: 'RAPEX, transcriptomics, air pollution, knowledge graph',
  pwa: false,
  logo: '/logo-white.png',
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

export const defaultCustomSettings = {
  aboutUrl: '/README/about.md',
  helpUrl: '/README/help.md',
  websiteTitle: 'RAPEX',
  websiteLogo: '/logo-white.png',
  websiteDescription: 'RAPEX: a webserver for discovering response to air pollutant exposure based on transcriptomics data and knowledge graph.',
  websiteKeywords: 'RAPEX, transcriptomics, air pollution, knowledge graph',
  defaultDataset: '000000',
  mode: 'Developer'
}

export type AppVersion = {
  version: string;
  dbVersion: {
    id: number;
    applied: string;
    description: string;
  }
}
