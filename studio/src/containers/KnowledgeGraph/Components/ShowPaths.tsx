import { GraphinContext } from '@antv/graphin';
import { useContext, useEffect, useState } from 'react';
import { GraphNode, GraphEdge, AdjacencyList } from '../typings';
import { message } from 'antd';
import { ClearOutlined } from '@ant-design/icons';

import './ShowPaths.less';

type ShowPathProps = {
  selectedNodes: GraphNode[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  adjacencyList: AdjacencyList; // adjacency list
  onClosePathsFinder: () => void;
};

function findAllPathsBFS(
  startNodeId: string, endNodeId: string,
  nodes: GraphNode[], edges: GraphEdge[],
  adjacencyList: AdjacencyList,
) {
  const allPaths: {
    nodes: string[];
    edges: string[];
  }[] = [];

  // queue of nodes to visit
  const queue: {
    nodeId: string;
    path: string[];
  }[] = [{ nodeId: startNodeId, path: [startNodeId] }];

  // set of visited nodes
  const visited = new Set([startNodeId]);

  // keep track of all paths explored so far
  const exploredPaths = new Set();

  while (queue.length > 0) {
    const { nodeId, path } = queue.shift()!;

    if (nodeId === endNodeId) {
      // found a path
      const nodesInPath = path.map(nodeId => {
        const node = nodes.find(node => node.id === nodeId);
        if (node) {
          return node.id;
        } else {
          return nodes[0].id;
        }
      });
      const edgesInPath = [];
      for (let i = 1; i < path.length; i++) {
        const startNode = nodes.find(node => node.id === path[i - 1]);
        const endNode = nodes.find(node => node.id === path[i]);
        if (startNode && endNode) {
          const edge = edges.find(
            edge => (
              edge.source === startNode.id && edge.target === endNode.id ||
              edge.source === endNode.id && edge.target === startNode.id
            )
          );
          if (edge) {
            edgesInPath.push(edge.relid);
          } else {
            edgesInPath.push('');
          }
        }
      }
      const pathKey = nodesInPath.join(',') + ':' + edgesInPath.join(',');
      if (!exploredPaths.has(pathKey)) {
        allPaths.push({ nodes: nodesInPath, edges: edgesInPath });
        exploredPaths.add(pathKey);
      }
    } else {
      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ nodeId: neighborId, path: [...path, neighborId] });
        }
      }
    }
  }

  return allPaths;
}

// function to find all paths between a given set of nodes
function findAllPathsDFS(
  startNodeId: string, endNodeId: string,
  nodes: GraphNode[], edges: GraphEdge[],
  adjacencyList: AdjacencyList,
) {
  // array to hold the current path
  const currentPath: string[] = [];

  // array to hold all paths
  const allPaths: {
    nodes: string[];
    edges: string[];
  }[] = [];

  // function to perform depth-first search
  function dfs(currentNodeId: string) {
    currentPath.push(currentNodeId);
    if (currentNodeId === endNodeId) {
      allPaths.push({
        nodes: currentPath.map(nodeId => {
          const node = nodes.find(node => node.id === nodeId);
          if (node) {
            return node.id;
          } else {
            // Never happens
            return nodes[0].id;
          }
        }),
        edges: currentPath.slice(1).map((nodeId, index) => {
          const startNode = nodes.find(node => node.id === currentPath[index]);
          const endNode = nodes.find(node => node.id === nodeId);
          if (startNode && endNode) {
            const edge = edges.find(
              edge => (
                edge.source === startNode.id && edge.target === endNode.id ||
                edge.source === endNode.id && edge.target === startNode.id
              )
            );
            if (edge) {
              return edge.relid;
            } else {
              return '';
            }
          } else {
            // Never happens
            return "";
          }
        })
      });
    } else {
      const n = adjacencyList.get(currentNodeId) || [];
      for (const neighborId of n) {
        if (!currentPath.includes(neighborId)) {
          dfs(neighborId);
        }
      }
    }
    currentPath.pop();
  }

  dfs(startNodeId);
  // TODO: how to add current node to path? if no path found, show current node
  return allPaths;
}

type Path = { nodes: string[]; edges: string[] }

const ShowPaths = (props: ShowPathProps) => {
  const { graph } = useContext(GraphinContext);
  const [paths, setPaths] = useState<Record<string, Path[]>>({});
  const [algorithm, setAlgorithm] = useState<Record<string, 'bfs' | 'dfs'>>({});

  useEffect(() => {
    if (props.selectedNodes.length <= 1) {
      return;
    }

    let path_str = props.selectedNodes[0].id;
    for (const item of props.selectedNodes) {
      const ids_key = path_str + "_" + item.id;
      if (!paths[ids_key]) {
        // Use BFS if graph is large, DFS otherwise
        // TODO: faster way to find paths?
        const findAllPaths = props.edges.length < 100 ? findAllPathsDFS : findAllPathsBFS;

        const npaths = findAllPaths(
          props.selectedNodes[0].id,
          item.id,
          props.nodes,
          props.edges,
          props.adjacencyList,
        )

        setPaths((prev) => {
          return {
            ...prev,
            [ids_key]: npaths,
          };
        })

        setAlgorithm((prev) => {
          return {
            ...prev,
            [ids_key]: props.edges.length < 100 ? 'dfs' : 'bfs',
          };
        })
      }
    }
  }, [props.selectedNodes]);

  function handleShowPath(paths: Path[]) {
    const anyPaths = paths.some(path => path.nodes.length > 0);
    if (paths.length === 0 || !anyPaths) {
      message.warning('No path found');
    }

    const allNodes = [...new Set(paths.flatMap(path => path.nodes))];
    const allEdges = [...new Set(paths.flatMap(path => path.edges))];

    const nodes = graph.getNodes();
    nodes.forEach(node => {
      const model = node.getModel() as GraphNode;
      if (model.id && !allNodes.includes(model.id)) {
        graph.setItemState(node, 'inactive', true);
      }
    });

    const edges = graph.getEdges();
    edges.forEach(edge => {
      const model = edge.getModel() as GraphEdge;
      if (model.relid && !allEdges.includes(model.relid)) {
        graph.setItemState(edge, 'inactive', true);
      } else {
        graph.setItemState(edge, 'active', true);
      }
    });
  }

  function handleClear(paths: Path[]) {
    const allNodes = [...new Set(paths.flatMap(path => path.nodes))];
    const allEdges = [...new Set(paths.flatMap(path => path.edges))];


    const nodes = graph.getNodes();
    nodes.forEach(node => {
      const model = node.getModel();
      if (model.id && !allNodes.includes(model.id)) {
        graph.setItemState(node, 'inactive', false);
      }
    });

    const edges = graph.getEdges();
    edges.forEach(edge => {
      const model = edge.getModel() as GraphEdge;
      if (model.relid && !allEdges.includes(model.relid)) {
        graph.setItemState(edge, 'inactive', false);
      } else {
        graph.setItemState(edge, 'active', false);
      }
    });

  }

  const onClosePathsFinder = () => {
    setPaths({});
    props.onClosePathsFinder();
  }

  const ItemList = () => {
    if (props.selectedNodes.length <= 1) {
      return null;
    }

    let path_str = props.selectedNodes[0].id;
    return props.selectedNodes.map(node => {
      const ids_key = path_str + "_" + node.id;
      return (
        // eslint-disable-next-line react/no-array-index-key
        <li key={ids_key} className={algorithm[ids_key]}
          onMouseEnter={() => {
            handleShowPath(paths[ids_key]);
          }}
          onMouseLeave={() => {
            handleClear(paths[ids_key]);
          }}>
          <span>{node.data.name}</span>
          &nbsp;
          <span>{algorithm[ids_key] === 'bfs' ? 'BFS' : 'DFS'}</span>
        </li>
      );
    })
  }

  return (
    <div className='show-paths-panel'>
      <div className='title'>
        <h3>Paths Finder</h3>
        <ClearOutlined onClick={onClosePathsFinder} />
      </div>
      <ul className="status-ul body">
        {
          ItemList()
        }
      </ul>
    </div>
  );
};

export default ShowPaths;