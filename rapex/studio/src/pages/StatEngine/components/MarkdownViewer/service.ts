import axios from 'axios';

export function fetchMarkdown(url: string): Promise<string> {
  return axios(url).then((response) => {
    if (response.statusText !== 'OK') {
      return 'No Content.';
    }
    return response.data;
  });
}
