import ChatBox from '@/components/ChatBox';
import { Row, Col, Button } from 'antd';
import KnowledgeGraph from '@/containers/KnowledgeGraph';
import { useEffect, useState } from 'react';
import './index.less';
import { MessageFilled, MessageOutlined } from '@ant-design/icons';

const kgFullSpan = 24;
const kgThreeQuartersSpan = 18;

const ChatAI: React.FC = () => {
  const [message, setMessage] = useState<string>('')
  const [chatBoxVisible, setChatBoxVisible] = useState<boolean>(false)
  const [span, setSpan] = useState<number>(kgFullSpan)

  useEffect(() => {
    if (chatBoxVisible) {
      setSpan(kgThreeQuartersSpan)
    } else {
      setSpan(kgFullSpan)
    }
  }, [chatBoxVisible])

  return <Row gutter={8} className="chat-ai-container">
    {
      chatBoxVisible ? (
        <Col xxl={24 - span} xl={24 - span} lg={24 - span} md={24} sm={24} xs={24}>
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
