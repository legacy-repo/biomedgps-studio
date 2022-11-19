/* eslint-disable no-undef */
import React, { useEffect, useState } from 'react';
import { Tabs } from 'antd';
import { FormattedMessage } from 'umi';
import type { StaticContext } from 'react-router';
import type { RouteComponentProps } from 'react-router-dom';
import StatEngine from '../StatEngine';

import './index.less';

const StatEngineWrapper: React.FC<{ chart?: string } & RouteComponentProps<{}, StaticContext> & any> = (props) => {
  const { chart } = props;

  const [currentKey, setCurrentKey] = useState<string>('boxplot');

  const items = [
    {
      label: <FormattedMessage id="pages.StatEngineWrapper.boxplot" defaultMessage="Boxplot" />,
      key: "boxplot"
    },
    {
      label: <FormattedMessage id="pages.StatEngineWrapper.barplot" defaultMessage="Barplot" />,
      key: "barplot",
    },
    {
      label: <FormattedMessage id="pages.StatEngineWrapper.across-organs-boxplot" defaultMessage="Across Organs (Boxplot)" />,
      key: "boxplot-organs"
    },
    {
      label: <FormattedMessage id="pages.StatEngineWrapper.across-organs-barplot" defaultMessage="Across Organs (Barplot)" />,
      key: "barplot-organs",
    },
    {
      label: <FormattedMessage id="pages.StatEngineWrapper.correlation-analysis" defaultMessage="Correlation Analysis" />,
      key: "corrplot"
    },
    {
      label: <FormattedMessage id="pages.StatEngineWrapper.multiple-genes-comparison" defaultMessage="Multiple Genes Comparison" />,
      key: "multiple-genes-comparison",
    }
  ]

  useEffect(() => {
    if (chart) {
      setCurrentKey(chart)
    } else if (props.location.query.chart) {
      setCurrentKey(props.location.query.chart)
    }
  }, [chart])

  return (
    <Tabs className='stat-engine-container' activeKey={currentKey}>
      {items.map(item => {
        return (
          <Tabs.TabPane tab={item.label} key={item.key}>
            <StatEngine chart={item.key}></StatEngine>
          </Tabs.TabPane>
        )
      })}
    </Tabs>
  );

};

export default StatEngineWrapper;
