// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

/** Get the manifest data of all plugins. GET /api/manifest */
export async function getManifest(options?: { [key: string]: any }) {
  return request<any>('/api/manifest', {
    method: 'GET',
    ...(options || {}),
  });
}

/** Get the version of rapex instance. GET /api/version */
export async function getVersion(options?: { [key: string]: any }) {
  return request<{ version: string; db_version: any[] }>('/api/version', {
    method: 'GET',
    ...(options || {}),
  });
}
