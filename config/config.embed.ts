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
  proxy: false
});