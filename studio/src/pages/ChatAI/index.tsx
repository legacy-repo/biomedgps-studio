import ChatBox from '@/components/ChatBox';
import { Row, Col, Button } from 'antd';
import KnowledgeGraph from '@/pages/KnowledgeGraph';
import { useEffect, useState } from 'react';
import './index.less';
import { MessageFilled, MessageOutlined } from '@ant-design/icons';

const ChatAI: React.FC = () => {
  const [message, setMessage] = useState<string>('')
  const [chatBoxVisible, setChatBoxVisible] = useState<boolean>(true)
  const [span, setSpan] = useState<number>(16)

  useEffect(() => {
    if (chatBoxVisible) {
      setSpan(16)
    } else {
      setSpan(24)
    }
  }, [chatBoxVisible])

  return <Row gutter={8} className="chat-ai-container">
    {
      chatBoxVisible ? (
        <Col xxl={8} xl={8} lg={8} md={24} sm={24} xs={24}>
          <ChatBox message={message}></ChatBox>
        </Col>
      ) : null
    }
    <Col xxl={span} xl={span} lg={span} md={24} sm={24} xs={24}>
      <Button shape="circle" className="chat-button" onClick={() => {
        setChatBoxVisible(!chatBoxVisible)
      }} icon={chatBoxVisible ? <MessageOutlined /> : <MessageFilled />} />
      <KnowledgeGraph
        postMessage={(message) => {
          setMessage(message)
        }}
        storeId='chatAiGraphData'>
      </KnowledgeGraph>
    </Col>
  </Row>;
}

export default ChatAI;
