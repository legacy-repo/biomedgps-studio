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

  return request<any>('/api/v1/upload', {
    method: 'POST',
    data: formData,
    requestType: 'form',
    ...(options || {}),
  });
}
