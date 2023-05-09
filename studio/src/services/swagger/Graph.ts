// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

/** Get labels. Get labels GET /api/v1/labels */
export async function getLabels(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getLabelsParams,
  options?: { [key: string]: any },
) {
  return request<{ total: number; page: number; page_size: number; data: Record<string, any>[] }>(
    '/api/v1/labels',
    {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    },
  );
}

/** Get the properties of node(s). Get the properties of node(s). GET /api/v1/node-properties */
export async function getNodeProperties(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getNodePropertiesParams,
  options?: { [key: string]: any },
) {
  return request<Record<string, any>>('/api/v1/node-properties', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Get the type of all nodes. Get the type of all nodes. GET /api/v1/node-types */
export async function getNodeTypes(options?: { [key: string]: any }) {
  return request<{ node_types?: string[] }>('/api/v1/node-types', {
    method: 'GET',
    ...(options || {}),
  });
}

/** Get the nodes which matched the query conditions. Get the nodes which matched the query conditions. POST /api/v1/nodes */
export async function postNodes(
  body: {
    source_id?: string;
    relation_types?: string[];
    topk?: number;
    enable_prediction?: boolean;
    query_map?: Record<string, any>;
  },
  options?: { [key: string]: any },
) {
  return request<{ nodes: any; edges: any }>('/api/v1/nodes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** Get the type of all relationships. Get the type of all relationships. GET /api/v1/relationship-types */
export async function getRelationshipTypes(options?: { [key: string]: any }) {
  return request<{ relationship_types?: string[] }>('/api/v1/relationship-types', {
    method: 'GET',
    ...(options || {}),
  });
}

/** Get relationships. Query relationships by some conditions. GET /api/v1/relationships */
export async function getRelationships(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getRelationshipsParams,
  options?: { [key: string]: any },
) {
  return request<{ total: number; page: number; page_size: number; data: Record<string, any>[] }>(
    '/api/v1/relationships',
    {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    },
  );
}

/** Get the nearest neighbor nodes. Get the nearest neighbor nodes. POST /api/v1/similarity */
export async function postSimilarity(
  body: { source_id?: string; topk?: number; source_type?: string },
  options?: { [key: string]: any },
) {
  return request<{ nodes: any; edges: any }>('/api/v1/similarity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** Get node & relationship statistics data. Get node & relationship statistics data. GET /api/v1/statistics */
export async function getStatistics(options?: { [key: string]: any }) {
  return request<{
    node_stat: { source?: string; node_type?: string; node_count?: number }[];
    relationship_stat: {
      source?: string;
      relation_type?: string;
      start_node_type?: string;
      end_node_type?: string;
      relation_count?: number;
    }[];
  }>('/api/v1/statistics', {
    method: 'GET',
    ...(options || {}),
  });
}
