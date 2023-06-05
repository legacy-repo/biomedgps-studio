import { Select, Empty } from 'antd';
import React, { useState, useEffect } from 'react';

const { Option } = Select;

export type DataSet = {
    key?: string;
    text?: string;
};

export type DataSetResponse = DataSet[];

export type DatasetSelectProps = {
    listDatasets: () => Promise<DataSetResponse>;
    placeholder?: string;
    initialValue: any;
    onChange?: (datasetId: string) => void;
    style: React.CSSProperties;
};

const DatasetSelect: React.FC<DatasetSelectProps> = props => {
    const { listDatasets, initialValue } = props;
    const [data, setData] = useState<any[]>([]);
    const [value, setValue] = useState<string>();

    useEffect(() => {
        if (initialValue) {
            setValue(initialValue)
            props.onChange?.(initialValue)
        }

        if (data.length == 0) {
            listDatasets().then((data) => {
                const formatedData = data.map((item: any) => ({
                    value: item['key'],
                    text: item['text'],
                }));
                setData(formatedData)
            })
                .catch((error) => {
                    console.log('listDatasets Error: ', error);
                    return setData([]);
                });
        }
    }, [initialValue, value])

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
            style={props.style}
            defaultActiveFirstOption={false}
            showArrow={true}
            filterOption={false}
            onChange={handleChange}
            notFoundContent={<Empty description="No Dataset" />}
        >
            {options}
        </Select>
    );
};

export default DatasetSelect;