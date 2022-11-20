import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { message, Row } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import { map } from 'lodash';
import { CSVLink } from "react-csv";
import React, { useRef, useState } from 'react';
import GeneSearcher from '@/components/GeneSearcher';
import type { GenesQueryParams, GeneDataResponse } from '@/components/GeneSearcher'
import { FormattedMessage } from 'umi';
import { makeQueryStr } from './util';
import './index.less';

type PathwayQueryParams = {
  /** Query string with honeysql specification. */
  query_str: string;
  /** Page, From 1. */
  page?: number;
  /** Num of items per page. */
  page_size?: number;
};

type PathwayData = {
  entrez_id: number;
  pathway_id: string;
  gene_symbol: string;
  ensembl_id: string;
  pathway_name: string;
};

type PathwayDataResponse = {
  total: number;
  page: number;
  page_size: number;
  data: PathwayData[];
};

type PageParams = {
  current?: number | undefined;
  pageSize?: number | undefined;
};

function formatResponse(response: PathwayDataResponse): Promise<Partial<PathwayDataResponse>> {
  return Promise.resolve({
    ...response,
    success: true,
    data: map(response.data, (item: any) => {
      return { key: `${item.pathway_id}_${item.ensembl_id}`, ...item };
    }),
  });
}

export type KEGGPathwayProps = {
  queryPathways: (params: PathwayQueryParams) => Promise<PathwayDataResponse>;
  queryGenes: (params: GenesQueryParams) => Promise<GeneDataResponse>;
};

const KEGGPathway: React.FC<KEGGPathwayProps> = (props) => {
  const { queryPathways, queryGenes } = props;
  // const [showDetail, setShowDetail] = useState<boolean>(false);

  const requestPathways = async (
    params: PageParams & PathwayData,
    sort: Record<string, SortOrder>,
    filter: Record<string, React.ReactText[] | null>,
  ) => {
    console.log('requestPathways: ', params, sort, filter);
    const query_str = makeQueryStr(params, sort, filter);
    return await queryPathways({
      page: params.current,
      page_size: params.pageSize,
      query_str: query_str,
    })
      .then((response) => {
        return formatResponse(response);
      })
      .catch((error) => {
        console.log('requestPathways Error: ', error);
        return formatResponse({ total: 0, page: 1, page_size: 10, data: [] });
      });
  };

  const actionRef = useRef<ActionType>();
  // const [currentRow, setCurrentRow] = useState<PathwayData>();
  const [selectedRowsState, setSelectedRows] = useState<PathwayData[]>([]);

  const columns: ProColumns<PathwayData>[] = [
    {
      title: <FormattedMessage id="pages.KEGGPathway.pathwayId" defaultMessage="Pathway ID" />,
      dataIndex: 'pathway_id',
      sorter: true,
      tip: 'Each pathway map is identified by the combination of 2-4 letter prefix code and 5 digit number.',
      render: (dom, entity) => {
        return (
          <a
            href={`https://www.kegg.jp/entry/${entity.pathway_id}`}
            rel="noreferrer"
            target="_blank"
          >
            {dom}
          </a>
        );
      },
    },
    {
      title: <FormattedMessage id="pages.KEGGPathway.pathwayName" defaultMessage="Pathway Name" />,
      align: 'center',
      sorter: true,
      dataIndex: 'pathway_name',
      tip: 'The name of a KEGG pathway.',
    },
    {
      title: <FormattedMessage id="pages.KEGGPathway.gene" defaultMessage="Gene" />,
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
            style={{ width: '300px' }}
          />
        );
      }
    },
    {
      title: <FormattedMessage id="pages.KEGGPathway.geneSymbol" defaultMessage="Gene Symbol" />,
      align: 'center',
      hideInSearch: true,
      dataIndex: 'gene_symbol',
      sorter: true,
      tip: 'A gene symbol is a short-form abbreviation for a particular gene.',
      // render: (dom, entity) => {
      //     return (
      //         <a
      //             onClick={() => {
      //                 // setCurrentRow(entity);
      //                 // setShowDetail(true);
      //             }}
      //         >
      //             {dom}
      //         </a>
      //     );
      // },
    },
    {
      title: <FormattedMessage id="pages.KEGGPathway.ensemblId" defaultMessage="Ensembl ID" />,
      dataIndex: 'ensembl_id',
      hideInSearch: true,
      sorter: true,
      tip: 'Ensembl gene IDs begin with ENS for Ensembl, and then a G for gene.',
      // render: (dom, entity) => {
      //     return (
      //         <a
      //             onClick={() => {
      //                 // setCurrentRow(entity);
      //                 // setShowDetail(true);
      //             }}
      //         >
      //             {dom}
      //         </a>
      //     );
      // },
    },
    {
      title: <FormattedMessage id="pages.KEGGPathway.entrezId" defaultMessage="Entrez ID" />,
      align: 'center',
      sorter: true,
      hideInSearch: true,
      dataIndex: 'entrez_id',
      tip: 'Entrez Gene provides unique integer identifiers for genes and other loci.',
      // render: (dom, entity) => {
      //     return (
      //         <a
      //             onClick={() => {
      //                 // setCurrentRow(entity);
      //                 // setShowDetail(true);
      //             }}
      //         >
      //             {dom}
      //         </a>
      //     );
      // },
    },
  ];

  return (
    <Row className="keggpathway">
      <ProTable<PathwayData, PageParams & PathwayData>
        className="keggpathway__table"
        actionRef={actionRef}
        rowKey="key"
        search={{
          labelWidth: 120,
          defaultCollapsed: false,
        }}
        pagination={{
          showQuickJumper: true,
          position: ['topLeft'],
        }}
        request={requestPathways}
        columns={columns}
        rowSelection={
          {
            onChange: (_, selectedRows) => {
              setSelectedRows(selectedRows);
            },
          }
        }
        cardBordered
        toolbar={{
          actions: [
            <CSVLink data={selectedRowsState}
              filename="download-pathway.csv"
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

export default KEGGPathway;
