/* eslint-disable no-undef */
import React, { useEffect, useState } from 'react';
import { Row, Col, Tabs, Table } from 'antd';
import type { TableColumnType } from 'antd';
import { Utils } from '@antv/graphin';
import { Config } from './MenuButton';
import Toolbar from './Toolbar';
import GraphinWrapper from './GraphinWrapper';
import MenuButton from './MenuButton';
import { uniq } from 'lodash';
import voca from 'voca';

import './index.less';

const makeColumns = (dataSource: Array<Record<string, any>>) => {
  let keys: Array<string> = [];
  dataSource.map(item => {
    keys = keys.concat(Object.keys(item))
  });

  let columns: TableColumnType<any>[] = [];
  let uniq_keys = uniq(keys);
  uniq_keys.map(item => {
    columns.push({
      title: voca.titleCase(item),
      key: item,
      dataIndex: item,
      align: 'center'
    })
  });

  return columns;
}

const oldLayout = {
  type: 'compactBox',
  direction: 'TB',
  getId: function getId(d: any) {
    return d.id;
  },
  getHeight: function getHeight() {
    return 16;
  },
  getWidth: function getWidth() {
    return 16;
  },
  getVGap: function getVGap() {
    return 80;
  },
  getHGap: function getHGap() {
    return 50;
  },
}

const style = {
  backgroundImage: `url(${window.publicPath + "graph-background.png"})`
}

const KnowledgeGraph: React.FC = () => {
  const [data, setData] = useState(Utils.mock(8).circle().graphin());
  const [nodeColumns, setNodeColumns] = useState<TableColumnType<any>[]>([]);

  const [currentNode, setCurrentNode] = useState<string>("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string>>([]);

  const [layout, setLayout] = React.useState<any>({});
  const [config, setConfig] = React.useState<Config & { layout?: any } | undefined>({
    layout: 'graphin-force',
    miniMapEnabled: false,
    snapLineEnabled: true,
    nodeTooltipEnabled: true,
    edgeTooltipEnabled: false
  });

  useEffect(() => {
    const columns = makeColumns(data.nodes);
    console.log("Node Columns: ", columns);
    setNodeColumns(columns);
  }, [data])

  const onChangeConfig = (config: Config, layout: any) => {
    setLayout(layout)
    setConfig(config)
  }

  const handleChange = (menuItem: any, menuData: any) => {
    console.log(menuItem, menuData);
    const count = 4;
    const expandData = Utils.mock(count)
      .expand([menuData])
      .type('company')
      .graphin();

    setData({
      nodes: [...data.nodes, ...expandData.nodes],
      edges: [...data.edges, ...expandData.edges],
    });
    console.log("Data: ", data.nodes, data.edges)
  };

  const rowSelection = {
    selectedRowKeys: selectedRowKeys
  }

  const TableTabs = (props: any) => {
    const counts = React.Children.count(props.children)
    const childrenArray = React.Children.toArray(props.children)
    const items = [
      { label: 'Nodes', key: 'nodes', children: counts >= 2 ? childrenArray[0] : 'No Content' },
      { label: 'Edges', key: 'edges', children: counts >= 2 ? childrenArray[1] : 'No Content' },
    ];
    return (
      <Tabs>
        {items.map(item => {
          return (
            <Tabs.TabPane tab={item.label} key={item.key}>
              {item.children}
            </Tabs.TabPane>
          )
        })}
      </Tabs>
    )
  }

  return (
    <Row className='knowledge-graph-container'>
      <MenuButton config={config} onChangeConfig={onChangeConfig} style={{ zIndex: 10, position: 'relative', maxWidth: 'unset', maxHeight: 'unset' }}></MenuButton>
      <Col className='graphin' style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Toolbar position='right'>
        </Toolbar>
        <Toolbar position='bottom'>
          <TableTabs>
            {nodeColumns.length > 0 ?
              <Table size={"small"} scroll={{ y: 200 }} rowKey={"id"} dataSource={data.nodes} columns={nodeColumns} pagination={false}
                onRow={(record, rowIndex) => {
                  return {
                    onClick: event => {
                      setCurrentNode(record.id)
                      setSelectedRowKeys([record.id])
                    }
                  };
                }}
                rowSelection={{
                  type: "radio",
                  ...rowSelection,
                }} />
              : null}
            {nodeColumns.length > 0 ?
              <Table size={"small"} scroll={{ y: 200 }} rowKey={"id"} dataSource={data.nodes} columns={nodeColumns} pagination={false} />
              : null}
          </TableTabs>
        </Toolbar>
        <GraphinWrapper selectedNode={currentNode} handleChange={handleChange} config={config} data={data} layout={{ oldLayout, ...layout }} style={style}></GraphinWrapper>
      </Col>
    </Row >
  );

};

export default KnowledgeGraph;
