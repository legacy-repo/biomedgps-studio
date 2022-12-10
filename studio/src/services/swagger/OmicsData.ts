// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

/** Get DEGs Get DEGs GET /api/v1/degs */
export async function getDegs(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDegsParams,
  options?: { [key: string]: any },
) {
  return request<API.DEGDataResponse>('/api/v1/degs', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Get gene expression data Get gene expression data GET /api/v1/gene-expr-data */
export async function getGeneExprData(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getGeneExprDataParams,
  options?: { [key: string]: any },
) {
  return request<API.ExprDataResponse>('/api/v1/gene-expr-data', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Get genes Get Genes GET /api/v1/genes */
export async function getGenes(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getGenesParams,
  options?: { [key: string]: any },
) {
  return request<API.GeneDataResponse>('/api/v1/genes', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Get pathways Get Pathways GET /api/v1/pathways */
export async function getPathways(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPathwaysParams,
  options?: { [key: string]: any },
) {
  return request<API.PathwayDataResponse>('/api/v1/pathways', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Get similar genes Get similar genes. GET /api/v1/similar-genes */
export async function getSimilarGenes(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getSimilarGenesParams,
  options?: { [key: string]: any },
) {
  return request<API.SimilarGenesDataResponse>('/api/v1/similar-genes', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
