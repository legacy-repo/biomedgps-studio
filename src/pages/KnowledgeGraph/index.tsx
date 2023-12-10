import ChatBox from '@/components/ChatBox';
import { Row, Col, Button } from 'antd';
import { KnowledgeGraph } from 'biominer-components';
import React, { useEffect, useState } from 'react';
import { MessageFilled, MessageOutlined } from '@ant-design/icons';
import {
  fetchEdgesAutoConnectNodes, fetchEntities, fetchEntity2d, fetchEntityColorMap, fetchOneStepLinkedNodes, fetchRelationCounts, fetchStatistics, fetchSubgraphs, fetchSimilarityNodes, fetchNodes, fetchRelations, postSubgraph, deleteSubgraph,
  fetchPaths,
} from '@/services/swagger/KnowledgeGraph';
import { getGeneInfo } from '@/plugins4kg/utils';
import { getItems4GenePanel } from '@/plugins4kg';


import './index.less';

const kgFullSpan = 24;
const kgThreeQuartersSpan = 16;

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
      <Button shape="default" className="chat-button" onClick={() => {
        setChatBoxVisible(!chatBoxVisible)
      }} icon={chatBoxVisible ? <MessageOutlined /> : <MessageFilled />}>
        {chatBoxVisible ? 'Hide Chatbot' : 'Show Chatbot'}
      </Button>
      <KnowledgeGraph
        apis={{
          GetStatisticsFn: fetchStatistics,
          GetEntitiesFn: fetchEntities,
          GetRelationsFn: fetchRelations,
          GetRelationCountsFn: fetchRelationCounts,
          GetGraphHistoryFn: fetchSubgraphs,
          PostGraphHistoryFn: postSubgraph,
          DeleteGraphHistoryFn: deleteSubgraph,
          GetNodesFn: fetchNodes,
          GetSimilarityNodesFn: fetchSimilarityNodes,
          GetOneStepLinkedNodesFn: fetchOneStepLinkedNodes,
          GetConnectedNodesFn: fetchEdgesAutoConnectNodes,
          GetEntity2DFn: fetchEntity2d,
          GetEntityColorMapFn: fetchEntityColorMap,
          GetNStepsLinkedNodesFn: fetchPaths,
        }}
        getGeneInfo={getGeneInfo}
        getItems4GenePanel={getItems4GenePanel}
        postMessage={(message: string) => {
          setMessage(message)
        }}>
      </KnowledgeGraph>
    </Col>
  </Row>;
}

export default ChatAI;
