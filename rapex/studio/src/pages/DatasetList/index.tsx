import { message, Row, Drawer, Table } from 'antd';
import MarkdownViewer from '@/components/MarkdownViewer';
import React, { useEffect, useState } from 'react';
import { getDatasets } from '@/services/swagger/StatEngine';
import { FormattedMessage } from 'umi';


type DataType = {
  pmid: number;
  title: string;
  journal: string;
  external_db_id: string;
  authors: string;
  year: number;
  doi: string;
  experiment_type: number;
  species: number;
  country: string;
  data_category: string;
}

type DataResponse = {
  data: DataType[];
  success: boolean;
}


function formatResponse(response: DataType[]): Promise<DataResponse> {
  return Promise.resolve({
    data: response,
    success: true,
  });
}

const DatasetList: React.FC = () => {
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<DataType[] | undefined>(undefined);
  const [dataset, setDataset] = useState<string | null>(null);

  const requestDatasets = async () => {
    return await getDatasets({
      params: {
        show_details: true
      }
    })
      .then((response) => {
        return formatResponse(response);
      })
      .catch((error) => {
        console.log('requestDEGs Error: ', error);
        return formatResponse([]);
      });
  };

  useEffect(() => {
    if (!dataSource) {
      requestDatasets().then(response => {
        setDataSource(response.data)
      })
    }
  })

  const columns = [
    {
      title: <FormattedMessage id="pages.DatasetList.pmid" defaultMessage="PMID" />,
      dataIndex: 'pmid',
      tip: 'Pubmed ID.',
      render: (dom: any, entity: any) => {
        return (
          <a target="_blank" href={`https://pubmed.ncbi.nlm.nih.gov/${entity.pmid}`}>
            {dom}
          </a >
        );
      },
    },
    {
      title: <FormattedMessage id="pages.DatasetList.title" defaultMessage="Title" />,
      dataIndex: 'title',
      tip: 'Article title.',
    },
    {
      title: <FormattedMessage id="pages.DatasetList.journal" defaultMessage="Journal" />,
      dataIndex: 'journal'
    },
    {
      title: <FormattedMessage id="pages.DatasetList.external_db_id" defaultMessage="Database" />,
      dataIndex: 'external_db_id',
    },
    // {
    //   title: <FormattedMessage id="pages.DatasetList.authors" defaultMessage="Authors" />,
    //   dataIndex: 'authors',
    // },
    {
      title: <FormattedMessage id="pages.DatasetList.year" defaultMessage="Year" />,
      dataIndex: 'year',
    },
    {
      title: <FormattedMessage id="pages.DatasetList.experimentType" defaultMessage="Exp Type" />,
      dataIndex: 'experiment_type',
    },
    {
      title: <FormattedMessage id="pages.DatasetList.species" defaultMessage="Species" />,
      dataIndex: 'species',
    },
    {
      title: <FormattedMessage id="pages.DatasetList.country" defaultMessage="Country" />,
      dataIndex: 'country',
    },
    {
      title: <FormattedMessage id="pages.DatasetList.sample_size" defaultMessage="Sample Size" />,
      dataIndex: 'sample_size',
    },
    {
      title: <FormattedMessage id="pages.DatasetList.dataCategory" defaultMessage="Data Category" />,
      dataIndex: 'data_category',
    },
    {
      title: <FormattedMessage id="pages.DatasetList.dataset_abbr" defaultMessage="Dataset Abbr" />,
      dataIndex: 'dataset_abbr',
    },
  ];

  return (
    <Row className="dataset-list">
      <Table dataSource={dataSource} columns={columns}
        pagination={{ hideOnSinglePage: true, pageSize: 1000 }}
        scroll={{ x: 'calc(100vw - 20px)', y: 'calc(100vh - 100px)' }}
        size="small" />

      {/* <Drawer
        width={'80%'}
        visible={showDetail}
        className="dataset-details"
        onClose={() => {
          setShowDetail(false)
          setDataset(null)
        }}
        closable={true}
        maskClosable={true}
      >
        <MarkdownViewer url={`https://pubmed.ncbi.nlm.nih.gov/${dataset}`}></MarkdownViewer>
      </Drawer> */}
    </Row>
  );
};

export default DatasetList;
