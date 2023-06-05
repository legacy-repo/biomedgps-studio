import React from 'react';
import moment from 'moment';
import { getLocale } from 'umi';
import ErrorIcon from './error-icon.svg';
import avatar from './placeholder.png';
import { DislikeOutlined, LikeOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeToc from 'rehype-toc';
import rehypeVideo from 'rehype-video';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import ReactMarkdown from 'react-markdown';

function MessageBox(props) {
  const {
    type, // text, indicator, notification, markdown
    timestamp,
    timestampFormat,
    buttons,
    left,
    author,
    hasError,
    text,
    likeHandler,
    dislikeHandler,
  } = props;

  const locale = getLocale();
  if (type === 'text' || type === 'indicator' || type === 'markdown') {
    let time;
    if (timestamp) {
      if (timestampFormat === 'calendar') {
        time = moment(timestamp).locale(locale).calendar();
      } else if (timestampFormat === 'fromNow') {
        time = moment(timestamp).locale(locale).fromNow();
      } else {
        time = moment(timestamp).locale(locale).format(timestampFormat);
      }
    }

    const _buttons = buttons
      ? buttons.map((button, idx) => {
        if (button.type === 'URL') {
          return (
            <a
              key={idx}
              href={button.payload}
              rel="noreferrer"
              target="_blank"
              className="react-chat-message-button"
            >
              {button.title}
            </a>
          );
        }
      })
      : [];

    const rehypePlugins = [rehypeRaw, rehypeSlug, rehypeAutolinkHeadings, rehypeVideo];

    return (
      <div
        className={`react-chat-messageBox ${left ? 'react-chat-messageBoxLeft' : 'react-chat-messageBoxRight'
          }`}
      >
        <img
          alt="avater img"
          src={author.avatarUrl ? author.avatarUrl : avatar}
          className={`react-chat-avatar ${left ? 'react-chat-avatarLeft' : 'react-chat-avatarRight'
            }`}
        />
        <div
          className={`react-chat-message ${left ? 'react-chat-messageLeft' : 'react-chat-messageRight'
            }`}
        >
          <div className="react-chat-additional">{author.username}</div>
          <div
            className={`react-chat-bubble ${left ? 'react-chat-leftBubble' : 'react-chat-rightBubble'
              } ${hasError ? 'react-chat-bubbleWithError' : ''}`}
          >
            {type === 'indicator' && (
              <div className="react-chat-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
            {type === 'text' && text}
            {type === 'markdown' && (text ?
              <ReactMarkdown
                className='message-markdown-viewer'
                rehypePlugins={rehypePlugins}
                remarkPlugins={[remarkGfm]}
              >
                {text}
              </ReactMarkdown>
              : text
            )}
            {_buttons.length > 0 && (
              <div
                className={
                  left
                    ? 'react-chat-message-buttonGroupLeft'
                    : 'react-chat-message-buttonGroupRight'
                }
              >
                {_buttons}
              </div>
            )}
            {hasError && (
              <img
                src={ErrorIcon}
                className={`${left ? 'react-chat-errorLeft' : 'react-chat-errorRight'
                  } react-chat-error`}
              />
            )}
          </div>
          <div className="react-chat-additional">
            {time !== null && time}
            <span className='react-chat-message-like'>
              <Tooltip title="Like">
                <LikeOutlined onClick={(props) => {
                  if (likeHandler) likeHandler(props)
                }} />
              </Tooltip>
              <Tooltip title="Dislike">
                <DislikeOutlined onClick={
                  (props) => {
                    if (dislikeHandler) dislikeHandler(props)
                  }
                } />
              </Tooltip>
            </span>
          </div>
        </div>
      </div>
    );
  } else if (type === 'notification') {
    return (
      <div className="text-center text-secondary react-chat-notification">
        {text}
      </div>
    );
  }
}

export default MessageBox;
