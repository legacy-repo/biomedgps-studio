import { Empty } from 'antd';
import React, { memo, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import './index.less';
import { fetchMarkdown } from './service';

const gfm = require('remark-gfm');

export type MarkdownProps = {
  url: string | null;
};

const MarkdownViewer: React.FC<MarkdownProps> = (props) => {
  const { url } = props;

  const [markdown, setMarkdown] = useState<string | null>(null);

  useEffect(() => {
    if (url) {
      fetchMarkdown(url).then((response) => setMarkdown(response || null));
    }
  }, [url]);

  console.log('MarkdownViewer: updated');

  return markdown ? (
    <ReactMarkdown
      key={url}
      rehypePlugins={[rehypeRaw]}
      className="markdown-viewer"
      remarkPlugins={[gfm]}
    >
      {markdown}
    </ReactMarkdown>
  ) : (
    <Empty />
  );
};

export default memo(MarkdownViewer);
