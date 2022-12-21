import { Card } from 'antd';
import React from 'react';
import MarkdownViewer from '@/components/MarkdownViewer';
import { getDownload as getFile } from '@/services/swagger/Instance';
import './index.less'

const About: React.FC = () => {
  const markdownLink = '/README/about.md'

  return <Card className="about">
    <MarkdownViewer getFile={getFile} url={markdownLink} />
  </Card>;
};

export default About;
