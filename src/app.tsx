import Footer from '@/components/Footer';
import Header from '@/components/Header';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { PageLoading, SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from 'umi';
import { history, RequestConfig } from 'umi';
import { Auth0Provider } from '@auth0/auth0-react';
import defaultSettings, { CustomSettings, AppVersion } from '../config/defaultSettings';
import { RequestOptionsInit } from 'umi-request';
// TODO: Remove the following line. It's a temporary solution to fix the issue of losing styles of antd components.
import 'antd/dist/antd.css';

// @ts-ignore
const publicPath = window.publicPath || '/';
const defaultCustomSettings = {
  aboutUrl: `${publicPath}README/about.md`,
  helpUrl: `${publicPath}README/help.md`,
  websiteTitle: '',
  websiteLogo: `${publicPath}logo-white.png`,
  websiteDescription: 'Network Medicine for Disease Mechanism and Treatment Based on AI and knowledge graph.',
  websiteKeywords: 'Network Medicine, MultiOmics Data, Treatment, AI, Knowledge Graph',
  defaultDataset: '000000',
  mode: 'Developer'
}

const isDev = process.env.NODE_ENV === 'development';
const apiPrefix = process.env.UMI_APP_API_PREFIX ? process.env.UMI_APP_API_PREFIX : window.location.origin;
const CLIENT_ID = process.env.UMI_APP_AUTH0_CLIENT_ID ? process.env.UMI_APP_AUTH0_CLIENT_ID : '<your-client-id>';
const AUTH0_DOMAIN = process.env.UMI_APP_AUTH0_DOMAIN ? process.env.UMI_APP_AUTH0_DOMAIN : '<your-domain>';

console.log('apiPrefix', process.env, apiPrefix);

const getJwtAccessToken = (): string | null => {
  let jwtToken = null;
  // Check if the cookie exists
  if (document.cookie && document.cookie.includes("jwt_access_token=")) {
    // Retrieve the cookie value
    // @ts-ignore
    jwtToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("jwt_access_token="))
      .split("=")[1];
  }

  if (jwtToken) {
    console.log("JWT access token found in the cookie.");
    return jwtToken;
  } else {
    console.log("JWT access token not found in the cookie.");
    return null;
  }
}

const getUsername = (): string | undefined => {
  const accessToken = getJwtAccessToken();
  if (accessToken) {
    const payload = accessToken.split('.')[1];
    const payloadJson = JSON.parse(atob(payload));
    return payloadJson['username'];
  } else {
    return undefined;
  }
}

const addHeader = (url: string, options: RequestOptionsInit) => {
  const visitorId = localStorage.getItem('rapex-visitor-id')
  // How to get a jwt_access_token from the cookie?
  const jwt_access_token = getJwtAccessToken()

  let headers = {}
  if (visitorId) {
    headers = {
      "x-auth-users": visitorId,
      // TODO: Support JWT
      "Authorization": "Bearer " + (jwt_access_token ? jwt_access_token : visitorId)
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
  responseInterceptors: [
    (response: Response, options: RequestOptionsInit): Response | Promise<Response> => {
      console.log("responseInterceptors: ", response, options);
      if (response.status === 401) {
        // Save the current hash as the redirect url
        let redirectUrl = window.location.hash.split("#").pop();
        if (redirectUrl) {
          redirectUrl = redirectUrl.replaceAll('/', '')
          localStorage.setItem('redirectUrl', redirectUrl);
          // Redirect to a warning page that its route name is 'not-authorized'.
          history.push('/not-authorized?redirectUrl=' + redirectUrl);
        } else {
          localStorage.setItem('redirectUrl', '');
          history.push('/not-authorized');
        }

        return new Promise(() => { });
      }

      return response;
    }
  ],
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

export const rootContainer = (container: any) => {
  // As a standalone application, it needs to be wrapped by Auth0Provider.
  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
    >
      {container}
    </Auth0Provider>
  );
};

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
          // Change the redirect route to /, if the default path is not set.
          welcome.redirect = '/';
          welcome.component = null;
          return defaultMenuData.filter((route: any) => !route.category || route.category !== 'omics-data')
        }
      },
    },
    // TODO: Improve the interface for getDatasets.
    rightContentRender: () => {
      return <Header username={getUsername()} />;
    },
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
    childrenRender: (children: any, props: any) => {
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
