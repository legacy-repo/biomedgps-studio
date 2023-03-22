import ChatBox from 'react-chat-plugin';
import { filter } from 'lodash';
import { useEffect, useState } from 'react';
import './index.less';

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

const ChatBoxWrapper: React.FC = () => {
  const [disableInput, setDisableInput] = useState<boolean>(false);
  const history = JSON.parse(localStorage.getItem('chatai-messages') || "[]")
  const [messages, setMessages] = useState<Message[]>(history);

  const publishNotification = (message: string, messages: Message[]) => {
    const notification = {
      author: {
        id: 2,
        username: 'ChatAI',
        avatarUrl: '/images/ai.svg',
      },
      text: message,
      timestamp: +new Date(),
      type: 'notification',
    };
    const newMessages = [...messages, notification];
    setMessages(newMessages);
    return newMessages
  };

  const predict = async (message: string, messages: Message[]) => {
    let newMessages = publishNotification('Predicting, wait a moment...', messages);
    setDisableInput(true);
    const response = await fetch('http://data.3steps.cn:8000/run/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [message, '', 0.1, 0.75, 40, 4, 128],
      }),
    });

    const data = await response.json();
    const resp = data.data.join(' ');
    const newMessage = {
      author: {
        id: 2,
        username: 'ChatAI',
        avatarUrl: '/images/ai.svg',
      },
      text: resp,
      timestamp: +new Date(),
      type: 'text',
    };
    newMessages = [...newMessages, newMessage];
    setMessages(filter(newMessages, (item) => {
      return item.type !== 'notification'
    }));

    setDisableInput(false);
  };

  const handleOnSendMessage = (message: string) => {
    const newMessage = {
      author: {
        id: 1,
        username: 'Me',
        avatarUrl: '/images/general.svg',
      },
      text: message,
      timestamp: +new Date(),
      type: 'text',
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    predict(message, updatedMessages);
  };

  const disabledInputPlaceholder = "Predicting, wait a moment...";

  useEffect(() => {
    localStorage.setItem('chatai-messages', JSON.stringify(messages));
  }, [messages]);

  return <ChatBox
    messages={messages}
    userId={1}
    disableInput={disableInput}
    disabledInputPlaceholder={disabledInputPlaceholder}
    showTypingIndicator={true}
    onSendMessage={handleOnSendMessage}
    width={'100%'}
    height={'calc(100vh - 58px)'}
  />;
}

export default ChatBoxWrapper;
