import { getDegs } from '@/services/swagger/OmicsData';
import type { ActionType, ProColumns, RequestData } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Row } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import React, { useRef } from 'react';
import { FormattedMessage } from 'umi';
import { makeQueryStr } from '../util';
import './index.less';

interface DataType {
  ensembl_id: string;
  entrez_id: string;
  gene_symbol: string;
  padj: number;
  pvalue: number;
  logfc: number;
  direction: string;
}

type PageParams = {
  current?: number | undefined;
  pageSize?: number | undefined;
};

function formatResponse(response: RequestData<DataType>): Promise<Partial<RequestData<DataType>>> {
  return Promise.resolve({
    ...response,
    success: true,
  });
}

const requestDEGs = async (
  params: PageParams,
  sort: Record<string, SortOrder>,
  filter: Record<string, React.ReactText[] | null>,
) => {
  console.log('requestDEGs: ', sort, filter);
  return await getDegs({
    page: params.current,
    page_size: params.pageSize,
    query_str: makeQueryStr('gut_000000_fpkm_ttest', params, sort, filter),
  })
    .then((response) => {
      return formatResponse(response);
    })
    .catch((error) => {
      console.log('requestDEGs Error: ', error);
      return formatResponse({ total: 0, success: true, data: [] });
    });
};

const GeneList: React.FC = () => {
  // const [showDetail, setShowDetail] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  // const [currentRow, setCurrentRow] = useState<DataType>();
  // const [selectedRowsState, setSelectedRows] = useState<DataType[]>([]);

  const columns: ProColumns<DataType>[] = [
    {
      title: <FormattedMessage id="pages.GeneList.ensemblId" defaultMessage="Ensembl ID" />,
      dataIndex: 'ensembl_id',
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
      title: <FormattedMessage id="pages.GeneList.entrezId" defaultMessage="Entrez ID" />,
      align: 'center',
      sorter: true,
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
    {
      title: <FormattedMessage id="pages.GeneList.geneSymbol" defaultMessage="Gene Symbol" />,
      align: 'center',
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
      title: <FormattedMessage id="pages.GeneList.pAdj" defaultMessage="Adjusted Pvalue" />,
      align: 'center',
      hideInSearch: true,
      dataIndex: 'padj',
      sorter: true,
      tip: 'Adjusted Pvalue.',
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
      title: <FormattedMessage id="pages.GeneList.pvalue" defaultMessage="Pvalue" />,
      align: 'center',
      hideInSearch: true,
      dataIndex: 'pvalue',
      sorter: true,
      tip: 'A p-value is a statistical measurement used to validate a hypothesis against observed data.',
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
      title: <FormattedMessage id="pages.GeneList.logfc" defaultMessage="LogFC" />,
      align: 'center',
      hideInSearch: true,
      dataIndex: 'logfc',
      sorter: true,
      tip: 'Log fold change = log(FC) Usually, the transformation is log at base 2, so the interpretation is straightforward: a log(FC) of 1 means twice as expressed.',
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
      title: <FormattedMessage id="pages.GeneList.direction" defaultMessage="Direction" />,
      align: 'center',
      dataIndex: 'direction',
      sorter: true,
      tip: '`Up` means up-regulated, `Down` means down-regulated and `No` means no difference.',
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
    <Row className="genelist">
      <ProTable<DataType, PageParams>
        className="genelist__table"
        actionRef={actionRef}
        rowKey="key"
        search={{
          labelWidth: 120,
        }}
        pagination={{
          showQuickJumper: true,
          position: ['topLeft'],
        }}
        request={requestDEGs}
        columns={columns}
        rowSelection={
          {
            // onChange: (_, selectedRows) => {
            //     setSelectedRows(selectedRows);
            // },
          }
        }
      />
    </Row>
  );
};

export default GeneList;
