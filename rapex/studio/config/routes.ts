export default [
  {
    path: '/welcome',
    name: 'welcome',
    icon: 'home',
    component: './Welcome',
  },
  {
    path: '/knowledge-graph',
    name: 'knowledge-graph',
    icon: 'share-alt',
    component: './KnowledgeGraph',
  },
  {
    path: '/single-gene',
    name: 'single-gene',
    icon: 'sliders',
    component: './Welcome',
  },
  {
    path: '/multiple-genes',
    name: 'multiple-genes',
    icon: 'dot-chart',
    component: './Welcome',
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
        component: './DataSet',
      },
      {
        path: '/custom-analysis/gene-expression-profile',
        name: 'gene-exp-profile',
        icon: 'table',
        routes: [
          {
            path: '/custom-analysis/gene-expression-profile/boxplot',
            name: 'boxplot',
            icon: 'smile',
            component: './StatEngine',
            chart: 'boxplot'
          },
          {
            path: '/custom-analysis/gene-expression-profile/barplot',
            name: 'barplot',
            icon: 'smile',
            component: './StatEngine',
            chart: 'barplot'
          },
        ]
      },
      {
        path: '/custom-analysis/across-organs',
        name: 'across-organs',
        icon: 'table',
        routes: [
          {
            path: '/custom-analysis/across-organs/boxplot-organs',
            name: 'boxplot',
            icon: 'smile',
            component: './StatEngine',
            chart: 'boxplot_organs'
          },
          {
            path: '/custom-analysis/across-organs/barplot-organs',
            name: 'barplot',
            icon: 'smile',
            component: './StatEngine',
            chart: 'barplot_organs'
          },
        ]
      },
      {
        path: '/custom-analysis/across-species',
        name: 'across-species',
        icon: 'smile',
        component: './Welcome',
      },
      {
        path: '/custom-analysis/multiple-genes-comparison',
        name: 'multiple-genes-comparison',
        icon: 'smile',
        component: './Welcome',
      },
      {
        path: '/custom-analysis/correlation-analysis',
        name: 'correlation-analysis',
        icon: 'smile',
        component: './Welcome',
      },
      {
        path: '/custom-analysis/similar-genes-detection',
        name: 'similar-genes-detection',
        icon: 'smile',
        component: './Welcome',
      },
    ],
  },
  {
    name: 'kegg-pathways',
    icon: 'partition',
    path: '/kegg-pathways',
    component: './KEGGPathway',
  },
  {
    name: 'datasets',
    icon: 'table',
    path: '/datasets',
    component: './Welcome',
  },
  {
    name: 'about',
    icon: 'question-circle',
    path: '/about',
    component: './Welcome',
  },
  {
    path: '/',
    redirect: '/welcome',
  },
  {
    component: './404',
  }
];
