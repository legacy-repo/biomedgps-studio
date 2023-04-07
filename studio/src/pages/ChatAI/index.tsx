import ChatBox from '@/components/ChatBox';
import { Row, Col } from 'antd';
import KnowledgeGraph from '@/pages/KnowledgeGraph';
import { useState } from 'react';
import './index.less';

const ChatAI: React.FC = () => {
  const [message, setMessage] = useState<string>('')

  return <Row gutter={8}>
    <Col xxl={8} xl={8} lg={8} md={24} sm={24} xs={24}>
      <ChatBox message={message}></ChatBox>
    </Col>
    <Col xxl={16} xl={16} lg={16} md={24} sm={24} xs={24}>
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
