// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

/** Get Charts Get all the available charts. GET /api/v1/charts */
export async function getCharts(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getChartsParams,
  options?: { [key: string]: any },
) {
  return request<API.ChartDataResponse>('/api/v1/charts', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Create Chart Create a chart task. POST /api/v1/charts/${param0} */
export async function postChartsChartName(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postChartsChartNameParams,
  body: {},
  options?: { [key: string]: any },
) {
  const { chart_name: param0, ...queryParams } = params;
  return request<any>(`/api/v1/charts/${param0}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** Get UI Schema Get the ui schema of a chart. GET /api/v1/charts/ui-schema/${param0} */
export async function getChartsUiSchemaChartName(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getChartsUiSchemaChartNameParams,
  options?: { [key: string]: any },
) {
  const { chart_name: param0, ...queryParams } = params;
  return request<API.ChartSchema>(`/api/v1/charts/ui-schema/${param0}`, {
    method: 'GET',
    params: {
      ...queryParams,
    },
    ...(options || {}),
  });
}

/** Get all datasets Get all datasets GET /api/v1/datasets */
export async function getDatasets(options?: { [key: string]: any }) {
  return request<{ key?: string; text?: string }[]>('/api/v1/datasets', {
    method: 'GET',
    ...(options || {}),
  });
}

/** Get Chart Task Get the information of a chart task. GET /api/v1/tasks/${param0} */
export async function getTasksId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTasksIdParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ChartTask>(`/api/v1/tasks/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}
