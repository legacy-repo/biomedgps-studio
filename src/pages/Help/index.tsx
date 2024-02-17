import { Card } from 'antd';
import React, { useEffect } from 'react';
import { MarkdownViewer } from 'biominer-components';

import './index.less';

const Help: React.FC = () => {
  const [markdown, setMarkdown] = React.useState('');
  const markdownLink = `${window.publicPath}README/help.md`;

  useEffect(() => {
    fetch(markdownLink)
      .then((response) => response.text())
      .then((text) => setMarkdown(text));
  }, []);

  return (
    <Card className="help">
      <MarkdownViewer markdown={markdown} enableRaw />
    </Card>
  );
};

export default Help;
