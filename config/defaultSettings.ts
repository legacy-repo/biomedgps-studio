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
  title: 'Network Medicine',
  description: 'Network Medicine for Disease Mechanism and Treatment Based on AI and knowledge graph.',
  keywords: 'Network Medicine, MultiOmics Data, Treatment, AI, Knowledge Graph',
  pwa: false,
  logo: '/assets/logo-white.png',
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
