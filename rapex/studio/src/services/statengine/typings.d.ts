declare namespace StatEngineAPI {
  type Chart = {
    name: string;
    version: string;
    description: string;
    category: string;
    home: string;
    source: string;
    short_name: string;
    icons: { src?: string; type?: string; sizes?: string }[];
    author: string;
    maintainers: string[];
    tags: string[];
    readme: string;
    id: string;
  };

  type ChartDataResponse = {
    total: number;
    page: number;
    page_size: number;
    data: Chart[];
  };

  type ChartSchema = {
    schema: {
      fields?: {
        key?: string;
        dataIndex?: string;
        valueType?: string;
        title?: string;
        tooltip?: string;
        valueEnum?: Record<string, any>;
        formItemProps: { rules?: { required?: boolean; message?: string }[]; initialValue?: any };
        fieldProps: { mode?: string; step?: number };
      }[];
      dataKey: { data?: string };
      examples?: {
        title?: string;
        key?: string;
        datafile?: string;
        // Such as the following type definition.
        // {
        //   corr_vars?: string[];
        //   sig_level?: number;
        //   hc_order?: boolean;
        //   hc_method?: string;
        //   corr_type?: string;
        //   method?: string;
        // }
        arguments: Record<string, any>;
      }[];
    };
    readme: string;
  };

  type ChartTaskResponse = {
    response: {
      log?: string;
      results?: string[];
      charts?: string[];
      response_type?: string;
      task_id?: string;
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

  type getChartsParams = {
    /** Which page? */
    page?: number;
    /** Page size */
    page_size?: number;
  };

  type getChartsUiSchemaChartNameParams = {
    chart_name: string;
  };

  type getTasksIdParams = {
    /** Task ID */
    id: string;
  };

  type postChartsChartNameParams = {
    chart_name: string;
  };

  type TaskCreationResponse = {
    /** 任务ID */
    task_id: string;
  };
}
