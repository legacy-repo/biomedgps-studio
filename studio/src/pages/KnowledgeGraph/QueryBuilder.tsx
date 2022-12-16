import React, { useState, useEffect } from "react";
import { Row, Input, Select } from "antd";
import { request } from 'umi';
import './query-builder.less';

export type OptionType = {
    label: string,
    value: string
}

const QueryBuilder: React.FC = (props) => {
    const [options, setOptions] = useState<OptionType[]>([]);

    useEffect(() => {
        request('/api/v1/node-types', {
            method: 'GET',
            params: {}
        }).then(response => {
            console.log("Get types of nodes: ", response)
            let o: OptionType[] = []
            response.node_types.forEach((element: string) => {
                o.push({
                    label: element,
                    value: element
                })
            });
            setOptions(o);
        })
    }, [])

    return (
        <Row className="query-builder">
            <Input
                style={{ width: '400px' }}
                addonBefore={
                    <Select
                        defaultValue="Gene"
                        style={{ width: 'auto' }}
                        options={options}
                    />
                }
            />
        </Row>
    )
}

export default QueryBuilder;