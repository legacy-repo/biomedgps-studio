// https://umijs.org/config/
import { defineConfig } from 'umi';
import path from 'path';

import defaultSettings from './defaultSettings';
import proxy from './proxy';
import { routes as defaultRoutes } from './routes';

const isDev = process.env.NODE_ENV === 'development';
const isStatic = isDev ? true : (process.env.UMI_APP_IS_STATIC ? process.env.UMI_APP_IS_STATIC : false);

export default defineConfig({
  hash: true,
  history: {
    type: 'hash',
  },
  antd: {},
  dva: {
    hmr: true,
  },
  chainWebpack: (config, { webpack }) => {
    config.merge({
      resolve: {
        fallback: {
          'perf_hooks': false,
        }
      }
    });

    // https://github.com/webpack/webpack/discussions/13585
    config.resolve.alias.set('perf_hooks', path.resolve(__dirname, 'perf_hooks.ts'));
  },
  favicon: '/gene.png',
  define: {
    // Whether the frontend is separated from the backend.
    isStatic: isStatic,
  },
  layout: {
    // https://umijs.org/zh-CN/plugins/plugin-layout

    locale: true,
    siderWidth: 280,
    menu: {
      defaultOpenAll: true,
    },
    ...defaultSettings,
  },
  // https://umijs.org/zh-CN/plugins/plugin-locale
  locale: {
    // default zh-CN
    default: 'zh-CN',
    antd: true,
    // default true, when it is true, will use `navigator.language` overwrite default
    baseNavigator: true,
  },
  dynamicImport: {
    loading: '@ant-design/pro-layout/es/PageLoading',
  },
  targets: {
    ie: 11,
  },
  // umi routes: https://umijs.org/docs/routing
  // We load routes dynamically from the config file.
  routes: defaultRoutes,
  access: {},
  // Theme for antd: https://ant.design/docs/react/customize-theme-cn
  theme: {
    // 如果不想要 configProvide 动态设置主题需要把这个设置为 default
    // 只有设置为 variable， 才能使用 configProvide 动态设置主色调
    // https://ant.design/docs/react/customize-theme-variable-cn
    'root-entry-name': 'variable',
  },
  // esbuild is father build tools
  // https://umijs.org/plugins/plugin-esbuild
  esbuild: {},
  title: false,
  ignoreMomentLocale: true,
  // proxy: proxy[REACT_APP_ENV || 'dev'],
  proxy: proxy['dev'],
  manifest: {
    basePath: '/',
  },
  // Fast Refresh 热更新
  fastRefresh: {},
  runtimePublicPath: true,
  openAPI: [
    {
      requestLibPath: "import { request } from 'umi'",
      // schemaPath: join(__dirname, 'api.json'),
      // You may need to open the apifox before running `yarn openapi`.
      // schemaPath: "http://127.0.0.1:4523/export/openapi?projectId=1645899&version=3.1",
      // TODO: ApiFox cannot import the spec correctly.
      schemaPath: "http://localhost:8000/spec",
      projectName: "swagger",
      mock: false,
    }
  ],
  nodeModulesTransform: { type: 'none' },
  mfsu: {},
  webpack5: {},
  exportStatic: {},
});
