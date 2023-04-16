// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

/** Downloads a file GET /api/v1/download */
export async function getDownload(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDownloadParams,
  options?: { [key: string]: any },
) {
  return request<string>('/api/v1/download', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Get menus. Get menus based on dataset plugin. GET /api/v1/menus/${param0} */
export async function getMenusDataset(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getMenusDatasetParams,
  options?: { [key: string]: any },
) {
  const { dataset: param0, ...queryParams } = params;
  return request<{
    routes: {
      path?: string;
      name?: string;
      icon?: string;
      component?: string;
      routes?: { path?: string; name?: string; icon?: string; component?: string }[];
    }[];
  }>(`/api/v1/menus/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Get config for studio Get config for studio GET /api/v1/studio-config */
export async function getStudioConfig(options?: { [key: string]: any }) {
  return request<{
    about_url: string;
    help_url: string;
    website_title: string;
    website_logo: string;
    website_description: string;
    default_dataset: string;
  }>('/api/v1/studio-config', {
    method: 'GET',
    ...(options || {}),
  });
}

/** Create an task Create an task. POST /api/v1/tasks */
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
  return request<{ message: { id?: string } }>('/api/v1/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** Delete a task Delete a task. DELETE /api/v1/tasks/${param0} */
export async function deleteTasksId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteTasksIdParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tasks/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Uploads a file Upload data files. POST /api/v1/upload */
export async function postUpload(body: {}, files?: File, options?: { [key: string]: any }) {
  const formData = new FormData();

  if (files) {
    formData.append('files', files);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      formData.append(
        ele,
        typeof item === 'object' && !(item instanceof File) ? JSON.stringify(item) : item,
      );
    }
  });

  return request<{ upload_path: string; files: string[]; total: number }>('/api/v1/upload', {
    method: 'POST',
    data: formData,
    requestType: 'form',
    ...(options || {}),
  });
}

/** Get instance version Get the version of rapex instance. GET /api/v1/version */
export async function getVersion(options?: { [key: string]: any }) {
  return request<{ version: string; db_version: API.DBVersion[] }>('/api/v1/version', {
    method: 'GET',
    ...(options || {}),
  });
}
