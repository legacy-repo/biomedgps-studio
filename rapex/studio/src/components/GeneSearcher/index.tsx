import { Select, Empty } from 'antd';
import { filter } from 'lodash';
import React, { useEffect, useState } from 'react';

const { Option } = Select;

let timeout: ReturnType<typeof setTimeout> | null;
let currentValue: string;

import type { SortOrder } from 'antd/es/table/interface';

export type GeneData = {
    ensembl_id: string;
    entrez_id: number;
    gene_symbol: string;
    name: string;
    taxid: string;
    type_of_gene: string;
    description: string;
    mgi_id: string;
    pdb: string;
    pfam: string;
    pubmed_ids: string;
    pubmed: string;
    alias: string;
    chromosome: string;
    start: string;
    end: string;
    strand: string;
    swiss_p: string;
    prosite: string;
};

export type GeneDataResponse = {
    total: number;
    page: number;
    page_size: number;
    data: GeneData[];
};

export type GenesQueryParams = {
    /** Query string with honeysql specification. */
    query_str: string;
    /** Page, From 1. */
    page?: number;
    /** Num of items per page. */
    page_size?: number;
};

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

export type GeneSearcherProps = {
    queryGenes: (params: GenesQueryParams) => Promise<GeneDataResponse>;
    placeholder?: string;
    initialValue?: any;
    mode?: any;
    onChange?: (value: string, gene: GeneData) => void;
    style: React.CSSProperties;
};

const GeneSearcher: React.FC<GeneSearcherProps> = props => {
    const { queryGenes, initialValue } = props;
    const [geneData, setGeneData] = useState<GeneData[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [value, setValue] = useState<string>();

    useEffect(() => {
        if (initialValue) {
            setValue(initialValue)
            fetch(initialValue, (data) => {
                setData(data);
                handleChange(initialValue, {});
            })
        }
    }, [initialValue])

    const fetch = (value: string, callback: (data: { value: string; text: string }[]) => void) => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        currentValue = value;

        const fetchData = () => {
            queryGenes({
                // rapex_degs.duckdb has a data table.
                query_str: makeQueryStr({ gene_symbol: value, ensembl_id: value, entrez_id: value }, {}, {}),
            })
                .then((response) => {
                    if (currentValue === value) {
                        const { data } = response;
                        const formatedData = data.map((item: any) => ({
                            value: item['ensembl_id'],
                            text: `${item['gene_symbol']} | ${item['entrez_id']} | ${item['ensembl_id']}`,
                        }));
                        callback(formatedData);
                        setGeneData(data);
                    }
                })
                .catch((error) => {
                    console.log('requestDEGs Error: ', error);
                    callback([]);
                });
        };

        timeout = setTimeout(fetchData, 300);
    };

    const handleSearch = (newValue: string) => {
        if (newValue) {
            fetch(newValue, setData);
        } else {
            setData([]);
        }
    };

    const handleChange = (newValue: string, option: any) => {
        setValue(newValue);
        if (newValue) {
            const gene = filter(geneData, (item) => {
                if (newValue.match(/ENS/i)) {
                    return item.ensembl_id == newValue
                } else if (newValue.match(/[a-zA-Z][a-zA-Z0-9]+/i)) {
                    return item.gene_symbol == newValue
                } else if (newValue.match(/[0-9]+/i)) {
                    return item.entrez_id.toString() == newValue
                } else {
                    return false
                }
            })

            console.log("handleChange(GeneSearcher): ", gene, geneData);
            props.onChange?.(newValue, gene[0]);
        }
    };

    const options = data.map(d => <Option key={d.value}>{d.text}</Option>);

    return (
        <Select
            allowClear
            showSearch
            value={value}
            placeholder={props?.placeholder}
            style={props.style}
            defaultActiveFirstOption={false}
            showArrow={true}
            filterOption={false}
            onSearch={handleSearch}
            onChange={handleChange}
            mode={props?.mode ? props?.mode : 'single'}
            notFoundContent={<Empty description="Searching ..." />}
        >
            {options}
        </Select>
    );
};

export default GeneSearcher;