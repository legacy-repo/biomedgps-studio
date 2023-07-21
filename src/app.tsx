import Footer from '@/components/Footer';
import Header from '@/components/Header';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { PageLoading, SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from 'umi';
import { history, RequestConfig } from 'umi';
import defaultSettings, { CustomSettings, defaultCustomSettings, AppVersion } from '../config/defaultSettings';
import { RequestOptionsInit } from 'umi-request';
// TODO: Remove the following line. It's a temporary solution to fix the issue of losing styles of antd components.
import 'antd/dist/antd.css';

const isDev = process.env.NODE_ENV === 'development';
const apiPrefix = process.env.UMI_APP_API_PREFIX ? process.env.UMI_APP_API_PREFIX : '';
const loginPath = '/user/login';

console.log('apiPrefix', process.env);

const addHeader = (url: string, options: RequestOptionsInit) => {
  const visitorId = localStorage.getItem('rapex-visitor-id')
  let headers = {}
  if (visitorId) {
    headers = {
      "x-auth-users": visitorId
    }
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
// TODO: After releasing the first version, try to improve the customized settings.
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  loading?: boolean;
  collapsed?: boolean;
  customSettings?: CustomSettings;
  appVersion?: AppVersion;
}> {
  const customSettings: CustomSettings = defaultCustomSettings;
  const appVersion: AppVersion = {
    version: 'unknown',
    dbVersion: {
      id: 0,
      applied: 'unknown',
      description: 'Cannot get version.'
    }
  };

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
        console.log("request MenuData and params: ", params, defaultMenuData)
        if (params.defaultDataset) {
          return defaultMenuData;
        } else {
          const welcome = defaultMenuData.filter((route: any) => route.path === '/welcome')[0];
          // Change the redirect route to knowledge-graph, if the default dataset is not set.
          welcome.redirect = '/knowledge-graph';
          welcome.component = null;
          return defaultMenuData.filter((route: any) => !route.category || route.category !== 'omics-data')
        }
      },
    },
    // TODO: Improve the interface for getDatasets.
    rightContentRender: () => <Header />,
    disableContentMargin: false,
    waterMarkProps: {
      // content: initialState?.currentUser?.name,
    },
    // TODO: Remove these codes
    // onCollapse: (collapsed: boolean) => {
    //   console.log("onCollapse: ", initialState, collapsed);
    //   setInitialState({
    //     ...initialState,
    //     collapsed: !initialState?.collapsed
    //   })
    // },
    // collapsed: initialState?.collapsed === undefined ? true : initialState?.collapsed,
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;

      // // Change the collapsed status of menu
      // console.log("onPageChange: ", initialState);
      // if (location.pathname !== '/welcome') {
      //   setInitialState({ ...initialState, collapsed: false });
      // } else {
      //   setInitialState({ ...initialState, collapsed: true });
      // }

      // setInitialState({ ...initialState, collapsed: true });
    },
    links: [],
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