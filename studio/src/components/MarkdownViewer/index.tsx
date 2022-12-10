import { Empty } from 'antd';
import React, { memo, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import axios from 'axios';
import './index.less';

const gfm = require('remark-gfm');

export type MarkdownParams = {
  filelink: string,
}

export type MarkdownProps = {
  url: string | null;
  getFile?: (params: MarkdownParams) => Promise<any>;
};

const MarkdownViewer: React.FC<MarkdownProps> = (props) => {
  const { url, getFile } = props;

  const fetchMarkdown = function(url: string): Promise<string> {
    if (url.match(/^(minio|file):\/\//)) {
      if (getFile) {
        return getFile({
          filelink: url
        }).then((response: any) => {
          return response
        }).catch((error: any) => {
          return error.data.msg ? error.data.msg : error.data
        })
      } else {
        return new Promise((resolve, reject) => {
          resolve("Please specify getFile function.")
        })
      }
    } else {
      try {
        return axios(url).then((response) => {
          if (response.status !== 200) {
            return 'No Content.';
          }
          return response.data;
        });
      } catch (error) {
        console.log(`Cannot fetch ${url}, the reason is ${error}`)
        return new Promise((resolve, reject) => {
          reject('No Content.')
        });
      }
    }
  }

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
