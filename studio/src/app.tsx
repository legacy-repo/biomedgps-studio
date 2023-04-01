import Footer from '@/components/Footer';
import Header from '@/pages/Header';
import { BookOutlined, BulbOutlined, LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { PageLoading, SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from 'umi';
import { history, Link, RequestConfig, useIntl } from 'umi';
import defaultSettings, { CustomSettings, defaultCustomSettings, AppVersion } from '../config/defaultSettings';
import { RequestOptionsInit } from 'umi-request';
import { getStudioConfig, getVersion, getMenusDataset } from '@/services/swagger/Instance';
import type { MenuDataItem } from '@ant-design/pro-components';
import * as icons from "@ant-design/icons";
import { createElement } from "react";
import { dynamic } from "umi";

const Component = {
  // RapexPlugin => rapex-plugin is a group name
  // GeneListWrapper is a component name, it will be transformed to genelistwrapper as a route path.
  RapexPluginGeneListWrapper: dynamic(() => import("@/pages/rapex-plugin/GeneListWrapper")),
  RapexPluginKEGGPathwayWrapper: dynamic(() => import("@/pages/rapex-plugin/KEGGPathwayWrapper")),
  RapexPluginSimilarGeneListWrapper: dynamic(() => import("@/pages/rapex-plugin/SimilarGeneListWrapper")),
  RapexPluginSingleGene: dynamic(() => import("@/pages/rapex-plugin/SingleGene")),
  RapexPluginStatEngineWrapper: dynamic(() => import("@/pages/rapex-plugin/StatEngineWrapper")),
  RapexPluginWelcome: dynamic(() => import("@/pages/rapex-plugin/Welcome")),

  // Common Components
  About: dynamic(() => import("@/pages/About")),
  Help: dynamic(() => import("@/pages/Help")),
  KnowledgeGraph: dynamic(() => import("@/pages/KnowledgeGraph")),
  Datasets: dynamic(() => import("@/pages/Datasets")),
  NotFound: dynamic(() => import("@/pages/404")),
};

function dynamicRoutesToUsableRoutes(routes: MenuDataItem[]): MenuDataItem[] {
  return routes.map(route => {
    // route 是后端返回的数据
    // item 是最终antd-pro需要数据
    const item: MenuDataItem = {
      ...route,
      exact: false,
    };

    // icon 匹配
    if (route?.icon) {
      item.icon = createElement(icons[route.icon]);
    }

    // 组件匹配, 因为后端菜单配置的时候只会返回当前菜单对应的组件标识，所以通过组件标识来匹配组件
    if (route?.component) {
      item.component = Component[route.component || ""];
      // item.exact = true;
    }

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

const defaultRoutes = [
  {
    path: '/',
    redirect: '/welcome',
    exact: true,
  },
  {
    name: 'datasets',
    icon: 'TableOutlined',
    path: '/datasets',
    // More details on https://procomponents.ant.design/components/layout/#menu
    // hideInMenu: true,
    component: 'Datasets',
  },
  {
    name: 'about',
    icon: 'InfoCircleOutlined',
    path: '/about',
    hideInMenu: true,
    component: 'about',
  },
  {
    name: 'help',
    icon: 'QuestionCircleOutlined',
    path: '/help',
    hideInMenu: true,
    component: 'help',
  },
  {
    component: 'NotFound',
  }
]

const isDev = process.env.NODE_ENV === 'development';
const apiPrefix = process.env.UMI_APP_API_PREFIX ? process.env.UMI_APP_API_PREFIX : '';
const loginPath = '/user/login';

const ExampleLink: React.FC = () => {
  const intl = useIntl();
  return (
    <Link to="/~docs" key="docs">
      <BookOutlined />
      <span>
        {intl.formatMessage({
          id: 'app.examples',
          defaultMessage: 'Examples',
        })}
      </span>
    </Link>
  );
};

const DocLink: React.FC = () => {
  const intl = useIntl();
  return (
    <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
      <BulbOutlined />
      <span>
        {intl.formatMessage({
          id: 'app.docs',
          defaultMessage: 'Docs',
        })}
      </span>
    </Link>
  );
};

const OpenAPILink: React.FC = () => {
  const intl = useIntl();
  return (
    <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
      <LinkOutlined />
      <span>
        {intl.formatMessage({
          id: 'app.openapi',
          defaultMessage: 'OpenAPI',
        })}
      </span>
    </Link>
  );
};

const ComponentLink: React.FC = () => {
  const intl = useIntl();
  return (
    <Link to="/~docs" key="docs">
      <BookOutlined />
      <span>
        {intl.formatMessage({
          id: 'app.components',
          defaultMessage: 'Components',
        })}
      </span>
    </Link>
  );
};

console.log('apiPrefix', process.env);

const addHeader = (url: string, options: RequestOptionsInit) => {
  const visitorId = localStorage.getItem('rapex-visitor-id')
  let headers = {}
  if (visitorId) {
    headers = { "x-auth-users": visitorId }
  } else {
    headers = {}
  }
  return ({
    url: url,
    options: { ...options, headers: headers }
  })
}

export const request: RequestConfig = {
  timeout: 120000,
  // More details on ./config/proxy.ts or ./config/config.cloud.ts
  prefix: apiPrefix,
  errorConfig: {
    adaptor: (resData) => {
      return {
        ...resData,
        success: resData.ok,
        showType: 0,
        errorMessage: resData.message,
      };
    },
  },
  middlewares: [],
  requestInterceptors: [addHeader],
  responseInterceptors: [],
};

/** 获取用户信息比较慢的时候会展示一个 loading */
export const initialStateConfig = {
  loading: <PageLoading />,
};

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  loading?: boolean;
  collapsed?: boolean;
  customSettings?: CustomSettings;
  appVersion?: AppVersion;
}> {
  const fetchStudioConfig = async () => {
    try {
      const data = await getStudioConfig();
      return {
        aboutUrl: data.about_url,
        helpUrl: data.help_url,
        websiteTitle: data.website_title,
        websiteLogo: data.website_logo,
        websiteDescription: data.website_description,
        defaultDataset: data.default_dataset
      };
    } catch (error) {
      return defaultCustomSettings;
    }
  };

  const fetchVersion = async () => {
    try {
      const version = await getVersion();
      const latest_db_version = version.db_version[version.db_version.length - 1];
      return {
        version: version.version,
        dbVersion: {
          id: latest_db_version.id,
          applied: latest_db_version.applied,
          description: latest_db_version.description
        }
      }
    } catch (error) {
      return {
        version: 'unknown',
        dbVersion: {
          id: 0,
          applied: 'unknown',
          description: 'Cannot get version.'
        }
      }
    }
  }

  const customSettings: CustomSettings = await fetchStudioConfig();
  const appVersion: AppVersion = await fetchVersion();

  const settings = {
    settings: { ...defaultSettings, logo: customSettings.websiteLogo } as typeof defaultSettings,
    customSettings: {
      ...customSettings,
      mode: 'Developer',
    },
    collapsed: false,
    appVersion: appVersion,
  }

  // if (history.location.pathname.startsWith('/welcome')) {
  //   return {
  //     ...settings,
  //     collapsed: true,
  //   };
  // }

  return settings;
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  console.log("initialState: ", initialState);

  return {
    menu: {
      // Re-execute request whenever initialState?.currentUser?.userid is modified
      params: {
        defaultDataset: initialState?.customSettings?.defaultDataset,
        mode: initialState?.customSettings?.mode,
      },
      request: async (params: any, defaultMenuData: any) => {
        let menuRoutes = [];
        // let remoteMenuData = await getMenusDataset({ dataset: params.defaultDataset });
        if (initialState?.customSettings?.mode === "Developer") {
          // menuData = await getMenusDataset({ dataset: params.defaultDataset });
          menuRoutes = [
            {
              name: 'knowledge-graph',
              icon: 'ShareAltOutlined',
              path: '/knowledgegraph',
              component: 'KnowledgeGraph',
            },
            {
              name: 'chatbox',
              icon: 'InfoCircleOutlined',
              path: '/chatai',
              component: 'ChatAI',
            }
          ]

          // menuRoutes = remoteMenuData.routes.concat(menuRoutes).concat(defaultRoutes);
          const routes = dynamicRoutesToUsableRoutes(menuRoutes);
          console.log("Developer DynamicRoutes: ", routes, menuRoutes);
          return routes
        } else {
          menuRoutes = [
            {
              name: 'chatbox',
              icon: 'InfoCircleOutlined',
              path: '/chatai',
              component: 'ChatAI',
            }
          ]

          // menuRoutes = remoteMenuData.routes.concat(menuRoutes).concat(defaultRoutes);
          const routes = dynamicRoutesToUsableRoutes(menuRoutes);
          console.log("User DynamicRoutes: ", routes, menuRoutes);
          return routes
        }
      },
    },
    rightContentRender: () => <Header />,
    disableContentMargin: false,
    waterMarkProps: {
      // content: initialState?.currentUser?.name,
    },
    onCollapse: (collapsed) => {
      console.log("onCollapse: ", initialState, collapsed);
      setInitialState({
        ...initialState,
        collapsed: !initialState?.collapsed
      })
    },
    collapsed: initialState?.collapsed === undefined ? true : initialState?.collapsed,
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;

      if (location.pathname === "/") {
        history.push("/knowledgegraph");
      }

      // // Change the collapsed status of menu
      // console.log("onPageChange: ", initialState);
      // if (location.pathname !== '/welcome') {
      //   setInitialState({ ...initialState, collapsed: false });
      // } else {
      //   setInitialState({ ...initialState, collapsed: true });
      // }

      // setInitialState({ ...initialState, collapsed: true });
    },
    links: isDev
      ? [
        <DocLink></DocLink>,
        // <ExampleLink></ExampleLink>,
        // <OpenAPILink></OpenAPILink>,
        // <ComponentLink></ComponentLink>,
      ]
      : [
        // <DocLink></DocLink>,
        // <ExampleLink></ExampleLink>
      ],
    menuHeaderRender: undefined,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children, props) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <>
          {children}
          {!props.location?.pathname?.includes('/login') && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              hideHintAlert={isDev ? false : true}
              hideCopyButton={isDev ? false : true}
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    ...initialState?.settings,
  };
};
