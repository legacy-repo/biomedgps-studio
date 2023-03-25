import * as plotly from 'plotly.js/dist/plotly';
import React, { memo, useRef, useEffect } from 'react';
import PlotlyEditor from 'react-chart-editor';
import Plot from 'react-plotly.js';
import { getLocale } from 'umi';

import * as localeDictionary from 'plotly.js/lib/locales/zh-cn';
import type { Data, Frames, Layout, PlotlyEditorState, PlotlyChart as PlotlyChartType } from './data';

import 'react-chart-editor/lib/react-chart-editor.css';
import './index.less';

export type PlotlyViewerProps = {
  divId?: string,
  forceResize?: boolean,
  plotlyData: PlotlyChartType | null,
  handleUpdate?: (state: PlotlyEditorState) => void;
  mode?: string;
};

const PlotlyViewer: React.FC<PlotlyViewerProps> = (props) => {
  const { plotlyData, handleUpdate, mode } = props;

  const chartRef = useRef(null);

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

  const handleResize = () => {
    console.log("PlotlyViewer handleResize: ", props.forceResize, chartRef);
    const element = document.querySelector(`#${props.divId}`);
    if (props.divId && props.forceResize && element) {
      plotly.relayout(props.divId, { autosize: true });
    }
  };

  useEffect(() => {
    if (props.divId && props.forceResize) {
      const element = document.querySelector(`#${props.divId}`);
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          console.log(`Element size changed to ${entry.contentRect.width}x${entry.contentRect.height}`);
          if (entry.target == element) {
            console.log('Parent size changed');
            handleResize();
          }
        }
      });

      if (element) {
        resizeObserver.observe(element);
      }

      return () => resizeObserver.disconnect();
    } else {
      return () => { };
    }
  }, [chartRef]);

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

  let { data, layout, frames } = plotlyData || {
    data: [],
    layout: {}
  };

  layout = {
    ...layout,
    // Reset the margin
    margin: {
      "t": 50,
      "r": 50,
      "b": 50,
      "l": 50
    }
  }

  // mode: ["Plotly", "PlotlyEditor"]
  return mode === 'Plotly' ? (
    <Plot
      ref={chartRef}
      divId={props.divId}
      useResizeHandler
      className="plotly-viewer"
      data={data}
      layout={{ ...layout, autosize: true }}
      config={config}
      frames={frames}
    />
  ) : (
    <div className="plotly-editor">
      <PlotlyEditor
        ref={chartRef}
        divId={props.divId}
        data={data}
        layout={{ ...layout, autosize: true }}
        config={config}
        frames={frames}
        plotly={plotly}
        onUpdate={onUpdate}
        onRender={onRender}
        useResizeHandler
        // debug
        advancedTraceTypeSelector
      />
    </div>
  );
};

export default memo(PlotlyViewer);
