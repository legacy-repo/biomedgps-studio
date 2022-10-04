// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

/** Get DEGs GET /api/degs */
export async function getDegs(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDegsParams,
  options?: { [key: string]: any },
) {
  return request<{ total: number; page: number; page_size: number; data: any }>('/api/degs', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Get Omics Data GET /api/omics-data */
export async function getOmicsData(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getOmicsDataParams,
  options?: { [key: string]: any },
) {
  return request<{ total: number; page: number; page_size: number; data: any }>('/api/omics-data', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Get Pathways GET /api/pathways */
export async function getPathways(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPathwaysParams,
  options?: { [key: string]: any },
) {
  return request<{ total: number; page: number; page_size: number; data: any }>('/api/pathways', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
