### Notes
If you define a new custom node type, you need to add a custom panel to the node info panel. The panel is displayed when the user clicks on a node in the graph.

### How to add a custom panel
1. Create a new component in the `src/pages/KnowledgeGraph/NodeInfoPanel` folder. The component should be a function component that takes a `node` prop. The `node` prop is the node that the user clicked on in the graph. The component should return a React element.
2. Add the component to the `src/pages/KnowledgeGraph/NodeInfoPanel/index.ts` file.
3. Add your logic into the mapNode2Type function. The function takes a node and returns a component. If the function returns `undefined`, the default panel is displayed.
