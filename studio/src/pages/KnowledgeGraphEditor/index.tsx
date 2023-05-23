import { Card } from 'antd';
import React from 'react';
import MarkdownViewer from '@/components/MarkdownViewer';
import { useModel } from 'umi';
import { getDownload as getFile } from '@/services/swagger/Instance';
import './index.less'

const KnowledgeGraphEditor: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const markdownLink = initialState?.customSettings?.aboutUrl || '/README/about.md';

  return <Card className="about">
    <MarkdownViewer getFile={getFile} url={markdownLink} />
  </Card>;
};

export default KnowledgeGraphEditor;
