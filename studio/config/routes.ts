export default [
  {
    path: '/welcome',
    name: 'quick-start',
    icon: 'home',
    component: './RapexWelcome',
  },
  {
    path: '/expression-analysis',
    name: 'expression-analysis',
    icon: 'appstore-add',
    routes: [
      {
        path: '/expression-analysis/single-gene',
        name: 'single-gene',
        icon: 'sliders',
        component: './RapexSingleGene',
      },
      {
        path: '/expression-analysis/kegg-pathways',
        name: 'kegg-pathways',
        icon: 'partition',
        component: './RapexKEGGPathwayWrapper'
      },
    ]
  },
  {
    path: '/custom-analysis',
    name: 'custom-analysis',
    icon: 'bar-chart',
    routes: [
      {
        path: '/custom-analysis/differential-expression-analysis',
        name: 'diff-genes',
        icon: 'table',
        component: './RapexGeneListWrapper',
      },
      {
        path: '/custom-analysis/gene-expression-profile',
        name: 'gene-expression-profile',
        icon: 'smile',
        component: './RapexStatEngineWrapper'
      },
      {
        path: '/custom-analysis/similar-genes-detection',
        name: 'similar-genes-detection',
        icon: 'smile',
        component: './RapexSimilarGeneListWrapper',
      },
    ],
  },
  {
    path: '/knowledge-graph',
    name: 'knowledge-graph',
    icon: 'share-alt',
    component: './KnowledgeGraph',
  },
  {
    name: 'datasets',
    icon: 'table',
    path: '/datasets',
    // More details on https://procomponents.ant.design/components/layout/#menu
    hideInMenu: true,
    component: './DatasetList',
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
