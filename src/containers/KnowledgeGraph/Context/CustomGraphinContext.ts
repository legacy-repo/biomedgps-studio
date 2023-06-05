import { createContext } from 'react';
import { IGraph } from '@antv/g6';
import { ApisType } from '@antv/graphin/lib/apis/types';
import { GraphNode } from '../typings';

type Context = {
  graph?: IGraph;
  apis?: ApisType;
  selectedNodes?: GraphNode[];
}

export const CustomGraphinContext = createContext({} as Context);