import GeneList from '@/pages/GeneList';
import { Card } from 'antd';
import React from 'react';
import './index.less';

const DataSet: React.FC = () => {
  return (
    <Card className="dataset">
      <GeneList></GeneList>
    </Card>
  );
};

export default DataSet;
