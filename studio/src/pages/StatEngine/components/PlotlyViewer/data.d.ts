// Type definitions for react-plotly.js 1.2.0
// Project: https://github.com/plotly/react-plotly.js
// Definitions by: Grant Nestor <https://github.com/gnestor>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.6

declare module 'react-plotly.js/factory' {
  function createPlotComponent(Plotly: any): any;

  export = createPlotComponent;
}

declare module 'react-chart-editor' {
  import * as React from 'react';

  // export interface PlotlyEditorProps {
  // 	graphDiv: HTMLElement;
  // 	onUpdate: Function;
  // 	revision: any;
  // 	dataSources: any;
  // 	dataSourceOptions: any;
  // 	plotly: Plotly;
  // }

  export default class PlotlyEditor extends React.Component<any, any> {}
}

declare module 'plotly.js/dist/plotly' {
  let Plotly: any;

  export = Plotly;
}

export type IGraphDivData = Record<string, any>;

export declare type Data = IGraphDivData[];

export declare type Layout = Record<string, unknown>;

export declare type Frames = any[];

export declare interface PlotlyEditorState {
  data: Data;
  layout: Layout;
  frames?: Frames;
}

export declare type PlotlyChart = {
  data: Data;
  layout: Layout;
  frames?: Frames;
};

export declare type DataResults = Record<string, any>;
