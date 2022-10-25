// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

/** Get instance version Get the version of rapex instance. GET /api/v1/version */
export async function getVersion(options?: { [key: string]: any }) {
  return request<{ version: string; db_version: API.DBVersion[] }>('/api/v1/version', {
    method: 'GET',
    ...(options || {}),
  });
}
