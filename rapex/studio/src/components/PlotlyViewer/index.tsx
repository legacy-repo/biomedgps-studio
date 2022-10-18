import * as plotly from 'plotly.js/dist/plotly';
import React, { memo, useState } from 'react';
import PlotlyEditor from 'react-chart-editor';
import Plot from 'react-plotly.js';
import { getLocale } from 'umi';

import * as localeDictionary from 'plotly.js/lib/locales/zh-cn';
import type { Data, Frames, Layout, PlotlyEditorState, PlotlyChart as PlotlyChartType } from './data';

import 'react-chart-editor/lib/react-chart-editor.css';
import './index.less';

export type PlotlyViewerProps = {
  plotlyData: PlotlyChartType | null,
  handleUpdate?: (state: PlotlyEditorState) => void;
  mode?: string;
};

const PlotlyViewer: React.FC<PlotlyViewerProps> = (props) => {
  const { plotlyData, handleUpdate, mode } = props;

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

  console.log('PlotlyViewer updated: ', props);

  const { data, layout, frames } = plotlyData || {
    data: [],
    layout: {}
  };

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
      frames={frames}
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
