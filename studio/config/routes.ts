export default [
  {
    path: '/welcome',
    name: 'quick-start',
    icon: 'home',
    component: './Welcome',
  },
  {
    path: '/omics-analyzer',
    name: 'omics-analyzer',
    icon: 'appstore-add',
    component: './OmicsAnalyzer',
  },
  {
    path: '/knowledge-graph',
    name: 'knowledge-graph',
    icon: 'share-alt',
    component: './KnowledgeGraph',
  },
  {
    name: 'about',
    icon: 'info-circle',
    path: '/about',
    hideInMenu: true,
    component: './About',
  },
  {
    name: 'help',
    icon: 'question-circle',
    path: '/help',
    hideInMenu: true,
    component: './Help',
  },
  {
    path: '/',
    redirect: '/welcome',
  },
  {
    component: './404',
  }
];
