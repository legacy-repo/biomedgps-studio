import type { TableColumnType } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import { filter, uniq } from 'lodash';
import { postNodes } from '@/services/swagger/Graph';
import { SearchObject, GraphData, GraphNode } from './typings';
import voca from 'voca';
// import { Graph } from '@antv/g6';

export const makeColumns = (dataSource: Array<Record<string, any>>, blackList: Array<string>) => {
  let keys: Array<string> = [];
  dataSource.map(item => {
    keys = keys.concat(Object.keys(item))
  });

  let columns: TableColumnType<any>[] = [];
  const uniqKeys = uniq(keys);
  const filteredUniqKeys = filter(uniqKeys, (key) => {
    return blackList.indexOf(key) < 0
  })
  filteredUniqKeys.map(item => {
    columns.push({
      title: voca.titleCase(item),
      key: item,
      dataIndex: item,
      align: 'center',
      ellipsis: true
    })
  });

  return columns;
}

export const makeDataSources = (dataSource: Array<Record<string, any>>) => {
  return dataSource.map(item => {
    return makeDataSource(item)
  })
}

export const removeComplexData = (dataItem: Record<string, any>, blackList?: Array<string>) => {
  const newObj = {}
  const keys = Object.keys(dataItem)
  const filteredKeys = filter(keys, (key) => {
    if (blackList) {
      return blackList.indexOf(key) < 0
    } else {
      return true
    }
  })
  filteredKeys.forEach(key => {
    if (["string", "number", "boolean"].indexOf(typeof dataItem[key]) >= 0) {
      newObj[key] = dataItem[key]
    }
  })

  return newObj
}

export const makeDataSource = (dataItem: Record<string, any>, blackList?: Array<string>) => {
  if (dataItem.data) {
    return { ...removeComplexData(dataItem, blackList), ...removeComplexData(dataItem.data, blackList) }
  } else {
    return removeComplexData(dataItem)
  }
}

export function makeQueryStr(
  params: any, // DataType & PageParams
  sort: Record<string, SortOrder>,
  filter: Record<string, React.ReactText[] | null>,
): string {
  console.log('makeQueryStr filter: ', filter);
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
      if (['current', 'pageSize'].indexOf(key) < 0 && params[key].length > 0) {
        subclauses.push(`[:like [:upper :${key}] [:upper "%${params[key]}%"]]`);
      }
    }

    if (subclauses.length == 1) {
      query_clause = `:where ${subclauses[0]}`;
    } else if (subclauses.length > 1) {
      query_clause = `:where [:or ${subclauses.join(' ')}]`;
    }
  }

  return `{${query_str} ${sort_clause} ${query_clause}}`;
}


export function makeGraphQueryStr(
  match_clause: string,
  where_clause: string,
  return_clause?: string,
  limit?: number
): Record<string, any> {
  let return_clause_str = return_clause ? return_clause : "n,m,r";
  let _limit = limit ? limit : 10;
  return {
    "match": match_clause,
    "where": where_clause,
    "limit": _limit,
    "return": return_clause_str
  };
}

export const makeGraphQueryStrWithIds = (ids: number[]): Promise<GraphData> => {
  let query_map = {
    "match": "(n)",
    "where": `ID(n) in [${ids}]`,
    "return": "n"
  };
  return new Promise((resolve, reject) => {
    postNodes({ query_map: query_map }).then((res) => {
      if (res) {
        resolve(res)
      } else {
        reject(res)
      }
    }).catch((err) => {
      reject(err)
    })
  })
}

export function autoConnectNodes(nodes: GraphNode[]): Promise<GraphData> {
  // To convert the js object into a literal string
  let nodeList = nodes.map(item => {
    // In fact, id is a number in neo4j, but it is converted to a string in the front end.
    return { id: parseInt(item.id), label: item.nlabel }
  })
  let nodeListStr = JSON.stringify(nodeList, null).replace(/"([^"]+)":/g, '$1:');
  let idListStr = JSON.stringify(nodes.map(item => parseInt(item.id)), null);
  let query_map = {
    "with": `${nodeListStr} as nodeList, ${idListStr} as idList`,
    "unwind": "nodeList AS node",
    "match": "(n)-[r]-(m)",
    "where": "node.label in labels(n) and ID(n) = node.id and ID(m) in idList",
    "return": "n,m,r"
  };
  return new Promise((resolve, reject) => {
    postNodes({ query_map: query_map }).then((res) => {
      if (res) {
        resolve(res)
      } else {
        reject(res)
      }
    }).catch((err) => {
      reject(err)
    })
  })
}

export function makeGraphQueryStrWithSearchObject(searchObject: SearchObject): Promise<GraphData> {
  const {
    node_type, node_id, relation_types, all_relation_types,
    enable_prediction, limit, mode, node_id2, node_type2, node_ids
  } = searchObject;
  return new Promise((resolve, reject) => {
    let payload = {}
    let query_str = {}

    if (mode == "node" && node_type && node_id) {
      query_str = makeGraphQueryStr(`(n:${node_type})-[r]-(m)`, `n.id = '${node_id}'`, undefined, limit)

      if (!relation_types || relation_types?.length == 0) {
        if (searchObject.nsteps && searchObject.nsteps <= 1) {
          query_str = makeGraphQueryStr(`(n:${node_type})-[r]-(m)`, `n.id = '${node_id}'`, undefined, limit)
        } else {
          // This is a bug in the backend, if we use *1..${searchObject.nsteps} it will not return the correct result
          // But it will not be ran into this case, since we will not have nsteps > 1 in the frontend
          query_str = makeGraphQueryStr(`(n:${node_type})-[r*1..${searchObject.nsteps}]-(m)`, `n.id = '${node_id}'`, "n,r,m", limit)
        }

        // It will cause performance issue if we enable prediction for all relation types
        // So we need to filter out the relation types that are not related to the node type or warn the user that he/she should pick up at least one relation type
        payload = {
          source_id: `${node_id}`,
          relation_types: all_relation_types ? all_relation_types.filter(item => item.match(node_type)) : [],
          topk: 10,
          enable_prediction: enable_prediction
        }
      } else {
        const relation_types_str = relation_types.join("`|`")
        if (searchObject.nsteps && searchObject.nsteps <= 1) {
          query_str = makeGraphQueryStr(`(n:${node_type})-[r:\`${relation_types_str}\`]-(m)`, `n.id = '${node_id}'`, undefined, limit)
        } else {
          query_str = makeGraphQueryStr(`(n:${node_type})-[r:\`${relation_types_str}\` *1..${searchObject.nsteps}]-(m)`, `n.id = '${node_id}'`, undefined, limit)
        }

        payload = {
          source_id: node_id,
          relation_types: relation_types,
          topk: 10,
          enable_prediction: enable_prediction
        }
      }
    }

    if (mode == "path" && node_type && node_id && node_type2 && node_id2) {
      if (!relation_types || relation_types?.length == 0) {
        // Just return all the relations between two nodes, but only one step
        query_str = makeGraphQueryStr(`(n:${node_type})-[r*1..${searchObject.nsteps}]-(m:${node_type2})`,
          `n.id = '${node_id}' and m.id = '${node_id2}'`,
          undefined, limit)
      } else {
        const relation_types_str = relation_types.join("`|`")
        query_str = makeGraphQueryStr(`(n:${node_type})-[r:\`${relation_types_str}\`*1..${searchObject.nsteps}]-(m:${node_type2})`,
          `n.id = '${node_id}' and m.id = '${node_id2}'`,
          undefined, limit)
      }
    }

    if (mode == 'batchIds' && node_ids) {
      query_str = makeGraphQueryStr(`(n)`, `n.id in ${JSON.stringify(node_ids)}`, "n", limit)
    }

    if (Object.keys(query_str).length > 0) {
      postNodes({ query_map: query_str, ...payload }).then((res) => {
        if (res) {
          resolve(res)
        } else {
          reject(res)
        }
      }).catch((err) => {
        reject(err)
      })
    } else {
      resolve({
        nodes: [],
        edges: []
      })
    }
  })
}

export const searchRelationshipsById = (label: string, id: string | undefined): Promise<GraphData> => {
  return new Promise((resolve, reject) => {
    if (label && id) {
      postNodes({ query_map: makeGraphQueryStr(`(n:${label})-[r]-(m)`, `n.id = '${id}'`) }).then((res) => {
        if (res) {
          resolve(res)
        } else {
          reject(res)
        }
      })
    } else {
      resolve({
        nodes: [],
        edges: []
      })
    }
  })
}

export const defaultLayout = {
  type: 'graphin-force',
  workerEnabled: true, // 可选，开启 web-worker
  gpuEnabled: true, // 可选，开启 GPU 并行计算，G6 4.0 支持
  animation: true,
  preset: {
    type: 'grid', // 力导的前置布局
  },
  clustering: true,
  leafCluster: true,
  preventOverlap: true,
  nodeClusterBy: 'nlabel', // 节点聚类的映射字段
  clusterNodeStrength: 40, // 节点聚类作用力
  minNodeSpacing: 20,
  nodeSize: 40,
  defSpringLen: (_edge, source, target) => {
    const nodeSize = 40;
    const Sdegree = source.data.layout?.degree;
    const Tdegree = target.data.layout?.degree;
    const minDegree = Math.min(Sdegree, Tdegree);
    return minDegree === 1 ? nodeSize * 4 : Math.min(minDegree * nodeSize * 1.5, 200);
  },
  getId: function getId(d: any) {
    return d.id;
  },
  getHeight: function getHeight() {
    return 16;
  },
  getWidth: function getWidth() {
    return 16;
  },
  getVGap: function getVGap() {
    return 80;
  },
  getHGap: function getHGap() {
    return 50;
  },
}
