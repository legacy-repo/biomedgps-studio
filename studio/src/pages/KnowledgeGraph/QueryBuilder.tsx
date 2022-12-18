import React, { useState, useEffect } from "react";
import { Row, Empty, Select } from "antd";
import { getNodeTypes, getLabels } from '@/services/swagger/Graph';
import type { SortOrder } from 'antd/es/table/interface';
import './query-builder.less';

let timeout: ReturnType<typeof setTimeout> | null;

export type OptionType = {
    label: string,
    value: string
}

export function makeQueryStr(
    params: any, // DataType & PageParams
    sort: Record<string, SortOrder>,
    filter: Record<string, React.ReactText[] | null>,
): string {
    console.log('makeQueryStr filter: ', filter);
    const query_str = `:select [:*]`;
    let sort_clause = '';
    let query_clause = '';
    if (sort) {
        const key = Object.keys(sort)[0];
        const value = Object.values(sort)[0];
        if (key && value) {
            if (value === 'ascend') {
                sort_clause = `:order-by [:${key}]`;
            } else {
                sort_clause = `:order-by [[:${key} :desc]]`;
            }
        }
    }

    if (params) {
        const subclauses = [];
        for (const key of Object.keys(params)) {
            if (['current', 'pageSize'].indexOf(key) < 0 && params[key].length > 0) {
                subclauses.push(`[:like [:upper :${key}] [:upper "%${params[key]}%"]]`);
            }
        }

        if (subclauses.length == 1) {
            query_clause = `:where ${subclauses[0]}`;
        } else if (subclauses.length > 1) {
            query_clause = `:where [:or ${subclauses.join(' ')}]`;
        }
    }

    return `{${query_str} ${sort_clause} ${query_clause}}`;
}

type QueryBuilderProps = {
    // When multiple values was returned, the gene variable will be undefined.
    onChange?: (label: string, value: string | undefined) => void;
}

const QueryBuilder: React.FC<QueryBuilderProps> = (props) => {
    const [labelOptions, setLabelOptions] = useState<OptionType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [placeholder, setPlaceholder] = useState<string>("Search Gene nodes ...");
    const [options, setOptions] = useState<any[] | undefined>(undefined);
    const [label, setLabel] = useState<string>("Gene");

    const fetch = async (label_type: string, value: string) => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        const fetchData = () => {
            setLoading(true)
            getLabels({
                // rapex_degs.duckdb has a data table.
                query_str: makeQueryStr({ id: value, name: value }, {}, {}),
                label_type: label_type
            })
                .then((response) => {
                    const { data } = response;
                    const formatedData = data.map((item: any) => ({
                        value: item['id'],
                        text: `${item['id']} | ${item['name']}`,
                    }));
                    console.log("getLabels results: ", formatedData);
                    // const options = formatedData.map(d => <Option key={d.value}>{d.text}</Option>);
                    const options = formatedData.map(d => { return { label: d.text, value: d.value } })
                    setLoading(false);
                    setOptions(options);
                })
                .catch((error) => {
                    console.log('requestDEGs Error: ', error);
                    setOptions([]);
                    setLoading(false)
                });
        };

        timeout = setTimeout(fetchData, 300);
    };

    const handleSelectLabel = function (value: string) {
        setLabel(value);
        setOptions(undefined);
        setPlaceholder(`Search ${value} nodes ...`);
    }

    const handleSearch = function (value: string) {
        if (value) {
            fetch(label, value);
        } else {
            setOptions(undefined);
        }
    }

    const handleChange = function (value: string) {
        console.log("Handle Change: ", value)
        if (value) {
            props.onChange?.(label, value);
        } else {
            props.onChange?.(label, undefined);
        }
    }

    useEffect(() => {
        getNodeTypes()
            .then(response => {
                console.log("Get types of nodes: ", response)
                let o: OptionType[] = []
                if (response.node_types) {
                    response.node_types.forEach((element: string) => {
                        o.push({
                            label: element,
                            value: element
                        })
                    });
                    setLabelOptions(o);
                } else {
                    setLabelOptions([]);
                }
            })
    }, [])

    return (
        <Row className="query-builder">
            <Select
                value={label}
                style={{ width: 'auto', minWidth: '100px' }}
                options={labelOptions}
                onSelect={handleSelectLabel}
            />
            <Select
                showSearch
                allowClear
                loading={loading}
                defaultActiveFirstOption={false}
                showArrow={true}
                placeholder={placeholder}
                onSearch={handleSearch}
                onChange={handleChange}
                options={options}
                filterOption={false}
                notFoundContent={<Empty description={
                    loading ? "Searching..." : (options !== undefined ? "Not Found" : `Enter your interested ${label} ...`)
                } />}
            >
            </Select>
        </Row>
    )
}

export default QueryBuilder;