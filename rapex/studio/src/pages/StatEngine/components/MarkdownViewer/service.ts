import axios from 'axios';
import { getFile } from '../../services/StatEngine'

export function fetchMarkdown(url: string): Promise<string> {
  if (url.match(/^minio:\/\//)) {
    return getFile({
      filelink: url
    }).then(response => {
      return response
    }).catch(error => {
      return error.data.msg ? error.data.msg : error.data
    })
  } else {
    try {
      return axios(url).then((response) => {
        if (response.statusText !== 'OK') {
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
