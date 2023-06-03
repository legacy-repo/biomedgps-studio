import React, { useEffect } from 'react';
import { Space, Table, Modal, Button, Tree, Col, Row } from 'antd';
import type { GraphHistoryItem } from './typings';
import type { ColumnsType } from 'antd/es/table';
import UploadGraph from './UploadGraph';
import type { DataNode, DirectoryTreeProps } from 'antd/es/tree';
import './GraphTable.less';

const { DirectoryTree } = Tree;

type GraphTableProps = {
  graphs: GraphHistoryItem[];
  visible: boolean;
  onLoad: (graph: GraphHistoryItem, latestChild: GraphHistoryItem) => void;
  onDelete: (graph: GraphHistoryItem) => void;
  onClose: () => void;
  onUpload?: (graph: GraphHistoryItem) => void;
  parent?: HTMLElement;
  treeFormat?: boolean;
  selectedGraphId?: string;
};

type TreeGraph = GraphHistoryItem & {
  children?: TreeGraph[];
  title: string;
  key: string;
  isLeaf?: boolean;
}

const makeTree = (graphs: GraphHistoryItem[]): TreeGraph[] => {
  // Create a map of objects
  const objectMap = {};
  graphs.forEach(obj => {
    objectMap[obj.id] = obj;
  });

  // Build the tree structure
  const tree: TreeGraph[] = [];
  graphs.forEach(obj => {
    console.log("parent: ", obj.parent, "id: ", obj.id)
    if (obj.parent === obj.id) {
      // Root level object
      const root = {
        ...obj,
        // TODO: do we need to show the id?
        // title: obj.name + "-" + obj.id.slice(0, 8),
        title: obj.name,
        key: obj.id,
      };
      tree.push(root);
    } else {
      const parent = objectMap[obj.parent];
      if (parent) {
        // Add as a child to the parent object
        parent.children = parent.children || [];
        parent.children.push({
          ...obj,
          title: obj.name + "-" + obj.id.slice(0, 8),
          key: obj.id,
          isLeaf: true,
        });
      }
    }
  });

  // Flatten the tree structure
  const flatten = (tree: TreeGraph[]): TreeGraph[] => {
    let children: TreeGraph[] = [];
    tree.forEach(obj => {
      if (!obj.children) {
        children.push(obj);
      } else {
        children = children.concat(flatten(obj.children).concat([{ ...obj, children: undefined }]));
      }
    });

    return children;
  };

  const flattenedArray: TreeGraph[] = [];
  tree.forEach(obj => {
    if (obj.children) {
      obj.children = flatten(obj.children).concat({ ...obj, children: undefined });
    } else {
      obj.children = [{ ...obj, children: undefined }];
    }
    flattenedArray.push(obj);
  })

  console.log("makeTree", graphs, objectMap, tree, flattenedArray);

  return flattenedArray;
}

const GraphTable: React.FC<GraphTableProps> = (props) => {
  const defaultTreePanelSpan = 6;
  const [treeData, setTreeData] = React.useState<TreeGraph[]>([]);
  const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);
  const [tableData, setTableData] = React.useState<GraphHistoryItem[]>([]);
  const [treePanelSpan, setTreePanelSpan] = React.useState<number>(defaultTreePanelSpan);

  const columns: ColumnsType<GraphHistoryItem> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      width: 150,
      fixed: 'left',
    },
    // {
    //   title: 'Desc',
    //   dataIndex: 'description',
    //   key: 'description',
    //   align: 'center',
    // },
    {
      title: 'Created At',
      dataIndex: 'created_time',
      key: 'created_time',
      align: 'center',
      render: (created_time) => new Date(created_time).toLocaleString(),
      width: 200
    },
    {
      title: 'Version',
      key: 'version',
      align: 'center',
      dataIndex: 'version',
      width: 100
    },
    {
      title: 'UUID',
      key: 'id',
      align: 'center',
      dataIndex: 'id',
      width: 200
    },
    {
      title: 'DB Version',
      key: 'db_version',
      align: 'center',
      dataIndex: 'db_version',
      width: 150
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      fixed: 'right',
      width: 240,
      render: (_, record, index) => (
        <Space size="small">
          <Button size="small" type="link" disabled={props.selectedGraphId === record.id}
            onClick={(e) => {
              if (tableData) {
                const latestChild = tableData[index];
                if (latestChild) {
                  props.onLoad(record, latestChild);
                }
              } else {
                console.log("GraphTable load: something wrong.", tableData, index, record)
                props.onLoad(record, record)
              }
            }}>
            Load{props.selectedGraphId === record.id ? 'ed' : ''}
          </Button>
          <Button size="small" type="link" onClick={(e) => {
            // How to ensure the data format is suitable for the graph loader?
            const json = JSON.stringify(record);
            const blob = new Blob([json], { type: 'application/json' });
            const href = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = href;
            link.download = record.name + '.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}>
            Download
          </Button>
          <Button size="small" type="link" danger onClick={(e) => props.onDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const onSelect: DirectoryTreeProps['onSelect'] = (keys, info) => {
    console.log('Trigger Select', keys, info);
    if (info.selectedNodes[0] && info.selectedNodes[0].children) {
      const selectedNode = info.selectedNodes[0] as TreeGraph;
      setTableData(selectedNode.children as GraphHistoryItem[]);
      setSelectedKeys(keys as string[]);
    } else {
      setSelectedKeys([]);
      setTableData([]);
    }
  };

  const onExpand: DirectoryTreeProps['onExpand'] = (keys, info) => {
    console.log('Trigger Expand', keys, info);
  };

  useEffect(() => {
    if (props.treeFormat) {
      const defaultTreeData = makeTree(props.graphs);
      setTreeData(defaultTreeData);
      const defaultTableData = defaultTreeData[0] ? defaultTreeData[0].children as GraphHistoryItem[] : [];
      setTableData(defaultTableData);
      setTreePanelSpan(defaultTreePanelSpan);
      setSelectedKeys(defaultTreeData[0] ? [defaultTreeData[0].key] : []);
    } else {
      setTableData(props.graphs);
      setTreePanelSpan(0);
    }
  }, [props.graphs]);

  return <Modal className='graph-table' title="Graph Table" open={props.visible}
    width={1000} closable={true} onCancel={props.onClose}
    getContainer={props.parent ? props.parent : document.body}
    footer={
      props.onUpload ?
        [
          <UploadGraph key="upload-graph" onUpload={
            (graph: GraphHistoryItem) => {
              if (props.onUpload) {
                const newGraph = graph;
                // Don't worry about it. We just want to create a new graph not linked to any existing graph
                // @ts-ignore
                delete newGraph.parent;
                // @ts-ignore
                delete newGraph.created_time;
                props.onUpload(newGraph);
              }
            }
          }></UploadGraph>
        ] : null
    }>
    <Row gutter={16}>
      <Col span={treePanelSpan}>
        {
          props.treeFormat ?
            <DirectoryTree
              defaultExpandAll
              selectedKeys={selectedKeys}
              onSelect={onSelect}
              onExpand={onExpand}
              treeData={treeData}
              fieldNames={{ title: 'title', key: 'key', children: 'notShown' }}
            />
            : null
        }
      </Col>
      <Col span={24 - treePanelSpan}>
        <Table rowKey={'id'} columns={columns} dataSource={tableData}
          pagination={false} scroll={{ y: 500, x: 800 }} size='small'
          expandable={{
            expandedRowRender: (record) => <p style={{ margin: 0 }}>
              {record.description || 'No description'}
            </p>,
            rowExpandable: (record) => record.name !== 'Not Expandable',
          }} />
      </Col>
    </Row>
  </Modal>
}

export default GraphTable;