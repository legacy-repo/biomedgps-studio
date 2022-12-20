// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

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

/** Get instance version Get the version of rapex instance. GET /api/v1/version */
export async function getVersion(options?: { [key: string]: any }) {
  return request<{ version: string; db_version: API.DBVersion[] }>('/api/v1/version', {
    method: 'GET',
    ...(options || {}),
  });
}
