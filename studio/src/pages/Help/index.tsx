import { Card } from 'antd';
import React from 'react';
import MarkdownViewer from '@/components/MarkdownViewer';
import { getDownload as getFile } from '@/services/swagger/Instance';
import './index.less';

const Help: React.FC = () => {
  const markdownLink = '/README/help.md'

  return <Card className="help">
    <MarkdownViewer enableToc={true} getFile={getFile} url={markdownLink} />
  </Card>;
};

export default Help;
