import { Select, Empty } from 'antd';
import { fetchGenes } from '@/services/swagger/OmicsData';
import React, { useState } from 'react';

const { Option } = Select;

let timeout: ReturnType<typeof setTimeout> | null;
let currentValue: string;

import type { SortOrder } from 'antd/es/table/interface';

export function makeQueryStr(
    table: string,
    params: any, // DataType & PageParams
    sort: Record<string, SortOrder>,
    filter: Record<string, React.ReactText[] | null>,
): string {
    console.log('makeQueryStr filter: ', filter);
    const query_str = `:select [:gene_symbol :entrez_id :ensembl_id] :from [:${table}]`;
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

const fetch = (value: string, callback: (data: { value: string; text: string }[]) => void) => {
    if (timeout) {
        clearTimeout(timeout);
        timeout = null;
    }
    currentValue = value;

    const fetchData = () => {
        fetchGenes({
            // rapex_degs.duckdb has a data table.
            query_str: makeQueryStr('data', { gene_symbol: value, ensembl_id: value, entrez_id: value }, {}, {}),
        })
            .then((response) => {
                if (currentValue === value) {
                    const { data } = response;
                    const formatedData = data.map((item: any) => ({
                        value: item['ensembl_id'],
                        text: `${item['gene_symbol']} | ${item['entrez_id']} | ${item['ensembl_id']}`,
                    }));
                    callback(formatedData);
                }
            })
            .catch((error) => {
                console.log('requestDEGs Error: ', error);
                return callback([]);
            });
    };

    timeout = setTimeout(fetchData, 300);
};

const GeneSearcher: React.FC<any & { onChange?: (value: string) => void } & { style: React.CSSProperties }> = props => {
    const [data, setData] = useState<any[]>([]);
    const [value, setValue] = useState<string>();

    const handleSearch = (newValue: string) => {
        if (newValue) {
            fetch(newValue, setData);
        } else {
            setData([]);
        }
    };

    const handleChange = (newValue: string) => {
        setValue(newValue);
        props.onChange?.(newValue);
    };

    const options = data.map(d => <Option key={d.value}>{d.text}</Option>);

    return (
        <Select
            allowClear
            showSearch
            value={value}
            placeholder={props?.placeholder}
            defaultValue={props?.initialValue}
            style={props.style}
            defaultActiveFirstOption={false}
            showArrow={true}
            filterOption={false}
            onSearch={handleSearch}
            onChange={handleChange}
            mode={props?.mode}
            notFoundContent={<Empty description="Searching ..." />}
        >
            {options}
        </Select>
    );
};

export default GeneSearcher;