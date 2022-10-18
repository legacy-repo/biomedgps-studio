export declare type DataItem = {
  name: string;
  state: string;
};

export declare type LangItem = {
  id: string;
  defaultMessage: string;
};

export declare type LangData = Record<string, LangItem>;

export declare type ChartResult = {
  results: string[];
  charts: string[];
  task_id: string;
  log: string;
};

