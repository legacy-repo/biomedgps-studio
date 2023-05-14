import React, { useEffect } from 'react';
import { Space, Table, Modal, Button, Tree, Col, Row } from 'antd';
import type { Graph } from './typings';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode, DirectoryTreeProps } from 'antd/es/tree';
import './GraphTable.less';

const { DirectoryTree } = Tree;

type GraphTableProps = {
  graphs: Graph[];
  visible: boolean;
  onLoad: (graph: Graph, latestChild: Graph) => void;
  onDelete: (graph: Graph) => void;
  onClose: () => void;
  parent?: HTMLElement;
  treeFormat?: boolean;
  selectedGraphId?: string;
};

type TreeGraph = Graph & {
  children?: TreeGraph[];
  title: string;
  key: string;
  isLeaf?: boolean;
}

const makeTree = (graphs: Graph[]): TreeGraph[] => {
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
        title: obj.name + "-" + obj.id.slice(0, 8),
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
  const defaultTreePanelSpan = 5;
  const [treeData, setTreeData] = React.useState<TreeGraph[]>([]);
  const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);
  const [tableData, setTableData] = React.useState<Graph[]>([]);
  const [treePanelSpan, setTreePanelSpan] = React.useState<number>(defaultTreePanelSpan);

  const columns: ColumnsType<Graph> = [
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
      width: 150,
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
      setTableData(selectedNode.children as Graph[]);
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
      const defaultTableData = defaultTreeData[0] ? defaultTreeData[0].children as Graph[] : [];
      setTableData(defaultTableData);
      setTreePanelSpan(defaultTreePanelSpan);
      setSelectedKeys(defaultTreeData[0] ? [defaultTreeData[0].key] : []);
    } else {
      setTableData(props.graphs);
      setTreePanelSpan(0);
    }
  }, [props.graphs]);

  return <Modal className='graph-table' title="Graph Table" open={props.visible}
    footer={null} width={1000} closable={true} onCancel={props.onClose}
    getContainer={props.parent ? props.parent : document.body}>
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
            expandedRowRender: (record) => <p style={{ margin: 0 }}>{record.description}</p>,
            rowExpandable: (record) => record.name !== 'Not Expandable',
          }} />
      </Col>
    </Row>
  </Modal>
}

export default GraphTable;