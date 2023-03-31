declare namespace API {
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
        formItemProps?: { rules?: { required?: boolean; message?: string }[]; initialValue?: any };
        fieldProps?: { mode?: any; step?: any };
        valueEnum?: any;
      }[];
      examples?: { title?: string; key?: string; arguments?: Record<string, any> }[];
    };
    readme: string;
  };

  type ChartTask = {
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

  type ChartTaskResponse = {
    total: number;
    page: number;
    page_size: number;
    data: ChartTask[];
  };

  type DBVersion = {
    id: number;
    applied: string;
    description: string;
  };

  type deleteTasksIdParams = {
    /** Task ID */
    id: string;
  };

  type ErrorMsg = {
    /** 错误信息 Error message */
    msg: string;
    /** 错误上下文 Error context */
    context: Record<string, any>;
  };

  type getChartsParams = {
    /** Which page? */
    page?: number;
    /** Page size */
    page_size?: number;
  };

  type getChartsUiSchemaChartNameParams = {
    chart_name: string;
    /** An id of dataset. */
    dataset?: string;
  };

  type getDatasetRapexDegsParams = {
    /** Query string with honeysql specification. */
    query_str: string;
    /** Page, From 1. */
    page?: number;
    /** Num of items per page. */
    page_size?: number;
    /** A standalone dataset. */
    dataset: string;
  };

  type getDatasetRapexGenesParams = {
    /** Query string with honeysql specification. */
    query_str: string;
    /** Page, From 1. */
    page?: number;
    /** Num of items per page. */
    page_size?: number;
    /** A standalone dataset. */
    dataset: string;
  };

  type getDatasetRapexPathwaysParams = {
    /** Query string with honeysql specification. */
    query_str: string;
    /** Page, From 1. */
    page?: number;
    /** Num of items per page. */
    page_size?: number;
    /** A standalone dataset. */
    dataset: string;
  };

  type getDatasetRapexSimilarGenesParams = {
    /** Queried ensembl id. */
    query_str: string;
    /** Page, From 1. */
    page?: number;
    /** Num of items per page. */
    page_size?: number;
    /** Organ name. */
    organ?: string;
    dataset: string;
  };

  type getDownloadParams = {
    /** A file link which prefix starts with oss://, minio:// or file://. */
    filelink: string;
  };

  type getLabelsParams = {
    /** Query string with honeysql specification. */
    query_str: string;
    /** Page, From 1. */
    page?: number;
    /** Num of items per page. */
    page_size?: number;
    /** Label type. */
    label_type: string;
  };

  type getMenusDatasetParams = {
    dataset: string;
  };

  type getNodePropertiesParams = {
    node_name?: string;
  };

  type getRapexGeneExprDataParams = {
    /** Query string with honeysql specification. */
    query_str: string;
    /** Page, From 1. */
    page?: number;
    /** Num of items per page. */
    page_size?: number;
    /** A standalone dataset. */
    dataset: string;
  };

  type getTasksIdParams = {
    /** Task ID */
    id: string;
  };

  type getTasksParams = {
    /** Page, From 1. */
    page?: number;
    /** Num of items per page. */
    page_size?: number;
    /** Owner name that you want to query. */
    owner?: string;
    /** Filter tasks by plugin_type field. */
    plugin_type?: string;
    /** Filter results by status field. */
    status?: string;
    /** The name of the plugin */
    plugin_name?: string;
  };

  type postChartsChartNameParams = {
    chart_name: string;
  };

  type postNodesParams = {
    query_str?: string;
  };

  type RapexDEGData = {
    pvalue: number;
    ensembl_id: string;
    method: string;
    datatype: string;
    padj: number;
    gene_symbol: string;
    entrez_id: string;
    organ: string;
    id: number;
    logfc: number;
    direction: string;
  };

  type RapexDEGDataResponse = {
    total: number;
    page: number;
    page_size: number;
    data: RapexDEGData[];
  };

  type RapexExprData = {
    ensembl_id: string;
  };

  type RapexExprDataResponse = {
    /** 页码 Page, From 1. */
    page: number;
    /** 条目数 Num of items per page. */
    page_size: number;
    /** 数据 Records. */
    data: RapexExprData[];
    /** 总数 How many records. */
    total: number;
  };

  type RapexGeneData = {
    ensembl_id: string;
    entrez_id: number;
    gene_symbol: string;
    description: string;
    pfam: string;
    chromosome: number;
    mgi_id: string;
    pubmed_ids: string;
    taxid: number;
    swiss_p: string;
    name: string;
    strand: number;
    start: number;
    end: number;
    prosite: string;
    type_of_gene: string;
    alias: string;
    pdb: string;
    pubmed: string;
  };

  type RapexGeneDataResponse = {
    total: number;
    page: number;
    page_size: number;
    data: RapexGeneData[];
  };

  type RapexPathwayData = {
    entrez_id: number;
    pathway_id: string;
    gene_symbol: string;
    ensembl_id: string;
    pathway_name: string;
  };

  type RapexPathwayDataResponse = {
    total: number;
    page: number;
    page_size: number;
    data: RapexPathwayData[];
  };

  type RapexSimilarGenesData = {
    queried_ensembl_id: string;
    ensembl_id: string;
    pcc: number;
    pvalue: string;
    queried_gene_symbol: string;
    queried_entrez_id: number;
    gene_symbol: string;
    entrez_id: number;
  };

  type RapexSimilarGenesDataResponse = {
    total: number;
    page: number;
    page_size: number;
    data: RapexSimilarGenesData[];
  };

  type TaskCreationResponse = {
    /** 任务ID */
    task_id: string;
  };

  type Version = {
    /** 版本信息 */
    version: string;
    /** 数据库版本信息 */
    db_version: DBVersion;
  };
}
