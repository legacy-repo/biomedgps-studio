import { Card } from 'antd';
import React from 'react';
import MarkdownViewer from '@/components/MarkdownViewer';
import { getDownload as getFile } from '@/services/swagger/File';

const About: React.FC = () => {
  const markdownLink = '/README/about.md'

  return <Card className="about" style={{ width: '100%', height: '100%', overflow: 'scroll' }}>
    <MarkdownViewer getFile={getFile} url={markdownLink} />
  </Card>;
};

export default About;
