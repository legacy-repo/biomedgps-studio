import React, { ReactNode } from 'react';
import { Descriptions } from 'antd';

const DataArea: React.FC<{ data: [ReactNode, string | number][], style?: any }> = ({ data, style }) => {
  const items = data.map((item, index) => {
    return (
      <Descriptions.Item key={index} label={item[0]}>
        {item[1]}
      </Descriptions.Item>
    )
  })
  return (
    items.length > 0 ?
      (<Descriptions size={"small"} column={1} title={null}
        labelStyle={{ backgroundColor: 'transparent' }}
        bordered style={{ ...style }}>
        {items}
      </Descriptions>)
      : (<span style={style}>No Properties</span>)
  )
}

export default DataArea;