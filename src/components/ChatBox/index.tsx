import { ReactChatPlugin } from 'biominer-components';
import { filter, set } from 'lodash';
import * as webllm from "@mlc-ai/web-llm";
import { initChat } from '@/components/util';
import { useEffect, useState } from 'react';
import { message as AntdMessage } from 'antd';

import './index.less';

const aiAPI = process.env.UMI_APP_AI_API ? process.env.UMI_APP_AI_API : 'https://ai.3steps.cn/run/predict';

interface Author {
  id: number
  username?: string
  avatarUrl?: string
}

interface Button {
  type: string;
  title: string;
  payload: string;
}

export interface Message {
  text: string;
  timestamp: number;
  type: string;
  author?: Author;
  buttons?: Button[];
  hasError?: boolean;
}

interface ChatBoxProps {
  message?: string;
}

const ChatBoxWrapper: React.FC<ChatBoxProps> = (props) => {
  const notificationType = 'indicator'
  const textType = 'text'
  const maxTokens = 300;
  const removeIndicator = (messages: Message[]) => {
    return filter(messages, (item) => item.type !== notificationType);
  };

  const [disableInput, setDisableInput] = useState<boolean>(false);
  const [disabledInputPlaceholder, setDisabledInputPlaceholder] = useState<string>("Processing, wait a moment...");
  const history = JSON.parse(localStorage.getItem('chatai-messages') || "[]")
  const [messages, setMessages] = useState<Message[]>(removeIndicator(history));
  const [chat, setChat] = useState<webllm.ChatWorkerClient | webllm.ChatModule | null>(null);

  useEffect(() => {
    const initChatBox = async () => {
      if (window.chat) {
        setChat(window.chat);
      } else {
        const chat = await initChat();
        setChat(chat);
      }
    };

    initChatBox();
  }, []);

  useEffect(() => {
    if (chat) {
      AntdMessage.success('Chat AI is ready.');
      // We must reset the input status after the chat is ready
      setDisableInput(false);
      setDisabledInputPlaceholder("Processing, wait a moment...");

      chat.setInitProgressCallback((report: webllm.InitProgressReport) => {
        setDisableInput(true);
        setDisabledInputPlaceholder(report.text);
      });
    } else {
      setDisableInput(true);
      setDisabledInputPlaceholder("Chat AI is not ready, please wait..")
    }
  }, [chat]);

  const publishNotification = (message: string, messages: Message[]) => {
    const notification = {
      author: {
        id: 2,
        username: 'ChatAI',
        avatarUrl: '/assets/images/ai.svg',
      },
      text: message,
      timestamp: +new Date(),
      type: notificationType
    };
    const newMessages = [...messages, notification];
    setMessages(newMessages);
    return newMessages
  };

  const publishMessage = (message: string, messages: Message[]) => {
    const newMessage = {
      author: {
        id: 2,
        username: 'ChatAI',
        avatarUrl: '/assets/images/ai.svg',
      },
      text: message,
      timestamp: +new Date(),
      type: textType
    };
    return [...messages, newMessage];
  };

  const publishMarkdownMessage = (message: string, messages: Message[]) => {
    const newMessage = {
      author: {
        id: 2,
        username: 'ChatAI',
        avatarUrl: '/assets/images/ai.svg',
      },
      text: message,
      timestamp: +new Date(),
      type: 'markdown'
    };
    return [...messages, newMessage];
  };

  const publishErrorMessage = (messages: Message[]) => {
    const newMessage = {
      author: {
        id: 2,
        username: 'ChatAI',
        avatarUrl: '/assets/images/ai.svg',
      },
      text: 'Sorry, error occurred, please try again later.',
      timestamp: +new Date(),
      type: textType
    };
    return [...messages, newMessage];
  }

  const which_taxid = (species: string) => {
    if (species === 'human') {
      return 9606
    } else if (species === 'mouse') {
      return 10090
    } else if (species === 'rat') {
      return 10116
    } else {
      return 9606
    }
  };

  const webLLMPredict = async (message: string, messages: Message[]) => {
    const generateProgressCallback = (_step: number, message: string) => {
      console.log("generateProgressCallback: ", message);
    };

    let newMessages = publishNotification('Predicting, wait a moment (it\'s slow, be patient)...', messages);
    setDisableInput(true);
    setMessages(newMessages);

    if (!chat) {
      AntdMessage.error('Chat AI is not ready, please try again later.');

      return;
    };

    // Take the first 5 messages as context
    const context = messages.slice(-5).map((item) => item.text).join('\n');

    const prompt = `
    <s> ${context} </s>

    <s> ${message} </s>
    `

    const reply0 = await chat.generate(prompt, generateProgressCallback);
    newMessages = publishMarkdownMessage(reply0, newMessages);
    setMessages(removeIndicator(newMessages));
    setDisableInput(false);

    console.log(await chat.runtimeStatsText());
  }

  const handleOnSendMessage = (message: string) => {
    const newMessage = {
      author: {
        id: 1,
        username: 'Me',
        avatarUrl: '/assets/images/general.svg',
      },
      text: message,
      timestamp: +new Date(),
      type: textType
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    // predict(message, updatedMessages);
    webLLMPredict(message, updatedMessages);
  };

  useEffect(() => {
    localStorage.setItem('chatai-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (props.message) {
      handleOnSendMessage(props.message);
    }
  }, [props.message]);

  return <ReactChatPlugin
    messages={messages}
    userId={1}
    disableInput={disableInput}
    disabledInputPlaceholder={disabledInputPlaceholder}
    showTypingIndicator={true}
    onSendMessage={handleOnSendMessage}
    clearHistory={() => {
      setMessages([]);
      localStorage.setItem('chatai-messages', JSON.stringify([]));
    }}
    width={'100%'}
    height={'calc(100vh - 58px)'}
  />;
}

export default ChatBoxWrapper;
