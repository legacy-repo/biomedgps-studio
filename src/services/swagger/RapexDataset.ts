// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

/** Get DEGs. Get DEGs from rapex dataset. GET /api/v1/dataset/rapex-degs */
export async function getDatasetRapexDegs(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDatasetRapexDegsParams,
  options?: { [key: string]: any },
) {
  return request<API.RapexDEGDataResponse>('/api/v1/dataset/rapex-degs', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Get gene ids Get gene ids  from rapex dataset. GET /api/v1/dataset/rapex-genes */
export async function getDatasetRapexGenes(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDatasetRapexGenesParams,
  options?: { [key: string]: any },
) {
  return request<API.RapexGeneDataResponse>('/api/v1/dataset/rapex-genes', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Get pathways Get Pathways from rapex dataset. GET /api/v1/dataset/rapex-pathways */
export async function getDatasetRapexPathways(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDatasetRapexPathwaysParams,
  options?: { [key: string]: any },
) {
  return request<API.RapexPathwayDataResponse>('/api/v1/dataset/rapex-pathways', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Get similar genes Get similar genes from rapex dataset. GET /api/v1/dataset/rapex-similar-genes */
export async function getDatasetRapexSimilarGenes(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDatasetRapexSimilarGenesParams,
  options?: { [key: string]: any },
) {
  return request<API.RapexSimilarGenesDataResponse>('/api/v1/dataset/rapex-similar-genes', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Get gene expression data Get gene expression data  from rapex dataset GET /api/v1/rapex-gene-expr-data */
export async function getRapexGeneExprData(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getRapexGeneExprDataParams,
  options?: { [key: string]: any },
) {
  return request<API.RapexExprDataResponse>('/api/v1/rapex-gene-expr-data', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
