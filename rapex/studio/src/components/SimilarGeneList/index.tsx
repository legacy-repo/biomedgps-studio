import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { message, Row } from 'antd';
import { CSVLink } from "react-csv";
import type { SortOrder } from 'antd/es/table/interface';
import React, { useEffect, useRef, useState } from 'react';
import GeneSearcher from '@/components/GeneSearcher';
import type { GenesQueryParams, GeneDataResponse } from '@/components/GeneSearcher'
import { FormattedMessage } from 'umi';
import { makeQueryStr } from './util';
import './index.less';

type SimilarGenesQueryParams = {
  query_str: string;
  organ?: string;
  dataset?: string;
  /** Page, From 1. */
  page?: number;
  /** Num of items per page. */
  page_size?: number;
};

type DataType = {
  query_str: string;
  queried_ensembl_id: string;
  queried_entrez_id: string;
  queried_gene_symbol: string;
  ensembl_id: string;
  entrez_id: string;
  gene_symbol: string;
  pcc: number;
  pvalue: number;
}

type SimilarGenesDataResponse = {
  total: number;
  page: number;
  page_size: number;
  data: DataType[];
};

type PageParams = {
  current?: number | undefined;
  pageSize?: number | undefined;
};

function formatResponse(response: SimilarGenesDataResponse): Promise<Partial<SimilarGenesDataResponse>> {
  return Promise.resolve({
    ...response,
    success: true,
  });
}

export type SimilarGeneListProps = {
  ensemblId?: string;
  showDetails?: (ensemblId: string) => void;
  querySimilarGenes: (params: SimilarGenesQueryParams) => Promise<SimilarGenesDataResponse>;
  queryGenes: (params: GenesQueryParams) => Promise<GeneDataResponse>;
};


const SimilarGeneList: React.FC<SimilarGeneListProps> = (props) => {
  const { querySimilarGenes, queryGenes, showDetails } = props;
  const [params, setParams] = useState<{}>({});
  const [searchToolbar, setSearchToolbar] = useState<false | any>();
  const actionRef = useRef<ActionType>();
  // const [currentRow, setCurrentRow] = useState<DataType>();
  const [selectedRowsState, setSelectedRows] = useState<DataType[]>([]);

  useEffect(() => {
    if (props.ensemblId) {
      setSearchToolbar(false);
      setParams({
        queried_id: props.ensemblId
      });
    } else {
      setSearchToolbar({
        labelWidth: 120,
        defaultCollapsed: false,
        // Don't worry it.
        searchText: <FormattedMessage id="pages.SimilarGeneList.analyze" defaultMessage="Analyze" />,
      });
    }
  }, [props.ensemblId])

  const requestDEGs = async (
    params: PageParams & SimilarGenesQueryParams,
    sort: Record<string, SortOrder>,
    filter: Record<string, React.ReactText[] | null>,
  ) => {
    console.log('requestDEGs: ', sort, filter);
    return await querySimilarGenes({
      page: params.current,
      page_size: params.pageSize,
      query_str: makeQueryStr(params, sort, filter),
      organ: params.organ,
      dataset: params.dataset
    })
      .then((response) => {
        return formatResponse(response);
      })
      .catch((error) => {
        console.log('requestDEGs Error: ', error);
        return formatResponse({ total: 0, page: 1, page_size: 10, data: [] });
      });
  };

  const columns: ProColumns<DataType>[] = [
    {
      title: <FormattedMessage id="pages.SimilarGeneList.gene" defaultMessage="Gene" />,
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
      title: <FormattedMessage id="pages.SimilarGeneList.ensemblId" defaultMessage="Ensembl ID" />,
      dataIndex: 'ensembl_id',
      sorter: true,
      hideInForm: true,
      hideInSearch: true,
      hideInSetting: true,
      width: '180px',
      tip: 'Ensembl gene IDs begin with ENS for Ensembl, and then a G for gene.',
      render: (dom: any, entity: any) => {
        return (
          <a
            style={{ cursor: props.ensemblId ? 'unset' : 'pointer' }}
            onClick={() => {
              if (!props.ensemblId) {
                showDetails ? showDetails(entity.ensembl_id) : null
              }
            }}
          >
            {dom}
          </a>
        );
      },
    },
    {
      title: <FormattedMessage id="pages.SimilarGeneList.entrezId" defaultMessage="Entrez ID" />,
      align: 'center',
      sorter: true,
      hideInForm: true,
      hideInSearch: true,
      dataIndex: 'entrez_id',
      tip: 'Entrez Gene provides unique integer identifiers for genes and other loci.',
    },
    {
      title: <FormattedMessage id="pages.SimilarGeneList.geneSymbol" defaultMessage="Gene Symbol" />,
      align: 'center',
      hideInForm: true,
      hideInSearch: true,
      dataIndex: 'gene_symbol',
      sorter: true,
      tip: 'A gene symbol is a short-form abbreviation for a particular gene.',
    },
    {
      title: <FormattedMessage id="pages.SimilarGeneList.organ" defaultMessage="Organ" />,
      align: 'center',
      dataIndex: 'organ',
      sorter: true,
      hideInForm: true,
      hideInSetting: true,
      hideInTable: true,
      tip: 'Organ name.',
      initialValue: "gut",
      valueType: 'select',
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
      title: <FormattedMessage id="pages.SimilarGeneList.dataset" defaultMessage="Dataset" />,
      align: 'center',
      dataIndex: 'dataset',
      valueType: 'select',
      hideInForm: true,
      hideInSetting: true,
      hideInTable: true,
      initialValue: "000000",
      valueEnum: {
        "000000": { text: "rapex_000000" }
      },
    },
    {
      title: <FormattedMessage id="pages.SimilarGeneList.pvalue" defaultMessage="Pvalue" />,
      align: 'center',
      hideInSearch: true,
      dataIndex: 'pvalue',
      width: '80px',
      sorter: true,
      render: (dom, entity) => {
        return (
          <span>{parseFloat(entity.pvalue).toFixed(5)}</span>
        );
      },
    },
    {
      title: <FormattedMessage id="pages.SimilarGeneList.PCC" defaultMessage="PCC" />,
      align: 'center',
      hideInSearch: true,
      dataIndex: 'pcc',
      sorter: true,
      tip: 'Pearson correlation coefficient.',
      render: (dom, entity) => {
        return (
          <span>{entity.pcc.toFixed(3)}</span>
        );
      },
    }
  ];

  return (
    <Row className="similar-genelist">
      <ProTable<DataType, PageParams>
        // scroll={{ y: 'calc(100vh - 150px)' }}
        className={props.ensemblId ? 'embeded_genelist_table' : 'genelist__table'}
        actionRef={actionRef}
        rowKey="ensembl_id"
        search={searchToolbar}
        cardBordered
        polling={undefined}
        locale={{
          emptyText: <b><FormattedMessage id="pages.SimilarGeneList.nodata" defaultMessage="Please input a gene symbol or ensembl id." /></b>,
        }}
        params={params}
        pagination={{
          showQuickJumper: true,
          position: ['topLeft'],
        }}
        // Don't worry it.
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
              <FormattedMessage id="pages.SimilarGeneList.download" defaultMessage="Download" />
            </CSVLink>
          ]
        }}
      />
    </Row>
  );
};

export default SimilarGeneList;
