import type { Graph, GraphData as AntvGraphData } from '@antv/graphin';

export type OptionType = {
  label: string,
  value: string
}

export type SearchObject = {
  node_type: string;
  node_id: string | undefined;
  merge_mode: "append" | "replace" | "subtract";
  relation_types?: string[];
  enable_prediction?: boolean;
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
  data: Record<string, any>;
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

export type DataOnChangeFn = ((item: { key: string, name: string }, data: AntvGraphData, graph: Graph, graphin: any) => void)
