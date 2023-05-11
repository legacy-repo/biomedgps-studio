export type Graph = {
  description: string;
  payload: Record<string, any>;
  name: string;
  id: string;
  created_time: number;
  db_version: string;
  version: string;
  owner: any;
};

export type GraphResponse = {
  total: number;
  page: number;
  page_size: number;
  data: Graph[];
};