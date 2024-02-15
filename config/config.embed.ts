// https://umijs.org/config/
import { defineConfig } from 'umi';

export default defineConfig({
  outputPath: '../assets',
  publicPath: '/assets/',
  runtimePublicPath: true,
  history: {
    type: 'hash',
  },
  favicon: '/assets/gene.png',
  proxy: false,
  chunks: ['vendors', 'umi'],
  chainWebpack: (config, { webpack }) => {
    config.merge({
      optimization: {
        splitChunks: {
          chunks: 'all',
          minSize: 30000,
          minChunks: 3,
          automaticNameDelimiter: '.',
          cacheGroups: {
            vendors: {
              name: 'vendors',
              test({ resource }: any) {
                return /[\\/]node_modules[\\/]/.test(resource);
              },
              priority: 10,
            },
            biominerComponents: {
              name: 'biominer-components', // 这将是生成的文件名
              test: /[\\/]node_modules[\\/]biominer-components[\\/]/, // 正则表达式匹配biominer-components库的路径
              priority: 20 // 优先级，一个数字表示该缓存组的优先级
            },
            plotly: {
              name: 'plotly.js',
              test: /[\\/]node_modules[\\/]plotly.js[\\/]/,
              priority: 30,
            },
            agGridEnterprise: {
              name: 'ag-grid',
              test: /[\\/]node_modules[\\/]ag-grid-enterprise[\\/]/,
              priority: 40,
            },
            agGridCommunity: {
              name: 'ag-grid',
              test: /[\\/]node_modules[\\/]ag-grid-community[\\/]/,
              priority: 50,
            }
          }
        },
      },
    });
  },
});