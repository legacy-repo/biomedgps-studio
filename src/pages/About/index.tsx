import { Card } from 'antd';
import React, { useEffect } from 'react';
import { MarkdownViewer } from 'biominer-components';

import './index.less';

const About: React.FC = () => {
  const [markdown, setMarkdown] = React.useState('');
  const markdownLink = '/README/about.md';

  useEffect(() => {
    fetch(markdownLink)
      .then((response) => response.text())
      .then((text) => setMarkdown(text));
  }, []);

  return <Card className="about">
    <MarkdownViewer markdown={markdown} />
  </Card>;
};

export default About;