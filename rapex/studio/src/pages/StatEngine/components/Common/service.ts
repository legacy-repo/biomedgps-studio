// import v from 'voca';
// @ts-ignore
import Papa from 'papaparse';
import type { PapaTableData } from './data';

export function baseName(str: string): string {
  let base = str.substring(str.lastIndexOf('/') + 1);
  if (base.lastIndexOf('.') !== -1) base = base.substring(0, base.lastIndexOf('.'));
  return base;
}

export function fetchData(url: string): Promise<PapaTableData> {
  const name = baseName(url);

  return new Promise((resolve) => {
    Papa.parse(url, {
      header: true,
      dynamicTyping: true,
      worker: true,
      complete: (results: any, file: any) => {
        console.log('Papa Parse: ', results, file);
        const { data } = results;
        resolve({
          name,
          data,
          error: [],
        });
      },
      error: (error: any) => {
        resolve({
          name,
          data: [],
          error,
        });
      },
      download: true,
      downloadRequestHeaders: undefined,
      downloadRequestBody: undefined,
      skipEmptyLines: true,
      delimitersToGuess: [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP],
    });
  });
}
