import { message, Row, Drawer, Table } from 'antd';
// import MarkdownViewer from '@/components/MarkdownViewer';
import React, { useEffect, useState } from 'react';
import { getDatasets } from '@/services/swagger/StatEngine';
import { FormattedMessage } from 'umi';
import HelpMessage from '@/components/HelpMessage';
import './index.less';


export type DataType = {
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
  dataset_abbr: string;
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

type DatasetListProps = {
  selectDataset?: (record: DataType) => void;
}

const DatasetList: React.FC<DatasetListProps> = (props) => {
  // const [showDetail, setShowDetail] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<DataType[] | undefined>(undefined);
  // const [dataset, setDataset] = useState<string | null>(null);

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
      title: <FormattedMessage id="pages.DatasetList.datasetAbbr" defaultMessage="Dataset ID" />,
      dataIndex: 'dataset_abbr',
      key: 'dataset_abbr',
      width: 90,
      fixed: true,
      align: 'center',
      tip: ''
    },
    {
      title: <FormattedMessage id="pages.DatasetList.pmid" defaultMessage="PMID" />,
      dataIndex: 'pmid',
      key: 'pmid',
      tip: 'Pubmed ID.',
      fixed: true,
      render: (dom: any, entity: any) => {
        return (
          <a target="_blank" href={`https://pubmed.ncbi.nlm.nih.gov/${entity.pmid}`}>
            {dom}
          </a >
        );
      },
      width: 100,
    },
    {
      title: <FormattedMessage id="pages.DatasetList.database" defaultMessage="Database" />,
      dataIndex: 'external_db_id',
      key: 'external_db_id',
      width: 100,
      align: 'center',
      fixed: true,
      render: (dom: any, entity: any) => {
        return (
          <a target="_blank" href={`https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${entity.external_db_id}`}>
            {dom}
          </a>
        )
      },
      tip: ''
    },
    // {
    //   title: <FormattedMessage id="pages.DatasetList.authors" defaultMessage="Authors" />,
    //   dataIndex: 'authors',
    // },
    {
      title: <FormattedMessage id="pages.DatasetList.title" defaultMessage="Title" />,
      dataIndex: 'title',
      key: 'title',
      width: 500,
      tip: 'Article title.',
    },
    {
      title: <FormattedMessage id="pages.DatasetList.journal" defaultMessage="Journal" />,
      dataIndex: 'journal',
      key: 'journal',
      width: 200,
      tip: ''
    },
    {
      title: <FormattedMessage id="pages.DatasetList.year" defaultMessage="Year" />,
      dataIndex: 'year',
      key: 'year',
      width: 60,
      align: 'center',
      tip: ''
    },
    {
      title: <FormattedMessage id="pages.DatasetList.experimentType" defaultMessage="Exp Type" />,
      dataIndex: 'experiment_type',
      key: 'experiment_type',
      width: 120,
      align: 'center',
      tip: ''
    },
    {
      title: <FormattedMessage id="pages.DatasetList.species" defaultMessage="Species" />,
      dataIndex: 'species',
      key: 'species',
      width: 120,
      align: 'center',
      tip: ''
    },
    {
      title: <FormattedMessage id="pages.DatasetList.country" defaultMessage="Country" />,
      dataIndex: 'country',
      key: 'country',
      width: 80,
      align: 'center',
      tip: ''
    },
    {
      title: <FormattedMessage id="pages.DatasetList.sampleSize" defaultMessage="Size" />,
      dataIndex: 'sample_size',
      key: 'sample_size',
      width: 60,
      align: 'center',
      tip: ''
    },
    {
      title: <FormattedMessage id="pages.DatasetList.dataCategory" defaultMessage="Category" />,
      dataIndex: 'data_category',
      key: 'data_category',
      width: 90,
      align: 'center',
      tip: ''
    },
    {
      title: <FormattedMessage id="pages.DatasetList.action" defaultMessage="Action" />,
      key: 'actions',
      align: 'center',
      width: 90,
      fixed: 'right',
      render: (dom: any, entity: any) => {
        return (
          <a onClick={() => {
            if (props.selectDataset) {
              props.selectDataset(entity)
            } else {
              console.log("You need to specify a selectDataset function.")
            }
          }}>
            <FormattedMessage id="pages.DatasetList.select" defaultMessage="Select" />
          </a>
        )
      },
    }
  ];

  return (
    <Row className="dataset-list">
      <HelpMessage position='center'
        title={"All Datasets"}>
        <p>
          The dataset contained on the page is mainly obtained from the GEO database, and the table has listed the journal, title and PMID of the article corresponding to the dataset. The datasets sources are mainly homo sapiens,fewer sources of rats, and the Category consists of RNA-Seq and Microarray. Most of datasets are from the United States.
        </p>
      </HelpMessage>
      <Table dataSource={dataSource} columns={columns} rowKey="dataset_abbr"
        pagination={{ hideOnSinglePage: true, pageSize: 1000 }}
        scroll={{ x: 'calc(100vw - 200px)', y: 'calc(100vh - 100px)' }}
        size="small">
      </Table>

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
