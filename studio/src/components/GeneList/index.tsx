import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { message, Row } from 'antd';
import { CSVLink } from "react-csv";
import type { SortOrder } from 'antd/es/table/interface';
import React, { useRef, useState, memo } from 'react';
import { useHistory } from 'react-router-dom';
import GeneSearcher from '@/components/GeneSearcher';
import type { GenesQueryParams, GeneDataResponse } from '@/components/GeneSearcher'
import { FormattedMessage, useModel } from 'umi';
import { makeQueryStr } from './util';

import './index.less';

type DEGQueryParams = {
  /** Query string with honeysql specification. */
  query_str: string;
  /** Page, From 1. */
  page?: number;
  /** Num of items per page. */
  page_size?: number;
  dataset?: string;
};

type DataType = {
  id: number;
  ensembl_id: string;
  entrez_id: string;
  gene_symbol: string;
  organ: string;
  method: string;
  datatype: string;
  dataset?: string;
  padj: number;
  pvalue: number;
  logfc: number;
  direction: string;
}

type DEGDataResponse = {
  total: number;
  page: number;
  page_size: number;
  data: DataType[];
};

type PageParams = {
  current?: number | undefined;
  pageSize?: number | undefined;
};

function formatResponse(response: DEGDataResponse): Promise<Partial<DEGDataResponse>> {
  return Promise.resolve({
    ...response,
    success: true,
  });
}

export type GeneListProps = {
  queryDEGs: (params: DEGQueryParams) => Promise<DEGDataResponse>;
  queryGenes: (params: GenesQueryParams) => Promise<GeneDataResponse>;
  queryGeneBaseUrl?: string;
};

const GeneList: React.FC<GeneListProps> = (props) => {
  const history = useHistory();
  const { queryDEGs, queryGenes, queryGeneBaseUrl } = props;
  // const [showDetail, setShowDetail] = useState<boolean>(false);

  const { initialState } = useModel('@@initialState');

  let datasetSelectOptions = {}
  const defaultDataset = initialState?.customSettings?.defaultDataset;
  if (defaultDataset) {
    datasetSelectOptions[defaultDataset] = {
      text: defaultDataset
    }
  }

  const requestDEGs = async (
    params: PageParams & DataType,
    sort: Record<string, SortOrder>,
    filter: Record<string, React.ReactText[] | null>,
  ) => {
    console.log('requestDEGs: ', sort, filter);
    if (params.method && params.datatype && params.organ) {
      return await queryDEGs({
        page: params.current,
        page_size: params.pageSize,
        query_str: makeQueryStr(params, sort, filter),
        dataset: `${params.dataset}`,
      })
        .then((response) => {
          return formatResponse(response);
        })
        .catch((error) => {
          console.log('requestDEGs Error: ', error);
          return formatResponse({ total: 0, page: 1, page_size: 10, data: [] });
        });
    } else {
      return formatResponse({ total: 0, page: 1, page_size: 10, data: [] });
    }
  };

  const actionRef = useRef<ActionType>();
  // const [currentRow, setCurrentRow] = useState<DataType>();
  const [selectedRowsState, setSelectedRows] = useState<DataType[]>([]);

  const columns: ProColumns<DataType>[] = [
    {
      title: <FormattedMessage id="pages.GeneList.gene" defaultMessage="Gene" />,
      dataIndex: 'queried_id',
      sorter: true,
      hideInForm: true,
      hideInSetting: true,
      hideInTable: true,
      fieldProps: {
        placeholder: 'Please input a gene symbol, ensembl id or entrez id.'
      },
      tip: 'Ensembl gene IDs begin with ENS for Ensembl, and then a G for gene.',
      renderFormItem: (_, { type, defaultRender, ...rest }, form) => {
        if (type === 'form') {
          return null;
        }

        return (
          <GeneSearcher
            queryGenes={queryGenes}
            {...rest}
            style={{ width: '280px' }}
          />
        );
      }
    },
    {
      title: <FormattedMessage id="pages.GeneList.ensemblId" defaultMessage="Ensembl ID" />,
      dataIndex: 'ensembl_id',
      sorter: true,
      hideInSearch: true,
      width: '180px',
      tip: 'Ensembl gene IDs begin with ENS for Ensembl, and then a G for gene.',
      render: (dom, entity) => {
        return (
          <a
            onClick={() => {
              if (queryGeneBaseUrl) {
                history.push(`${queryGeneBaseUrl}${entity.ensembl_id}`);
              } else {
                console.log("You need to set queryGeneBaseUrl.");
              }
            }}
          >
            {dom}
          </a>
        );
      },
    },
    {
      title: <FormattedMessage id="pages.GeneList.entrezId" defaultMessage="Entrez ID" />,
      align: 'center',
      sorter: true,
      hideInSearch: true,
      dataIndex: 'entrez_id',
      tip: 'Entrez Gene provides unique integer identifiers for genes and other loci.',
      render: (dom, entity) => {
        return (
          <a
            onClick={() => {
              if (queryGeneBaseUrl) {
                history.push(`${queryGeneBaseUrl}${entity.ensembl_id}`);
              } else {
                console.log("You need to set queryGeneBaseUrl.");
              }
            }}
          >
            {dom}
          </a>
        );
      },
    },
    {
      title: <FormattedMessage id="pages.GeneList.geneSymbol" defaultMessage="Gene Symbol" />,
      align: 'center',
      dataIndex: 'gene_symbol',
      hideInSearch: true,
      sorter: true,
      tip: 'A gene symbol is a short-form abbreviation for a particular gene.',
      render: (dom, entity) => {
        return (
          <a
            onClick={() => {
              if (queryGeneBaseUrl) {
                history.push(`${queryGeneBaseUrl}${entity.ensembl_id}`);
              } else {
                console.log("You need to set queryGeneBaseUrl.");
              }
            }}
          >
            {dom}
          </a>
        );
      },
    },
    {
      title: <FormattedMessage id="pages.GeneList.organ" defaultMessage="Organ" />,
      align: 'center',
      dataIndex: 'organ',
      sorter: true,
      tip: 'Organ name.',
      valueType: 'select',
      formItemProps: {
        required: true
      },
      valueEnum: {
        gut: { text: "Gut" },
        kdn: { text: "Kidney" },
        hrt: { text: "Heart" },
        lng: { text: "Lung" },
        lvr: { text: "Liver" },
        tst: { text: "Testis" },
        tyr: { text: "Thyroid" },
        brn: { text: "Brain" }
      },
    },
    {
      title: <FormattedMessage id="pages.GeneList.method" defaultMessage="Method" />,
      align: 'center',
      dataIndex: 'method',
      sorter: true,
      valueType: 'select',
      formItemProps: {
        required: true
      },
      valueEnum: {
        ttest: { text: "T Test" },
        wilcox: { text: "Wilcox Test" },
        limma: { text: "Limma" }
      },
      tip: 'Stat method, such as ttest, wilcox.'
    },
    {
      title: <FormattedMessage id="pages.GeneList.datatype" defaultMessage="Data Type" />,
      align: 'center',
      dataIndex: 'datatype',
      sorter: true,
      tip: 'Data type, such as FPKM, TPM, Counts.',
      valueType: 'select',
      formItemProps: {
        required: true
      },
      valueEnum: {
        fpkm: { text: "FPKM" },
        tpm: { text: "TPM" },
        counts: { text: "Counts" }
      },
    },
    {
      title: <FormattedMessage id="pages.GeneList.dataset" defaultMessage="Dataset" />,
      align: 'center',
      dataIndex: 'dataset',
      valueType: 'select',
      valueEnum: datasetSelectOptions,
      initialValue: '000000'
      // valueEnum: {
      //   0: { text: "rapex_000000" }
      // },
    },
    {
      title: <FormattedMessage id="pages.GeneList.pAdj" defaultMessage="AdjPvalue" />,
      align: 'center',
      hideInSearch: true,
      dataIndex: 'padj',
      sorter: true
    },
    {
      title: <FormattedMessage id="pages.GeneList.pvalue" defaultMessage="Pvalue" />,
      align: 'center',
      hideInSearch: true,
      dataIndex: 'pvalue',
      width: '80px',
      sorter: true
    },
    {
      title: <FormattedMessage id="pages.GeneList.logfc" defaultMessage="LogFC" />,
      align: 'center',
      hideInSearch: true,
      dataIndex: 'logfc',
      sorter: true,
      width: '80px',
      tip: 'Log fold change = log(FC) Usually, the transformation is log at base 2, so the interpretation is straightforward: a log(FC) of 1 means twice as expressed.',
    },
    {
      title: <FormattedMessage id="pages.GeneList.direction" defaultMessage="Direction" />,
      align: 'center',
      dataIndex: 'direction',
      hideInSearch: true,
      sorter: true,
      width: '100px',
      tip: '`Up` means up-regulated, `Down` means down-regulated and `No` means no difference.',
      valueType: 'select',
      valueEnum: {
        up: { text: "Up" },
        down: { text: "Down" },
        no: { text: "No" }
      },
    },
  ];

  return (
    <Row className="genelist">
      <ProTable<DataType, PageParams>
        scroll={{ y: 'calc(100vh - 200px)' }}
        className="genelist__table"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
          showHiddenNum: true,
          defaultCollapsed: false,
          // Don't worry it.
          searchText: <FormattedMessage id="pages.GeneList.analyze" defaultMessage="Analyze" />,
        }}
        pagination={{
          showQuickJumper: true,
          position: ['topLeft'],
        }}
        locale={{
          emptyText: <b><FormattedMessage id="pages.GeneList.nodata" defaultMessage="Please input the parameters for analyzing diff genes." /></b>,
        }}
        cardBordered
        request={requestDEGs}
        columns={columns}
        rowSelection={
          {
            onChange: (_, selectedRows) => {
              setSelectedRows(selectedRows);
            },
          }
        }
        toolbar={{
          actions: [
            <CSVLink data={selectedRowsState}
              filename="download-degs.csv"
              onClick={() => {
                if (selectedRowsState.length == 0) {
                  message.warn("Please select records firstly.")
                  return false;
                } else {
                  return true;
                }
              }}>
              <FormattedMessage id="pages.GeneList.download" defaultMessage="Download" />
            </CSVLink>
          ]
        }}
      />
    </Row>
  );
};

export default memo(GeneList);
