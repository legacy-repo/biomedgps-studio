import type { TableColumnType } from 'antd';
import { filter, uniq } from 'lodash';
import voca from 'voca';

export const makeColumns = (dataSource: Array<Record<string, any>>, blackList: Array<string>) => {
  let keys: Array<string> = [];
  dataSource.map(item => {
    keys = keys.concat(Object.keys(item))
  });

  let columns: TableColumnType<any>[] = [];
  const uniqKeys = uniq(keys);
  const filteredUniqKeys = filter(uniqKeys, (key) => {
    return blackList.indexOf(key) < 0
  })
  filteredUniqKeys.map(item => {
    columns.push({
      title: voca.titleCase(item),
      key: item,
      dataIndex: item,
      align: 'center',
      ellipsis: true
    })
  });

  return columns;
}

export const makeDataSources = (dataSource: Array<Record<string, any>>) => {
  return dataSource.map(item => {
    return makeDataSource(item)
  })
}

export const removeComplexData = (dataItem: Record<string, any>, blackList?: Array<string>) => {
  const newObj = {}
  const keys = Object.keys(dataItem)
  const filteredKeys = filter(keys, (key) => {
    if (blackList) {
      return blackList.indexOf(key) < 0
    } else {
      return true
    }
  })
  filteredKeys.forEach(key => {
    if (["string", "number", "boolean"].indexOf(typeof dataItem[key]) >= 0) {
      newObj[key] = dataItem[key]
    }
  })

  return newObj
}

export const makeDataSource = (dataItem: Record<string, any>, blackList?: Array<string>) => {
  if (dataItem.data) {
    return { ...removeComplexData(dataItem, blackList), ...removeComplexData(dataItem.data, blackList) }
  } else {
    return removeComplexData(dataItem)
  }
}