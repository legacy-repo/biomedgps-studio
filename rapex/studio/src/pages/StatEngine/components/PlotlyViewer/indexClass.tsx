import * as plotly from 'plotly.js/dist/plotly';
import * as React from 'react';
import PlotlyEditor from 'react-chart-editor';
import PlotlyChart from 'react-plotly.js';
import { getLocale } from 'umi';

import { getFile } from '../../services/StatEngine';
import * as localeDictionary from 'plotly.js/lib/locales/zh-cn';
import type { Data, Frames, Layout, PlotlyEditorState, PlotlyChart as PlotlyChartType } from './data';

import 'react-chart-editor/lib/react-chart-editor.css';
import './index.less';

export interface ChartEditorProps {
  dataSources: object;
  dataSourceOptions: object[];
  plotlyId: string;
  handleUpdate?: (state: PlotlyEditorState) => void;
  mode?: string;
  responsiveKey: number | string;
}

export interface ChartEditorState {
  data: Data;
  layout: Layout;
  frames: Frames;
}

export default class ChartEditor extends React.PureComponent<ChartEditorProps, ChartEditorState> {
  constructor(props: ChartEditorProps) {
    super(props);
    const initialState: ChartEditorState = {
      data: [],
      layout: {},
      frames: [],
    };
    // TODO: Remove after upgrading to React 16.3
    this.state = initialState;
  }

  UNSAFE_componentWillMount() {
    if (this.props.plotlyId && this.props.plotlyId.length > 0) {
      getFile({ filelink: this.props.plotlyId }).then((response: PlotlyChartType) => {
        this.setState({
          data: response.data,
          layout: response.layout,
          frames: response.frames || [],
        });
      });
    }
  }

  handleUpdate = (data: Data, layout: Layout, frames: Frames) => {
    this.setState(() => ({
      data,
      layout,
      frames,
    }));
    if (this.props.handleUpdate) {
      this.props.handleUpdate({ data, layout, frames });
    }
  };

  handleRender = (data: Data, layout: Layout, frames: Frames) => {
    if (this.props.handleUpdate) {
      this.props.handleUpdate({ data, layout, frames });
    }
  };

  handleResize = () => {
    if (this.ref.state.graphDiv instanceof HTMLElement)
      plotly.Plots.resize(this.ref.state.graphDiv);
  };

  render() {
    const { data, layout, frames } = this.state;
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
      showTips: false,
      responsive: true,
      // @ts-ignore
      locales: { 'zh-CN': localeDictionary },
      locale: getLocale(),
    };

    console.log('PlotlyViewer updated: ', this.props.mode);

    // mode: ["Plotly", "PlotlyEditor"]
    return this.props.mode === 'Plotly' ? (
      <PlotlyChart
        ref={(plotlyRef: PlotlyEditor) => {
          this.ref = plotlyRef;
        }}
        useResizeHandler
        className="plotly-viewer"
        data={data}
        layout={layout}
        config={config}
      />
    ) : (
      <div className="plotly-editor">
        <PlotlyEditor
          ref={(ref: PlotlyEditor) => {
            this.ref = ref;
          }}
          data={data}
          layout={layout}
          config={config}
          frames={frames}
          plotly={plotly}
          dataSources={this.props.dataSources}
          dataSourceOptions={this.props.dataSourceOptions}
          onUpdate={this.handleUpdate}
          onRender={this.handleRender}
          useResizeHandler
          debug
          advancedTraceTypeSelector
        />
      </div>
    );
  }

  ref: PlotlyEditor;
}
