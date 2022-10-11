// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

/** Get Charts Get all the available charts. GET /api/v1/charts */
export async function getCharts(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: StatEngineAPI.getChartsParams,
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
export async function postChartsChartName(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: StatEngineAPI.postChartsChartNameParams,
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

/** Get UI Schema 获取Chart的UI Schema GET /api/v1/charts/ui-schema/${param0} */
export async function getChartsUiSchemaChartName(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: StatEngineAPI.getChartsUiSchemaChartNameParams,
  options?: { [key: string]: any },
) {
  const { chart_name: param0, ...queryParams } = params;
  return request<StatEngineAPI.ChartSchema>(`/api/v1/charts/ui-schema/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Get Chart Task 获取图表运行信息 GET /api/v1/tasks/${param0} */
export async function getTasksId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: StatEngineAPI.getTasksIdParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<StatEngineAPI.ChartTaskResponse>(`/api/v1/tasks/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}
