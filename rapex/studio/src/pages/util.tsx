import type { SortOrder } from 'antd/es/table/interface';

export function makeQueryStr(
  table: string,
  params: any, // DataType & PageParams
  sort: Record<string, SortOrder>,
  filter: Record<string, React.ReactText[] | null>,
): string {
  console.log('makeQueryStr filter: ', filter);
  const query_str = `:select [:*] :from [:${table}]`;
  let sort_clause = '';
  let query_clause = '';
  if (sort) {
    const key = Object.keys(sort)[0];
    const value = Object.values(sort)[0];
    if (key && value) {
      if (value === 'ascend') {
        sort_clause = `:order-by [:${key}]`;
      } else {
        sort_clause = `:order-by [[:${key} :desc]]`;
      }
    }
  }

  if (params) {
    const subclauses = [];
    for (const key of Object.keys(params)) {
      if (['current', 'pageSize'].indexOf(key) < 0 && params[key].length > 0) {
        subclauses.push(`[:like [:upper :${key}] [:upper "%${params[key]}%"]]`);
      }
    }

    if (subclauses.length == 1) {
      query_clause = `:where ${subclauses[0]}`;
    } else if (subclauses.length > 1) {
      query_clause = `:where [:and ${subclauses.join(' ')}]`;
    }
  }

  return `{${query_str} ${sort_clause} ${query_clause}}`;
}
