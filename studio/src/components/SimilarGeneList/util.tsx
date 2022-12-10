import type { SortOrder } from 'antd/es/table/interface';

export function makeQueryStr(
  params: any, // DataType & PageParams
  sort: Record<string, SortOrder>,
  filter: Record<string, React.ReactText[] | null>,
): string {
  console.log('makeQueryStr: ', params, sort, filter);
  const query_str = `:select [:*]`;
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
      if ('queried_id' == key && params[key].length > 0) {
        if (params[key].match(/ENS/i)) {
          subclauses.push(`[:= [:upper :queried_ensembl_id] [:upper "${params[key]}"]]`);
        } else if (params[key].match(/[a-zA-Z][a-zA-Z0-9]+/i)) {
          subclauses.push(`[:= [:upper :queried_gene_symbol] [:upper "${params[key]}"]]`);
        } else if (params[key].match(/[0-9]+/i)) {
          subclauses.push(`[:= [:upper :queried_entrez_id] [:upper "${params[key]}"]]`);
        }
      }
    }

    if (subclauses.length == 1) {
      query_clause = `:where ${subclauses[0]}`;
    } else if (subclauses.length > 1) {
      query_clause = `:where [:and ${subclauses.join(' ')}]`;
    } else {
      query_clause = `:where [:= :queried_ensembl_id "xxx"]`
    }
  }

  return `{${query_str} ${sort_clause} ${query_clause}}`;
}
