import axios from 'axios';
import { getFile } from '@/pages/StatEngine/services/StatEngine'

export function fetchMarkdown(url: string): Promise<string> {
  if (url.match(/^minio:\/\//)) {
    return getFile({
      filelink: url
    }).then((response: any) => {
      return response
    }).catch((error: any) => {
      return error.data.msg ? error.data.msg : error.data
    })
  } else {
    try {
      return axios(url).then((response) => {
        if (response.status !== 200) {
          return 'No Content.';
        }
        return response.data;
      });      
    } catch (error) {
      console.log(`Cannot fetch ${url}, the reason is ${error}`)
      return new Promise((resolve, reject) => {
        reject('No Content.')
      });
    }
  }
}
