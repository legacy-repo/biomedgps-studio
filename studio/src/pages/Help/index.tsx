import { Card } from 'antd';
import React from 'react';
import MarkdownViewer from '@/components/MarkdownViewer';
import { getDownload as getFile } from '@/services/swagger/File';

const Help: React.FC = () => {
  const markdownLink = '/README/help.md'

  return <Card className="about" style={{ width: '100%', height: '100%' }}>
    <MarkdownViewer getFile={getFile} url={markdownLink} />
  </Card>;
};

export default Help;
