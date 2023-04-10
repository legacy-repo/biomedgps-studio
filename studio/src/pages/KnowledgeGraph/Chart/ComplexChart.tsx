import { Col, Empty, Row } from 'antd';
import { uniqBy } from 'lodash';
import PlotlyViewer from "@/components/PlotlyViewer";
import type { GraphData } from '../typings';
import type { PlotlyChart } from '@/components/PlotlyViewer/data';
import { useEffect, useState } from 'react';
import { genLayout } from './BaseStyle';
import './index.less';

type ComplexChartProps = {
  data: GraphData
}

const BarPlot: React.FC<ComplexChartProps> = (props) => {
  const { data } = props;

  const [charts, setCharts] = useState<PlotlyChart[]>([]);

  useEffect(() => {
    if (data.nodes.length !== 0) {
      const nodes = data.nodes;
      const edges = data.edges;
      const nodeTypes = uniqBy(nodes, 'nlabel').map(node => node.nlabel);
      const edgeTypes = uniqBy(edges, 'reltype').map(edge => edge.reltype);

      const nodeTypeCount = nodeTypes.map(type => {
        return {
          type,
          count: nodes.filter(node => node.nlabel === type).length
        }
      });

      const edgeTypeCount = edgeTypes.map(type => {
        return {
          type,
          count: edges.filter(edge => edge.reltype === type).length
        }
      });

      let localCharts: PlotlyChart[] = [];

      localCharts.push({
        data: [{
          x: nodeTypeCount.map(item => item.type),
          y: nodeTypeCount.map(item => item.count),
          type: 'bar',
          name: 'Node Type Count',
          marker: {
            color: '#0083ff',
          }
        }],
        layout: genLayout('Node Type Count', 'Node Type', 'Count', false)
      });

      localCharts.push({
        data: [{
          x: edgeTypeCount.map(item => item.type),
          y: edgeTypeCount.map(item => item.count),
          type: 'bar',
          name: 'Edge Type Count',
          marker: {
            color: '#0083ff',
          }
        }],
        layout: genLayout('Edge Type Count', 'Edge Type', 'Count', false)
      });

      setCharts(localCharts);
    }
  }, [data]);

  const makeid = (length: number) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  return <Row className='complex-chart'>
    {
      charts.length === 0 ?
        <Col span={24}>
          <Empty />
        </Col>
        :
        charts.map((chart, index) => {
          return <Col span={12} key={index} style={{ height: '400px' }}>
            <PlotlyViewer mode='Plotly' plotlyData={chart} divId={`${makeid(5)}`} forceResize />
          </Col>
        })
    }
  </Row>
};

export default BarPlot;