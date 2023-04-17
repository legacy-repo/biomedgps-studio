import React, { useState } from 'react';
import { Table, Tag, Transfer } from 'antd';
import type { ColumnsType, TableRowSelection } from 'antd/es/table/interface';
import type { TransferItem, TransferProps } from 'antd/es/transfer';
import difference from 'lodash/difference';

interface RecordType {
  key: string;
  id: string;
  name: string;
  disabled: boolean;
  status: string;
}

interface DataType {
  key: string;
  id: string;
  name: string;
  disabled: boolean;
  status: string;
}

interface TableTransferProps extends TransferProps<TransferItem> {
  dataSource: DataType[];
  leftColumns: ColumnsType<DataType>;
  rightColumns: ColumnsType<DataType>;
}

// Customize Table Transfer
const TableTransfer = ({ leftColumns, rightColumns, ...restProps }: TableTransferProps) => (
  <Transfer {...restProps}>
    {({
      direction,
      filteredItems,
      onItemSelectAll,
      onItemSelect,
      selectedKeys: listSelectedKeys,
      disabled: listDisabled,
    }) => {
      const columns = direction === 'left' ? leftColumns : rightColumns;

      const rowSelection: TableRowSelection<TransferItem> = {
        getCheckboxProps: (item) => ({ disabled: listDisabled || item.disabled }),
        onSelectAll(selected, selectedRows) {
          const treeSelectedKeys = selectedRows
            .filter((item) => !item.disabled)
            .map(({ key }) => key);
          const diffKeys = selected
            ? difference(treeSelectedKeys, listSelectedKeys)
            : difference(listSelectedKeys, treeSelectedKeys);
          onItemSelectAll(diffKeys as string[], selected);
        },
        onSelect({ key }, selected) {
          onItemSelect(key as string, selected);
        },
        selectedRowKeys: listSelectedKeys,
      };

      return (
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredItems}
          size="small"
          style={{ pointerEvents: listDisabled ? 'none' : undefined }}
          onRow={({ key, disabled: itemDisabled }) => ({
            onClick: () => {
              if (itemDisabled || listDisabled) return;
              onItemSelect(key as string, !listSelectedKeys.includes(key as string));
            },
          })}
        />
      );
    }}
  </Transfer>
);

const mockStatusList = ['Not Found', 'Found'];

const mockData: RecordType[] = Array.from({ length: 10 }).map((_, i) => ({
  key: i.toString(),
  id: `MESH:${i + 1} * 1000`,
  name: `description of content${i + 1}`,
  disabled: mockStatusList[i % 2] == 'Not Found',
  status: mockStatusList[i % 2],
}));

const originTargetKeys = mockData
  .filter((item) => Number(item.key) % 3 > 1)
  .map((item) => item.key);

const leftTableColumns: ColumnsType<DataType> = [
  {
    dataIndex: 'id',
    title: 'ID',
  },
  {
    dataIndex: 'name',
    title: 'Name',
  },
  {
    dataIndex: 'status',
    title: 'Status',
    render: (tag) => <Tag>{tag}</Tag>,
  },
];

const rightTableColumns: ColumnsType<Pick<DataType, 'id'>> = [
  {
    dataIndex: 'id',
    title: 'ID',
  },
  {
    dataIndex: 'formated_id',
    title: 'Formated ID',
  },
];

const TransferTable: React.FC = () => {
  const [targetKeys, setTargetKeys] = useState<string[]>(originTargetKeys);

  const onChange = (nextTargetKeys: string[]) => {
    setTargetKeys(nextTargetKeys);
  };

  return (
    <>
      <TableTransfer
        dataSource={mockData}
        targetKeys={targetKeys}
        showSearch={true}
        onChange={onChange}
        filterOption={(inputValue, item) =>
          item.title!.indexOf(inputValue) !== -1 || item.tag.indexOf(inputValue) !== -1
        }
        leftColumns={leftTableColumns}
        rightColumns={rightTableColumns}
      />
    </>
  );
};

export default TransferTable;