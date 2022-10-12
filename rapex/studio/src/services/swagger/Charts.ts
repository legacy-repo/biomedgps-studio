// @ts-ignore
/* eslint-disable */
import { extend } from 'umi-request';
import { API } from './typings';

const request = extend({
  timeout: 3000,
  credentials: 'same-origin', // 默认请求是否带上cookie
});

// export async function getPlotlyData(
//   params: {
//     filelink: string;
//   },
//   options?: { [key: string]: any },
// ) {
//   return request<API.PlotlyChart>(params.filelink, {
//     method: 'GET',
//     ...(options || {}),
//   });
// }

/** 获取Plotly Data/Result for Chart GET /api/download */
export async function getPlotlyData(
    params: {
        filelink: string;
    },
    options?: { [key: string]: any },
) {
    return request<API.PlotlyChart>(`/api/v1/download`, {
        method: 'GET',
        params: {
            ...params,
        },
        ...(options || {}),
    });
}

/** 获取Chart Schema GET /api/chart/<plugin_name>-ui-schema */
export async function getChartSchema(chartName: string, options?: { [key: string]: any }) {
  return request<API.ChartSchema>(`/api/v1/chart/${chartName}-ui-schema`, {
    method: 'GET',
    params: {},
    ...(options || {}),
  });
}

export async function getChart(chartName: string, options?: { [key: string]: any }) {
  return request<API.ChartListItem>(`/api/v1/chart/${chartName}`, {
    method: 'GET',
    ...(options || {}),
  });
}

export async function postChart(chartName: string, payload: any, options?: { [key: string]: any }) {
  return request<any>(`/api/v1/chart/${chartName}`, {
    method: 'POST',
    data: payload,
    ...(options || {}),
  });
}

/** 获取Chart列表 GET /api/charts */
export async function getCharts(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.ChartList>('/api/v1/charts', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取Task GET /api/tasks/${taskId} */
export async function getTask(taskId: string, options?: { [key: string]: any }) {
  return request<API.TaskListItem>(`/api/v1/tasks/${taskId}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取列表 GET /api/tasks */
export async function getTasks(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
    plugin_type?: string;
    plugin_name?: string;
    status?: string;
  },
  options?: { [key: string]: any },
) {
  let newParams = {};
  for (const item of ['plugin_name', 'status']) {
    if (params[item]) {
      newParams[item] = params[item];
    }
  }

  newParams['page'] = params.current;
  newParams['page_size'] = params.pageSize;
  newParams['plugin_type'] = 'ChartPlugin';

  return request<API.TaskList>('/api/v1/tasks', {
    method: 'GET',
    params: {
      ...newParams,
    },
    ...(options || {}),
  });
}
