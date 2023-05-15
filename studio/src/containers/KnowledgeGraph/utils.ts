import type { TableColumnType } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import { filter, uniq } from 'lodash';
import { postNodes, postSimilarity } from '@/services/swagger/Graph';
import { SearchObject, GraphData, GraphNode, Relationship, EdgeStat, OptionType } from './typings';
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
  // Remove all undefined and null values
  const filterIds = ids.filter(item => item);
  let query_map = {
    "match": "(n)",
    "where": `ID(n) in [${filterIds}]`,
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

export const getDefaultRelSep = () => {
  return "<>"
}

export const getRelationshipOption = (relationType: string, resource: string,
  sourceNodeType: string, targetNodeType: string) => {
  const sep = getDefaultRelSep();

  // Two formats of relationships are supported:
  // 1. Single field mode: bioarx::Covid2_acc_host_gene::Disease:Gene
  // 2. Multiple fields mode: relationshipType<>resource<>sourceNodeType<>targetNodeType
  if (relationType.indexOf("::") >= 0) {
    return relationType;
  } else {
    return [relationType, resource, sourceNodeType, targetNodeType].join(sep);
  }
}

function makeRelationMaps(relationships: string[]): Relationship[] {
  let relationMaps = [];
  let sep = getDefaultRelSep();
  for (let i = 0; i < relationships.length; i++) {
    let [relationshipType, resource, sourceNode, targetNode] = relationships[i].split(sep);
    let relationMap = {
      "relationshipType": relationshipType,
      "sourceNodeType": sourceNode,
      "targetNodeType": targetNode,
      "resource": resource
    }

    relationMaps.push(relationMap)
  }

  return relationMaps;
}

export const getMaxDigits = (nums: number[]): number => {
  let max = 0;
  nums.forEach((element: number) => {
    let digits = element.toString().length;
    if (digits > max) {
      max = digits;
    }
  });

  return max;
}

export const makeRelationshipTypes = (edgeStat: EdgeStat[]): OptionType[] => {
  let o: OptionType[] = []
  const maxDigits = getMaxDigits(edgeStat.map((element: EdgeStat) => element.relation_count));

  edgeStat.forEach((element: EdgeStat) => {
    const relation_count = element.relation_count.toString().padStart(maxDigits, '0');
    const relationshipType = getRelationshipOption(
      element.relation_type, element.source,
      element.start_node_type, element.end_node_type
    );

    o.push({
      order: element.relation_count,
      label: `[${relation_count}] ${relationshipType}`,
      value: relationshipType
    })
  });

  return o.sort((a: any, b: any) => a.order - b.order);
}

export const isValidNodeMode = (searchObject: SearchObject): boolean => {
  const { mode, node_type, node_id } = searchObject;
  if (mode == "node" && node_type && node_id) {
    return true;
  } else {
    return false;
  }
}

export const isValidBatchIdsMode = (searchObject: SearchObject): boolean => {
  const { mode, node_ids } = searchObject;
  if (mode == "batchIds" && node_ids && node_ids.length > 0) {
    return true;
  } else {
    return false;
  }
}

export const isValidSimilarityMode = (searchObject: SearchObject): boolean => {
  const { mode, node_id, node_type } = searchObject;
  if (mode == "similarity" && node_id && node_type) {
    return true;
  } else {
    return false;
  }
}

export const isValidBatchNodesMode = (searchObject: SearchObject): boolean => {
  const { mode, nodes, node_type } = searchObject;
  if (mode == "batchNodes" && nodes && nodes.length > 0 && node_type) {
    return true;
  } else {
    return false;
  }
}

export const isValidPathMode = (searchObject: SearchObject): boolean => {
  const { mode, nodes } = searchObject;
  if (mode == "path" && nodes && nodes.length > 0) {
    return true;
  } else {
    return false;
  }
}

export const isValidSearchObject = (searchObject: SearchObject): boolean => {
  if (
    isValidNodeMode(searchObject) ||
    isValidBatchIdsMode(searchObject) ||
    isValidSimilarityMode(searchObject) ||
    isValidBatchNodesMode(searchObject) ||
    isValidPathMode(searchObject)
  ) {
    return true;
  } else {
    return false;
  }
}

export function makeGraphQueryStrWithSearchObject(searchObject: SearchObject): Promise<GraphData> {
  console.log("makeGraphQueryStrWithSearchObject: ", searchObject)
  const {
    node_type, node_id, relation_types, all_relation_types,
    enable_prediction, limit, mode, node_ids, topk, nodes,
  } = searchObject;
  return new Promise((resolve, reject) => {
    let payload = {}
    let query_str = {}

    let defaultLimit = limit ? limit : 50;

    if (mode == "node" || mode == "batchIds" || mode == "batchNodes" || mode == "path") {
      if (isValidNodeMode(searchObject)) {
        query_str = makeGraphQueryStr(`(n:${node_type})-[r]-(m)`, `n.id = '${node_id}'`, undefined, defaultLimit)

        if (!relation_types || relation_types?.length == 0) {
          if (searchObject.nsteps && searchObject.nsteps <= 1) {
            query_str = makeGraphQueryStr(`(n:${node_type})-[r]-(m)`, `n.id = '${node_id}'`, undefined, defaultLimit)
          } else {
            // This is a bug in the backend, if we use *1..${searchObject.nsteps} it will not return the correct result
            // But it will not be ran into this case, since we will not have nsteps > 1 in the frontend
            query_str = makeGraphQueryStr(`(n:${node_type})-[r*1..${searchObject.nsteps}]-(m)`, `n.id = '${node_id}'`, "n,r,m", defaultLimit)
          }

          // It will cause performance issue if we enable prediction for all relation types
          // So we need to filter out the relation types that are not related to the node type or warn the user that he/she should pick up at least one relation type
          const allRelationTypes = all_relation_types ? all_relation_types.filter(item => item.match(node_type || "")) : [];
          const relationshipMaps = makeRelationMaps(allRelationTypes);
          const relationTypes = relationshipMaps.map(item => `'${item.relationshipType}'`)
          payload = {
            source_id: `${node_id}`,
            relation_types: relationTypes,
            topk: 10,
            enable_prediction: enable_prediction
          }
        } else {
          const relationshipMaps = makeRelationMaps(relation_types);
          // TODO: Do we need to filter out the relation types that are not related to the node type?
          // const filteredRelationshipMaps = relationshipMaps.filter(item => item.sourceNodeType == node_type);

          const filtered_labels = relationshipMaps.filter(item => item.targetNodeType);
          let labels_clause = "";
          if (filtered_labels.length > 0) {
            const labels = uniq(relationshipMaps.map(item => `m:${item.targetNodeType}`)).join(" or ");
            labels_clause = labels ? `( ${labels} ) and ` : "";
          }

          const filtered_resources = relationshipMaps.filter(item => item.resource);
          let resources_clause = "";
          if (filtered_resources.length > 0) {
            const resources = uniq(relationshipMaps.map(item => `'${item.resource}'`)).join(",");
            resources_clause = resources ? `r.resource in [${resources}] and ` : "";
          }

          const relationTypes = uniq(relationshipMaps.map(item => item.relationshipType))
          const relationConditions = relationTypes.map(item => `type(r) = '${item}'`).join(" or ");
          const whereRelClause = relationConditions ? `( ${relationConditions} )` : "";

          const whereNodeClause = `${labels_clause} ${resources_clause} ${whereRelClause}`;
          if (searchObject.nsteps && searchObject.nsteps <= 1) {
            query_str = makeGraphQueryStr(`(n:${node_type})-[r]-(m)`,
              `n.id = '${node_id}' and ${whereNodeClause}`, undefined, defaultLimit)
          } else {
            query_str = makeGraphQueryStr(`(n:${node_type})-[r*1..${searchObject.nsteps}]-(m)`,
              `n.id = '${node_id}' and ${whereNodeClause}`, undefined, defaultLimit)
          }

          payload = {
            source_id: node_id,
            relation_types: relationTypes,
            topk: topk ? topk : 10,
            enable_prediction: enable_prediction
          }
        }
      }

      if (isValidBatchIdsMode(searchObject)) {
        const nodeIds = node_ids?.filter(id => id);
        query_str = makeGraphQueryStr(`(n)`, `n.id in ${JSON.stringify(nodeIds)}`, "n", defaultLimit)
      }

      if (isValidBatchNodesMode(searchObject)) {
        const whereClause = uniq(nodes?.map(item => `(n.id = '${item.data.id}' and n:${item.nlabel})`)).join(" or ");

        query_str = makeGraphQueryStr(
          `(n)-[r]-(m:${node_type})`,
          whereClause,
          "n,r,m",
          defaultLimit
        )
      }

      if (isValidPathMode(searchObject)) {
        const { nodes, nsteps } = searchObject;
        const nWhereClause = uniq(nodes?.map(item => `(n.id = '${item.data.id}' and n:${item.nlabel})`)).join(" or ");
        const mWhereClause = uniq(nodes?.map(item => `(m.id = '${item.data.id}' and m:${item.nlabel})`)).join(" or ");
        // When to use and when to use or?
        const whereClause = `(${nWhereClause}) ${(nsteps && nsteps == 1) ? 'and' : 'or'} (${mWhereClause})`;
        query_str = makeGraphQueryStr(
          `(n)-[r*1..${nsteps ? nsteps : 3}]-(m)`,
          whereClause,
          "n,r,m",
          // TODO: We need to allow user to specify the limit
          defaultLimit
        )
      }

      console.log("query_str: ", query_str)
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
        resolve({ nodes: [], edges: [] })
      }
    }

    if (isValidSimilarityMode(searchObject)) {
      // TODO: Current version only support the format of node_id = "node_type:node_id"
      // How to keep consistency with the format of node_id in the deep learning model?
      postSimilarity({
        source_type: node_type,
        // node_id may be a integer, but the backend only support string
        source_id: `${node_id}`,
        topk: topk ? topk : 10
      }).then(res => {
        console.log("Find similar nodes: ", res)
        if (res) {
          resolve(res)
        } else {
          reject(res)
        }
      }).catch(err => {
        console.log("Error when finding similar nodes: ", err)
        reject(err)
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

export const defaultLayout = {
  type: 'grid'
}

// TODO: The platform cannot stop the layout animation, then we cannot update the layout
// So we need to use the auto layout before we can fix this issue
export const legacyDefaultLayout = {
  type: 'graphin-force',
  workerEnabled: false, // 可选，开启 web-worker
  gpuEnabled: false, // 可选，开启 GPU 并行计算，G6 4.0 支持
  animation: true,
  preset: {
    type: 'force', // 力导的前置布局
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

// Mode details on https://antv-g6.gitee.io/en/examples/net/radialLayout#sortRadial
export const layouts = [
  {
    type: 'auto',
  },
  {
    ...legacyDefaultLayout
  },
  {
    type: 'grid',
    begin: [0, 0], // 可选，
    preventOverlap: true, // 可选，必须配合 nodeSize
    preventOverlapPdding: 20, // 可选
    nodeSize: 30, // 可选
    condense: false, // 可选
    rows: 5, // 可选
    cols: 5, // 可选
    sortBy: 'degree', // 可选
    workerEnabled: false, // 可选，开启 web-worker
  },
  {
    type: 'radial',
    center: [200, 200], // 可选，默认为图的中心
    linkDistance: 50, // 可选，边长
    maxIteration: 1000, // 可选
    sortBy: 'degree', // 可选
    unitRadius: 100, // 可选
    preventOverlap: true, // 可选，必须配合 nodeSize
    nodeSize: 30, // 可选
    strictRadial: false, // 可选
    workerEnabled: false, // 可选，开启 web-worker
  },
  {
    type: 'concentric',
    center: [200, 200], // 可选，
    preventOverlap: true, // 可选，必须配合 nodeSize
    nodeSize: 30, // 可选
    sweep: 10, // 可选
    minNodeSpacing: 5, // 可选
    equidistant: true, // 可选
    startAngle: 0, // 可选
    clockwise: true, // 可选
    maxLevelDiff: 0.5, // 可选
    sortBy: 'degree',
    // TODO: Cannot enable worker when using concentric layout
    workerEnabled: false, // 可选，开启 web-worker
  }
];

export const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}