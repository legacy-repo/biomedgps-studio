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
  return request<StatEngineAPI.ChartTaskResponse>(`/api/v1/tasks/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}
