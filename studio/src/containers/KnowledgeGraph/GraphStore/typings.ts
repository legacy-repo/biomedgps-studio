export type GraphHistoryItem = {
  description: string;
  payload: Record<string, any>;
  name: string;
  id: string;
  created_time: number;
  db_version: string;
  version: string;
  owner: any;
  parent: string;
};

export type GraphHistoryResponse = {
  total: number;
  page: number;
  page_size: number;
  data: GraphHistoryItem[];
};

export type GraphHistoryParams = {
  page?: number;
  page_size?: number;
  owner?: string;
  db_version?: string;
  version?: string;
}

export type GraphHistoryItemPayload = {
  description?: string;
  payload: Record<string, any>;
  name: string;
  created_time?: number;
  db_version?: string;
  version?: string;
  owner?: any;
  parent?: string;
}