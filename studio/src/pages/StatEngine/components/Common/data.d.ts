export declare type TableData = object[] | [];

export declare type PapaTableData = {
  name: string;
  error: Record<string, unknown>;
  data: TableData;
};

export declare type DataSourceType = 'csvFile' | 'apiData';

export declare type DataSource = string;

export declare type DataType = 'objectArray' | '2dArray';

export declare type QueryParams = object;

export declare type DataLoader = {
  dataSource: DataSource;
  dataSourceType: DataSourceType;
  dataType: DataType;
  queryParams: QueryParams;
};

export declare type LangItem = {
  id: string;
  defaultMessage: string;
};

export declare type LangData = Record<string, LangItem>;
