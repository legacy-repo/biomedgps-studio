import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { BookOutlined, BulbOutlined, LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { PageLoading, SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from 'umi';
import { history, Link, RequestConfig, useIntl } from 'umi';
import defaultSettings, { CustomSettings, defaultCustomSettings, AppVersion } from '../config/defaultSettings';
import { RequestOptionsInit } from 'umi-request';
import { getStudioConfig, getVersion } from '@/services/swagger/Instance';
import { getDatasets } from '@/services/swagger/StatEngine';

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
// TODO: After releasing the first version, try to improve the customized settings.
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
    // TODO: Improve the interface for getDatasets.
    rightContentRender: () => <Header getDatasets={getDatasets} />,
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
