export default [
  {
    path: '/welcome',
    name: 'welcome',
    icon: 'home',
    component: './Welcome',
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
        component: './SingleGene',
      },
      // {
      //   path: '/expression-analysis/multiple-genes',
      //   name: 'multiple-genes',
      //   icon: 'dot-chart',
      //   component: './MultipleGenes',
      // },
      {
        path: '/expression-analysis/kegg-pathways',
        name: 'kegg-pathways',
        icon: 'partition',
        component: './KEGGPathwayWrapper'
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
        component: './GeneListWrapper',
      },
      {
        path: '/custom-analysis/gene-expression-profile',
        name: 'gene-expression-profile',
        icon: 'smile',
        component: './StatEngineWrapper'
      },
      {
        path: '/custom-analysis/similar-genes-detection',
        name: 'similar-genes-detection',
        icon: 'smile',
        component: './SimilarGeneListWrapper',
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
    component: './DatasetList',
  },
  {
    name: 'about',
    icon: 'question-circle',
    path: '/about',
    component: './About',
  },
  {
    path: '/',
    redirect: '/welcome',
  },
  {
    component: './404',
  }
];
