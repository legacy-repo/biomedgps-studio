export declare namespace StatEngineAPI {
  export type Chart = {
    id: string;
    name: string;
    version: string;
    description: string;
    category: string;
    home: string;
    source: string;
    short_name: string;
    icons: {
      src: string;
      type: string;
      sizes: string;
    }[];
    author: string;
    maintainers: string[];
    tags: string[];
    readme: string;
  };

  export type ChartDataResponse = {
    total: number;
    page: number;
    page_size: number;
    data: Chart[];
  };

  export type ChartSchema = {
    schema: {
      fields: any[];
      dataKey: {
        data: string;
      };
      examples: any[];
    };
    readme: string;
  };

  export type ChartTaskResponse = {
    response: {
      log: string;
      results: string[];
      charts: string[];
      response_type: string;
      task_id: string;
    };
    description: string;
    finished_time: any;
    plugin_name: string;
    payload: Record<string, any>;
    name: string;
    plugin_type: string;
    percentage: number;
    status: string;
    id: string;
    started_time: number;
    plugin_version: string;
    owner: any;
  };

  export type GetChartsParams = {
    /** Which page? */
    page?: number;
    /** Page size */
    page_size?: number;
  };

  export type GetChartUiSchemaParams = {
    chart_name: string;
  };

  export type GetTasksIdParams = {
    /** Task ID */
    id: string;
  };

  export type PostChartParams = {
    chart_name: string;
  };

  export type TaskCreationResponse = {
    /** 任务ID */
    task_id: string;
  };
}
