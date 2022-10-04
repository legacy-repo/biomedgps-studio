import argumentForm from './argumentForm';
import chartList from './chartList';
import resultPanel from './resultPanel';

export default {
  'stat-engine.reset': '重置',
  'stat-engine.reset-tooltip': '重置数据与参数',
  'stat-engine.example': '示例',
  'stat-engine.example-tooltip': '加载示例数据',
  'stat-engine.load-data': '加载数据',
  'stat-engine.summary': '文档',
  'stat-engine.arguments': '参数列表',
  ...argumentForm,
  ...resultPanel,
  ...chartList,
};
