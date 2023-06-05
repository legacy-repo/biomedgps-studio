import React, { useState, useEffect } from "react";
import { Row, Empty, Select, Button } from "antd";
import { makeQueryStr } from './utils';
import { OptionType } from './typings';
import type { APIs } from './typings';
import './QueryBuilder.less';

let timeout: ReturnType<typeof setTimeout> | null;

type QueryBuilderProps = {
    onChange?: (label: string, value: string | undefined) => void;
    onAdvancedSearch?: () => void;
    getNodeTypes: APIs['GetNodeTypesFn'];
    getLabels: APIs['GetLabelsFn'];
}

const QueryBuilder: React.FC<QueryBuilderProps> = (props) => {
    const [labelOptions, setLabelOptions] = useState<OptionType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [placeholder, setPlaceholder] = useState<string>("Search Gene nodes ...");
    const [options, setOptions] = useState<any[] | undefined>(undefined);
    const [label, setLabel] = useState<string>("Gene");

    // This function is used to fetch the nodes of the selected label.
    // All the nodes will be added to the options as a dropdown list.
    const fetch = async (label_type: string, value: string) => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        const fetchData = () => {
            setLoading(true)
            props.getLabels({
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
                    console.log('requestNodes Error: ', error);
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
        props.getNodeTypes()
            .then(response => {
                console.log("Get types of nodes: ", response)
                let o: OptionType[] = []
                if (response.node_types) {
                    response.node_types.forEach((element: string) => {
                        o.push({
                            order: 0,
                            label: element,
                            value: element
                        })
                    });
                    setLabelOptions(o);
                } else {
                    setLabelOptions([]);
                }
            }).catch(error => {
                console.log("Get types of nodes error: ", error)
                setLabelOptions([]);
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
            <Button onClick={props.onAdvancedSearch}>Advanced</Button>
        </Row>
    )
}

export default QueryBuilder;