import { getDegs } from '@/services/swagger/OmicsData';
import type { ActionType, ProColumns, RequestData } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { message, Row } from 'antd';
import { CSVLink } from "react-csv";
import type { SortOrder } from 'antd/es/table/interface';
import React, { useRef, useState } from 'react';
import { FormattedMessage } from 'umi';
import { makeQueryStr } from '../util';
import './index.less';

interface DataType {
  id: string;
  ensembl_id: string;
  entrez_id: string;
  gene_symbol: string;
  organ: string;
  method: string;
  dataset: string;
  datatype: string;
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
    query_str: makeQueryStr('data', params, sort, filter),
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
  const [selectedRowsState, setSelectedRows] = useState<DataType[]>([]);

  const columns: ProColumns<DataType>[] = [
    {
      title: <FormattedMessage id="pages.GeneList.ensemblId" defaultMessage="Ensembl ID" />,
      dataIndex: 'ensembl_id',
      sorter: true,
      width: '180px',
      tip: 'Ensembl gene IDs begin with ENS for Ensembl, and then a G for gene.',
    },
    {
      title: <FormattedMessage id="pages.GeneList.entrezId" defaultMessage="Entrez ID" />,
      align: 'center',
      sorter: true,
      dataIndex: 'entrez_id',
      tip: 'Entrez Gene provides unique integer identifiers for genes and other loci.',
    },
    {
      title: <FormattedMessage id="pages.GeneList.geneSymbol" defaultMessage="Gene Symbol" />,
      align: 'center',
      dataIndex: 'gene_symbol',
      sorter: true,
      tip: 'A gene symbol is a short-form abbreviation for a particular gene.',
    },
    {
      title: <FormattedMessage id="pages.GeneList.organ" defaultMessage="Organ" />,
      align: 'center',
      dataIndex: 'organ',
      sorter: true,
      tip: 'Organ name.',
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
      title: <FormattedMessage id="pages.GeneList.method" defaultMessage="Method" />,
      align: 'center',
      dataIndex: 'method',
      sorter: true,
      valueType: 'select',
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
      valueEnum: {
        0: { text: "rapex_000000" }
      },
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
        scroll={{ y: 'calc(100vh - 240px)' }}
        className="genelist__table"
        actionRef={actionRef}
        rowKey="id"
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

export default GeneList;
