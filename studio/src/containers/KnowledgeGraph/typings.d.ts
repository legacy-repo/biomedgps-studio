import type { Graph, GraphData as AntvGraphData } from '@antv/graphin';

export type OptionType = {
  order: number;
  label: string;
  value: string
}

export type Relationship = {
  sourceNodeType: string;
  targetNodeType: string;
  relationshipType: string;
  resource: string;
}

export type SearchObject = {
  node_type?: string;
  node_id?: string | undefined;
  merge_mode: "append" | "replace" | "subtract";
  relation_types?: string[];
  query_mode?: "each" | "all"; // each: querying n nodes for each node, all: querying n nodes for all nodes; Only used for mode "batchNodes"
  all_relation_types?: string[];
  enable_prediction?: boolean;
  nsteps?: number;
  limit?: number;
  mode?: "node" | "batchIds" | "similarity" | "batchNodes" | "path";
  topk?: number; // Only used for mode "similarity"
  node_ids?: string[]; // Only used for mode "batchIds"
  nodes?: GraphNode[]; // Only used for mode "batchNodes" or "path"
}

export type GraphNode = {
  comboId: string;
  id: string;
  label: string;
  nlabel: string;
  cluster: string;
  style: any;
  category: 'nodes' | 'edges';
  type: 'graphin-circle';
  data: Record<string, any>; // at least id, name
  x?: number;
  y?: number;
}

export type GraphEdge = {
  relid: string;
  source: string;
  category: 'nodes' | 'edges';
  target: string;
  reltype: string;
  style: any;
  data: Record<string, any>
}

export type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type OnNodeMenuClickFn = (
  item: { key: string, name: string },
  data: GraphNode, graph: Graph, graphin: any
) => void

export type OnCanvasMenuClickFn = (
  item: { key: string, name: string },
  graph: Graph, graphin: any
) => void

export type OnEdgeMenuClickFn = (
  item: { key: string, name: string },
  source: GraphNode, target: GraphNode, edge: GraphEdge,
  graph: Graph, graphin: any
) => void

export type NodeStat = {
  node_type: string;
  node_count: number;
  source: string;
}

export type EdgeStat = {
  source: string;
  relation_type: string;
  start_node_type: string;
  end_node_type: string;
  relation_count: number;
}

export type EdgeInfo = {
  startNode: GraphNode,
  endNode: GraphNode,
  edge: GraphEdge
}

export type DimensionArray = {
  x: number;
  y: number;
  node_id: string;
  node_type: string;
  raw_node_id: string;
}[];

export type OnClickEdgeFn = (edgeId: string, startNode: GraphNode, endNode: GraphNode, edge: GraphEdge) => void;
export type OnClickNodeFn = (nodeId: string, node: GraphNode) => void;

export type AdjacencyList = Map<string, string[]>; // node id -> list of node ids
