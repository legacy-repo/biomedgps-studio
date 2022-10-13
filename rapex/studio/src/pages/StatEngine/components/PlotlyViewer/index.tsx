import { getFile } from '../../services/StatEngine';
import * as plotly from 'plotly.js/dist/plotly';
import React, { memo, useEffect, useState } from 'react';
import PlotlyEditor from 'react-chart-editor';
import Plot from 'react-plotly.js';
import { message } from 'antd';
import { getLocale } from 'umi';

import * as localeDictionary from 'plotly.js/lib/locales/zh-cn';
import type { Data, Frames, Layout, PlotlyEditorState, PlotlyChart as PlotlyChartType } from './data';

import 'react-chart-editor/lib/react-chart-editor.css';
import './index.less';

export type PlotlyViewerProps = {
  dataSources?: object;
  dataSourceOptions?: object[];
  handleUpdate?: (state: PlotlyEditorState) => void;
  mode?: string;
  plotlyId: string;
};

const PlotlyViewer: React.FC<PlotlyViewerProps> = (props) => {
  const { dataSources, handleUpdate, mode, plotlyId } = props;

  const [data, setData] = useState<Data>([]);
  const [layout, setLayout] = useState<Layout>({});
  const [frames, setFrames] = useState<Frames>([]);
  const [ref, setRef] = useState<PlotlyEditor>();

  const onUpdate = (newData: Data, newLayout: Layout, newFrames: Frames) => {
    if (handleUpdate) {
      handleUpdate({ data: newData, layout: newLayout, frames: newFrames });
    }
  };

  const onRender = (newData: Data, newLayout: Layout, newFrames: Frames) => {
    if (handleUpdate) {
      handleUpdate({ data: newData, layout: newLayout, frames: newFrames });
    }
  };

  useEffect(() => {
    if (plotlyId) {
      // Need to set autorange to true
      getFile({ filelink: plotlyId }).then((response: PlotlyChartType) => {
        setData(response.data);
        setLayout({
          ...response.layout,
          // Reset the margin
          margin: {
            "t": 50,
            "r": 0,
            "b": 0,
            "l": 0
          }
        });
        setFrames(response.frames || []);
      }).catch(error => {
        message.warn("Cannot fetch the plotly result, please retry later.")
      });
    }
  }, [plotlyId]);

  // const handleResize = () => {
  //   if (ref.state.graphDiv instanceof HTMLElement) plotly.Plots.resize(ref.state.graphDiv);
  // };

  const config = {
    toImageButtonOptions: {
      format: 'svg', // one of png, svg, jpeg, webp
      filename: 'custom_image',
      height: 1000,
      width: 1000,
      scale: 1, // Multiply title/legend/axis/canvas sizes by this factor
    },
    editable: true,
    scrollZoom: false,
    displaylogo: false,
    displayModeBar: true,
    showTips: true,
    responsive: true,
    // @ts-ignore
    locales: { 'zh-CN': localeDictionary },
    locale: getLocale(),
  };

  console.log('PlotlyViewer updated: ', mode, ref, dataSources);

  // mode: ["Plotly", "PlotlyEditor"]
  return mode === 'Plotly' ? (
    <Plot
      ref={(plotlyRef: PlotlyEditor) => {
        setRef(plotlyRef);
      }}
      useResizeHandler
      className="plotly-viewer"
      data={data}
      layout={layout}
      config={config}
      onInitialized={(figure) => {
        setData(figure.data)
        setLayout(figure.layout)
        setFrames(figure.frames || [])
      }}
      onUpdate={(figure) => {
        setData(figure.data)
        setLayout(figure.layout)
        setFrames(figure.frames || [])
      }}
    />
  ) : (
    <div className="plotly-editor">
      <PlotlyEditor
        ref={(plotlyRef: PlotlyEditor) => {
          setRef(plotlyRef);
        }}
        data={data}
        layout={layout}
        config={config}
        frames={frames}
        plotly={plotly}
        onUpdate={onUpdate}
        onRender={onRender}
        useResizeHandler
        debug
        advancedTraceTypeSelector
      />
    </div>
  );
};

export default memo(PlotlyViewer);
