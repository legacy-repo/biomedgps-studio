// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

/** Get the reducted dimension for embedding vector. Get the nearest neighbor nodes. POST /api/v1/dimension */
export async function postDimension(
  body: {
    source_id?: string;
    source_type?: string;
    target_ids?: string[];
    target_types?: string[];
  },
  options?: { [key: string]: any },
) {
  return request<{
    data: { x?: number; y?: number; node_id?: string; raw_id?: string; node_type?: string }[];
  }>('/api/v1/dimension', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** Get graphs Get tasks. GET /api/v1/graphs */
export async function getGraphs(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getGraphsParams,
  options?: { [key: string]: any },
) {
  return request<API.RapexGraphResponse>('/api/v1/graphs', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Create a graph Create an graph POST /api/v1/graphs */
export async function postGraphs(
  body: {
    /** Owner name that you want to query. */
    owner?: string;
    /** Started time of the record */
    created_time?: number;
    /** Filter tasks by plugin_type field. */
    db_version?: string;
    /** The name of the plugin */
    name: string;
    /** Payload of the task */
    payload: Record<string, any>;
    /** Description of the task */
    description?: string;
    version?: string;
    parent?: string;
  },
  options?: { [key: string]: any },
) {
  return request<{ id: { id?: string } }>('/api/v1/graphs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** Get a graph by id Get a graph by id. GET /api/v1/graphs/${param0} */
export async function getGraphsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getGraphsIdParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.RapexGraph>(`/api/v1/graphs/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Delete a graph Delete a graph DELETE /api/v1/graphs/${param0} */
export async function deleteGraphsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteGraphsIdParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/graphs/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Get knowledges Get knowledges. GET /api/v1/knowledges */
export async function getKnowledges(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getKnowledgesParams,
  options?: { [key: string]: any },
) {
  return request<API.RapexKnowledgeDataResponse>('/api/v1/knowledges', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Create a knowledge Create a knowledge POST /api/v1/knowledges */
export async function postKnowledges(body: API.RapexKnowledge, options?: { [key: string]: any }) {
  return request<API.RapexKnowledge>('/api/v1/knowledges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

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
    target_ids?: string[];
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
  body: {
    source_id?: string;
    topk?: number;
    source_type?: string;
    target_ids?: string[];
    target_types?: string[];
  },
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
