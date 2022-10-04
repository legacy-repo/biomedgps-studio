// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

/** Get tasks. GET /api/tasks */
export async function getTasks(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTasksParams,
  options?: { [key: string]: any },
) {
  return request<{ total: number; page: number; page_size: number; data: any }>('/api/tasks', {
    method: 'GET',
    params: {
      // page has a default value: 1
      page: '1',
      // page_size has a default value: 10
      page_size: '10',
      // owner has a default value: huangyechao
      owner: 'huangyechao',
      // plugin_type has a default value: ReportPlugin
      plugin_type: 'ReportPlugin',
      // status has a default value: Started
      status: 'Started',
      ...params,
    },
    ...(options || {}),
  });
}

/** Create an task. POST /api/tasks */
export async function postTasks(
  body: {
    /** Percentage, From 0. */
    percentage?: number;
    /** Owner name that you want to query. */
    owner?: string;
    /** The version of the plugin */
    plugin_version: string;
    /** Started time of the record */
    started_time?: number;
    /** Filter tasks by plugin_type field. */
    plugin_type: string;
    /** The name of the plugin */
    name: string;
    /** Filter results by status field. */
    status?: 'Failed' | 'Started' | 'Finished';
    /** The name of the plugin */
    plugin_name: string;
    /** Response of the task */
    response?: Record<string, any>;
    /** Finished time of the record */
    finished_time?: number;
    /** Payload of the task */
    payload?: Record<string, any>;
    /** Description of the task */
    description?: string;
  },
  options?: { [key: string]: any },
) {
  return request<any>('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** Get a task by id. GET /api/tasks/${param0} */
export async function getTasksId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTasksIdParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<Record<string, any>>(`/api/tasks/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Delete a task. DELETE /api/tasks/${param0} */
export async function deleteTasksId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteTasksIdParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/tasks/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}
