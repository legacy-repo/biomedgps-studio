import Footer from '@/components/Footer';
import RightContent from '@/components/RightContent';
import { BookOutlined, BulbOutlined, LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { PageLoading, SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from 'umi';
import { history, Link, RequestConfig, useIntl } from 'umi';
import defaultSettings from '../config/defaultSettings';

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

export const request: RequestConfig = {
  timeout: 30000,
  // More details on ./config/proxy.ts or ./config/config.cloud.ts
  prefix: apiPrefix,
  errorConfig: {},
  middlewares: [],
  requestInterceptors: [],
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
  // currentUser?: API.CurrentUser;
  loading?: boolean;
  // fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  // const fetchUserInfo = async () => {
  //   try {
  //     const msg = await queryCurrentUser();
  //     return msg.data;
  //   } catch (error) {
  //     history.push(loginPath);
  //   }
  //   return undefined;
  // };
  // 如果不是登录页面，执行
  if (history.location.pathname !== loginPath) {
    // const currentUser = await fetchUserInfo();
    return {
      // fetchUserInfo,
      // currentUser,
      settings: defaultSettings,
    };
  }
  return {
    // fetchUserInfo,
    settings: defaultSettings,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  return {
    rightContentRender: () => <RightContent />,
    disableContentMargin: false,
    waterMarkProps: {
      // content: initialState?.currentUser?.name,
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      // const { location } = history;
      // // 如果没有登录，重定向到 login
      // if (!initialState?.currentUser && location.pathname !== loginPath) {
      //   history.push(loginPath);
      // }
    },
    links: isDev
      ? [
          <DocLink></DocLink>,
          <ExampleLink></ExampleLink>,
          <OpenAPILink></OpenAPILink>,
          <ComponentLink></ComponentLink>,
        ]
      : [<DocLink></DocLink>, <ExampleLink></ExampleLink>],
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
