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
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postNodesParams,
  body: {
    source_id?: string;
    relation_types?: string[];
    topk?: number;
    enable_prediction?: boolean;
  },
  options?: { [key: string]: any },
) {
  return request<{ nodes: any; edges: any }>('/api/v1/nodes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    params: {
      ...params,
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
