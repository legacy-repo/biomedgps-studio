import { ReactChatPlugin } from 'biominer-components';
import { filter } from 'lodash';
import { useEffect, useState } from 'react';
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
  const history = JSON.parse(localStorage.getItem('chatai-messages') || "[]")
  const [messages, setMessages] = useState<Message[]>(removeIndicator(history));


  const publishNotification = (message: string, messages: Message[]) => {
    const notification = {
      author: {
        id: 2,
        username: 'ChatAI',
        avatarUrl: '/images/ai.svg',
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
        avatarUrl: '/images/ai.svg',
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
        avatarUrl: '/images/ai.svg',
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
        avatarUrl: '/images/ai.svg',
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
  }

  const predict = async (message: string, messages: Message[]) => {
    let newMessages = publishNotification('Predicting, wait a moment (it\'s slow, be patient)...', messages);
    setDisableInput(true);

    // Not smart enough to use the context messages
    // let allMessages = messages.map((item) => item.text);
    // let totalLength = allMessages.reduce((acc, curr) => acc + curr.length, 0);
    // while (totalLength > maxTokens) {
    //   const sentence = allMessages.shift();
    //   if (!sentence) {
    //     break;
    //   }

    //   totalLength -= sentence.length;
    // }

    // let messagesStr = allMessages.join('\n') + message;
    // let messagesStr = allMessages.join('\n');
    let messagesStr = message;
    let prompt = '\n\nDo you know the above question? please output it as the following format?  {     "entity_type": "xxx",  // One of Gene, Drug or Protein  "entity_name": "xxx", "which_relationships": "xxx", // One of All, Gene-Drug, Gene-Gene, Gene-Protein, Drug-Protein "gene_name": "xxx", "entrez_id": "xxx", "taxid": "xxx",  "which_task": "xxx", // One of KnowledgeGraph, sgRNAs  "which_species": "xxx" // one of rat, mouse and human }'
    fetch(aiAPI, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic c2FtbXk6USlZS3V4RlU4IVkjbihCWg==' },
      body: JSON.stringify({
        // data: [messagesStr + `\n${prompt}`, '', 0.1, 0.75, 40, 4, maxTokens],
        data: [messagesStr],
      }),
    })
      .then(async response => {
        const data = await response.json();
        if (data && data.data) {
          console.log("Alpacas response: ", data.data)
          try {
            const resp = JSON.parse(data.data.join(' '));
            let message = '';
            if (resp.which_task === 'KnowledgeGraph') {
              if (resp.entity_type && resp.entity_name) {
                const entity_type = resp.entity_type;
                const entity_name = resp.entity_name;
                message = `Based on my experiences and knowledges, I guess you want to know the following information. For testing, I will output the parameters based on your input.
\`\`\`json
{
  "entity_type": "${entity_type}",
  "entity_name": "${entity_name}",
  "which_relationships": "${resp.which_relationships}"
}
\`\`\``;
              }
            } else if (resp.which_task === 'sgRNAs') {
              if (resp.gene_name && resp.which_species) {
                const species = resp.which_species;
                const taxid = which_taxid(species);
                const gene = resp.gene_name;
                message = `Based on my experiences and knowledges, I recommend you to access the following urls for more details.
- <a target="_blank" href="https://biosolver.cn/index.html#/guider-query-details?geneName=${gene}&taxid=${taxid}">GuideScoper-${gene}-${species}</a>`;
              }
            }

            if (message === '') {
              message = data.data.join(' ');
            }

            newMessages = publishMarkdownMessage(message, newMessages);
          } catch (e) {
            const resp = data.data.join(' ');
            newMessages = publishMessage(resp, newMessages);
          }
        } else {
          newMessages = publishErrorMessage(newMessages);
        }

        setMessages(removeIndicator(newMessages));
        setDisableInput(false);
      })
      .catch(() => {
        newMessages = publishErrorMessage(newMessages);
        setMessages(removeIndicator(newMessages));
        setDisableInput(false);
      });
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
      type: textType
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    predict(message, updatedMessages);
  };

  const disabledInputPlaceholder = "Predicting, wait a moment...";

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
