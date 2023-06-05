import argumentForm from './argumentForm';
import chartList from './chartList';
import resultPanel from './resultPanel';
import historyTable from './historyTable';

export default {
  'stat-engine.reset': 'Reset',
  'stat-engine.reset-tooltip': 'Reset Data and Arguments',
  'stat-engine.example': 'Example',
  'stat-engine.example-tooltip': 'Load Example Data',
  'stat-engine.load-data': 'Load',
  'stat-engine.summary': 'Docs',
  'stat-engine.arguments': 'Arguments',
  ...argumentForm,
  ...resultPanel,
  ...chartList,
  ...historyTable,
};
