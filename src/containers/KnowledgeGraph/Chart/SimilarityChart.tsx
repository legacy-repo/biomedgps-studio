import { Col, Empty, Row, message } from 'antd';
import { CustomGraphinContext } from '../Context/CustomGraphinContext';
import PlotlyViewer from "@/components/PlotlyViewer";
import type { GraphNode } from '../typings';
import type { PlotlyChart } from '@/components/PlotlyViewer/data';
import { useEffect, useState, useContext } from 'react';
import { genLayout } from './BaseStyle';
import './index.less';

type SimilarityChartProps = {
  selectedNodes?: GraphNode[],
  description?: string,
  onClick?: (node: GraphNode) => void,
  data: GraphNode[]
}

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

const SimilarityChart: React.FC<SimilarityChartProps> = (props) => {
  const graphinContext = useContext(CustomGraphinContext);
  const { data } = props;

  const [charts, setCharts] = useState<PlotlyChart[]>([]);
  const [divId, setDivId] = useState<string>(makeid(5));

  useEffect(() => {
    let selectedNodeIds: string[] = [];
    if (graphinContext.selectedNodes) {
      console.log('graphinContext.selectedNodes: ', graphinContext.selectedNodes)
      selectedNodeIds = graphinContext.selectedNodes?.map(node => node.data.id);
    }

    if (data.length !== 0) {
      let localCharts: PlotlyChart[] = [];
      let plotData: any = [];
      let groupData: { [key: string]: GraphNode[] } = {};
      data.forEach(item => {
        if (groupData[item.nlabel]) {
          groupData[item.nlabel].push(item);
        } else {
          groupData[item.nlabel] = [item];
        }
      });

      Object.keys(groupData).forEach(key => {
        const localData = groupData[key];

        const x = localData.map(item => item.x);
        const y = localData.map(item => item.y);
        const group = localData.map(item => item.nlabel);
        let name = []
        if (selectedNodeIds) {
          name = localData.map(item => {
            console.log('item.data.id: ', item.data.id, selectedNodeIds);
            if (selectedNodeIds.includes(item.data.id)) {
              return item.data.name
            } else {
              return ''
            }
          });
        } else {
          name = localData.map(item => item.data.name);
        }
        const id = localData.map(item => item.data.id);

        plotData.push({
          x: x,
          y: y,
          type: 'scatter',
          mode: 'markers+text',
          textposition: 'bottom center',
          text: name,
          customdata: localData,
          name: group[0],
          extra: id,
          marker: {
            color: localData[0].style.keyshape.fill,
            size: 10
          },
          hovertemplate:
            "<b>%{customdata.data.name}</b><br>" +
            "%{customdata.data.id}<br>" +
            "%{yaxis.title.text}: %{y}<br>" +
            "%{xaxis.title.text}: %{x}<br>" +
            "<extra></extra>",
          texttemplate: "%{text}",
        });
      });

      localCharts.push({
        data: plotData,
        layout: genLayout('', 'X', 'Y', false)
      });

      console.log('localCharts: ', localCharts);
      setCharts(localCharts);
    }
  }, [data, graphinContext.selectedNodes]);

  const onPlotlyClick = (data: any) => {
    if (data.points.length === 1) {
      const node = data.points[0]
      if (node.customdata && props.onClick) {
        props.onClick(node.customdata)
      }
    } else {
      console.log('onPlotlyClick: ', data);
      message.info('Please click one node to focus.');
    }
  }

  return <Row className='complex-chart'>
    {
      props.description ? <span className='notice'>{props.description}</span> : null
    }
    {
      charts.length === 0 ?
        <Col span={24}>
          <Empty />
        </Col>
        :
        charts.map((chart, index) => {
          return <Col span={24} key={index} style={{ height: '400px' }}>
            <PlotlyViewer mode='Plotly' plotlyData={chart} divId={`${divId}`} onClick={onPlotlyClick} forceResize />
          </Col>
        })
    }
  </Row>
};

export default SimilarityChart;