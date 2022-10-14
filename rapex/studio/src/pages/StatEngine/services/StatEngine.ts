// @ts-ignore
/* eslint-disable */
import { request } from 'umi';
import { StatEngineAPI } from './typings';

/** Get Charts Get all the available charts. GET /api/v1/charts */
export async function getCharts(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: StatEngineAPI.GetChartsParams,
  options?: { [key: string]: any },
) {
  return request<StatEngineAPI.ChartDataResponse>('/api/v1/charts', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Create Chart 创建指定Chart POST /api/v1/charts/${param0} */
export async function postChart(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: StatEngineAPI.PostChartParams,
  body: any,
  options?: { [key: string]: any },
) {
  const { chart_name: param0, ...queryParams } = params;
  return request<StatEngineAPI.TaskCreationResponse>(`/api/v1/charts/${param0}`, {
    method: 'POST',
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** Get UI Schema 获取Chart的UI Schema GET /api/v1/charts/ui-schema/${param0} */
export async function getChartUiSchema(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: StatEngineAPI.GetChartUiSchemaParams,
  options?: { [key: string]: any },
) {
  const { chart_name: param0, ...queryParams } = params;
  return request<StatEngineAPI.ChartSchema>(`/api/v1/charts/ui-schema/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Create Chart Task 获取图表运行信息 GET /api/v1/tasks/${param0} */
export async function getChartTask(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: StatEngineAPI.GetTasksIdParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<StatEngineAPI.TaskListItem>(`/api/v1/tasks/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Get tasks. GET /api/tasks */
export async function getTasks(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTasksParams,
  options?: { [key: string]: any },
) {
  return request<{ total: number; page: number; page_size: number; data: any }>('/api/v1/tasks', {
    method: 'GET',
    params: {
      // page has a default value: 1
      // page: params.current,
      // page_size has a default value: 10
      // page_size: params.pageSize,
      // plugin_type has a default value: ChartPlugin
      plugin_type: 'ChartPlugin',
      // status has a default value: Started
      // status: 'Started',
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取Plotly Data/Result for Chart GET /api/download */
export async function getFile(
  params: {
      filelink: string;
  },
  options?: { [key: string]: any },
) {
  return request<any>(`/api/v1/download`, {
      method: 'GET',
      params: {
          ...params,
      },
      ...(options || {}),
  });
}