import { createElement } from "react";
import * as icons from "@ant-design/icons";
import type { MenuDataItem } from '@ant-design/pro-components';

// We categorize the routes into two categories: omics-data and knowledge-graph
// All components related to omics-data can be controlled by the defaultDataset property in the config file. If the defaultDataset is not set, all components related to omics-data will be hidden.
// All other components will be shown by default.
export const routes = [
  {
    path: '/welcome',
    name: 'quick-start',
    icon: 'home',
    component: './Welcome',
    category: 'omics-data'
  },
  {
    path: '/omics-analyzer',
    name: 'omics-analyzer',
    icon: 'appstore-add',
    component: './OmicsAnalyzer',
    category: 'omics-data'
  },
  {
    path: '/knowledge-graph',
    name: 'knowledge-graph',
    icon: 'share-alt',
    component: './KnowledgeGraph',
    category: 'knowledge-graph'
  },
  {
    path: '/knowledge-graph-editor',
    name: 'knowledge-graph-editor',
    icon: 'link',
    component: './KnowledgeGraphEditor',
    category: 'knowledge-graph'
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

export const dynamicRoutesToUsableRoutes = (routes: MenuDataItem[]): MenuDataItem[] => {
  return routes.map(route => {
    // route 是后端返回的数据
    // item 是最终antd-pro需要数据
    const item: MenuDataItem = {
      ...route,
      exact: false,
    };

    // icon 匹配
    if (route?.icon) {
      item.icon = createElement(icons[route.icon as string]);
    }

    // 组件匹配, 因为后端菜单配置的时候只会返回当前菜单对应的组件标识，所以通过组件标识来匹配组件
    // if (route?.component) {
    //   item.component = Component[route.component || ""];
    //   // item.exact = true;
    // }

    // 子路由 处理
    if (route.routes && route.routes.length > 0) {
      item.routes = [
        // 如果有子路由那么肯定是要进行重定向的，重定向为第一个组件
        {
          path: item.path,
          redirect: route.routes[0].path,
          // exact: true
        },
        ...dynamicRoutesToUsableRoutes(route.routes),
      ];
      item.children = [
        {
          path: item.path,
          redirect: route.routes[0].path,
          // exact: true
        },
        ...dynamicRoutesToUsableRoutes(route.routes),
      ];
    }

    return item;
  });
}
