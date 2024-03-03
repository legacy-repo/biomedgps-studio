## BioMedGPS

- 2024-03-03
  - Upgrade the BioMedGPS UI.
  - Update the prompt.

- 2024-03-02
  - Upgrade the BioMedGPS UI.

- 2024-03-01
  - Upgrade the BioMedGPS UI.
  - [Fix Bug] Cannot select nodes and edges correctly.
  - Only shows the valid entities.
  - Allow to fetch shared nodes among a set of nodes.

- 2024-02-29
  - Allow to cache responses from Chatgpt.
  - Add an askllm function for explaining a subgraph.
  - Improve the comments.

- 2024-02-28
  - To improve the ranking.
  - Allow to compute scores for known knowledges.
  - To support to predict drugs for a group of symptoms.

- 2024-02-26
  - [Fix Bug] It might have several resources for the same relation type.
  - Reorganize the menus.

- 2024-02-24
  - [Fix Bug] Cannot reload the webllm faster.
  - Improve the llm for generating message in time.

- 2024-02-16
  - Improve the docs.

- 2024-02-15
  - Check the environment, such as database version.
  - Upgrade the BioMedGPS UI.
  - Make the source_name and target_name clickable and annotate the predicted relations.
  - Update the docs.
  - Improve the ui for more convenience.

- 2024-02-14
  - Upgrade the swagger file to match the apis.
  - Make the annotation-file argument optional.
  - Upgrade the apis: use the fetchPredictedNodes function instead of the fetchSimilarityNodes.
  - Improve the showing of predicted results.
  - Update the apis for using new score functions and improve some error msgs.
  - [Fix Bug] Cannot build the frontend.

- 2024-02-13
  - Fix Bug: Cannot show sgrnas.
  - Add a new README file for explaining how to build a production.
  - Improve the README.

- 2024-02-07
  - Fix some bugs.

- 2024-02-06
  - Improve the importing scripts.

- 2024-01-20
  - Add a visitor stat tool.

- 2024-01-17
  - Some sql clauses have bugs.

- 2024-01-12
  - Add a webllm as an chatbot.

- 2024-01-07
  - Allow the similarity module to specify a model name.

- 2023-12-25
  - Upgrade the BioMedGPS UI.

- 2023-12-21
  - Improve the annotations.

- 2023-12-19
  - Upgrade the BioMedGPS UI.

- 2023-12-18
  - Add an api endpoint for llm.
  - Make the graphin component responsive.

- 2023-12-17
  - Upgrade the BioMedGPS UI.

- 2023-12-15
  - missing field .
  - Allow to update the mapped colors when the app launched.

- 2023-12-14
  - Upgrade the BioMedGPS UI.
  - Improve the styles.

- 2023-12-12
  - Upgrade the BioMedGPS UI.

- 2023-12-11
  - Integrate biomedgps with auth0 auth service.
  - Improve README.md
  - [Fix Bug] Cannot get client_id correctly.

- 2023-12-10
  - Update apis.
  - [Fix Bug] Cannot return corrected styles for nodes.

- 2023-12-09
  - Improve the docker file.
  - Fix some bugs.
  - Improve docker files.
  - Add an argument dataset for graph data importer.

- 2023-12-08
  - Improve the sql migration and importing scripts.
  - Add the neo4j database and allow to query graph data.
  - Improve connection method for neo4j database.

- 2023-12-05
  - [Improvement] Improve the performance of importing scripts.
  - [Fix Bug] Cannot import correctly.
  - [Improvement] Allow to check the validality of relation ids.
  - Add an importer for graph data.
  - Improve docker files.

- 2023-11-18
  - Move the embedding initializer into the biomedgps-data repo.

- 2023-10-30
  - Add a script to generate initial embeddings for entities and relation types.

- 2023-10-29
  - Add a description column for explaining the related relation type.

- 2023-10-25
  - Cannot save graph data correctly.

- 2023-10-24
  - Upgrade the BioMedGPS UI.
  - Use the username from an access token instead of an uuid.

- 2023-10-12
  - Use github docker registry instead of dockerhub.
  - [Fix Bug] Permission denied when importing data file into a database
  - [Fix Bug] Skip all missed nodes.
  - [Fix Bug] Cannot check the validation of ids from curated knowleges.
  - [Fix Bug] Uncomment the authorization header.
  - Add a notice for unauthorized users.

- 2023-10-10
  - To check the whole curated_knowledges table when changed entities.

- 2023-10-08
  - Allow to use jwt token stored in cookie.
  - [Fix Bug] Cannot get correct metadata.
  - [Fix Bug] Cannot get correct token from cookie.
  - Improve routes.
  - Improve the default settings.

- 2023-09-17
  - Allow to make a graph from curated knowledges.
  - Update APIs.
  - [Fix Bug] Cannot filter nodes with a Unknown tag.

- 2023-09-16
  - Improve the sql for making the records unique.

- 2023-09-13
  - Cannot build the frontend.

- 2023-09-12
  - Improve the README and update the studio to the latest version.
  - Enable intelligent searching.
  - Update the dockerfile.

- 2023-08-31
  - Add dockerfile for building docker image.

- 2023-08-27
  - Improve the auth for jwt
  - Support jwt authorization.

- 2023-08-12
  - Improve README & makefile.
  - Improve the insert clause for knowledge curation table.
  - Relocate temp directory.

- 2023-08-11
  - Add new fields for entity and relation.

- 2023-08-09
  - Cannot get the example images.
  - Allow to embed the studio into the binary.

- 2023-08-08
  - Update README.
  - Add the frontend repo.

- 2023-07-21
  - Add an endpoint for color map.

- 2023-07-20
  - Add the RelationCount api.

- 2023-07-11
  - Fix bugs in the sql schema.
  - [Fix Bug] Cannot generate entity & relationship metadata correctly.
  - Improve the importing process.

- 2023-07-08
  - Improve README.

- 2023-07-07
  - Skip serializing if a field is none.

- 2023-07-06
  - Improve unittests.

- 2023-07-05
  - Fix bugs in the pgvector extension.
  - Add support for vector & pgml.
  - Improve api & schema.

- 2023-07-04
  - Add new fns for graph quering.
  - Improve docs.
  - Add knn algorithm.

- 2023-07-03
  - Support to store embeddings.
  - Add functions for importing embedding data.
  - Improve codes for robust.
  - Improve error messages.
  - Add constraints on the tables.
  - Improve validation process.

- 2023-07-02
  - Improve validation process.
  - Fix some bugs.
  - Improve README.md

- 2023-07-01
  - First Commit.
  - Implement a alpha version of managing knowledges in a postgresql.


## BioMedGPS UI

- 2024-03-03
  - [Fix Bug] Cannot show the graph correctly after batch deleting several edges.
  - [Fix Bug] Allow to delete records from the graph table.
  - 1. [Fix Bug] Only need to update a part of nodes. 2. Improve the help messages.
  - [Fix Bug] Cannot switch to other page from the knowledge graph page.
  - [Fix Bug] Cannot show multiple relation types correctly.

- 2024-03-02
  - Show a link for the source_id or target_id & add a description for the reltype.
  - Improve the layout function.
  - [Fix Bug] Cannot execute several menu action correctly.
  - Improve the information showing.
  - Improve the layout settings.

- 2024-03-01
  - Clean the searchObject after a calling.
  - [Fix Bug] Cannot select nodes and edges correctly.
  - Allow to fetch shared nodes among a set of nodes.
  - Only shows the valid entities.
  - Improve the fetchSharedNodes function.

- 2024-02-29
  - [Fix Bug] Cannot execute the ask llm function.
  - Add an askllm function for explaining a subgraph.
  - Reduce the number of tokens.
  - Improve the explanation panel.
  - Improve the styles of the explanation panel.

- 2024-02-28
  - [Fix Bug] Cannot group the table data by a column.

- 2024-02-27
  - [Fix Bug] Cannot group the table data by a column.
  - Use the fitCellContents stategy.

- 2024-02-26
  - [Fix Bug] Cannot search the selection option.
  - Allow custom markdown plugins for the chatbox component.
  - [Fix Bug] It might have several resources for the same relation type.
  - Allow to delete the selected message.

- 2024-02-25
  - [Fix Bug] Cannot show the markdown correctly.

- 2024-02-23
  - Improve the styles of the rg-grid table.

- 2024-02-16
  - Improve the markdown-viewer component for fixing plugin loading issues.
  - Add a row number column for ag-grid tables.

- 2024-02-15
  - [Fix Bug] The button on the graph table component is unnecessary.
  - [Fix Bug] unnecessary button.
  - Make the source_name and target_name clickable.

- 2024-02-14
  - Upgrade the apis: use the fetchPredictedNodes function instead of the fetchSimilarityNodes.
  - Improve the showing of predicted results.
  - Update the apis for using new score functions.
  - Upgrade the BioMedGPS UI.

- 2024-02-13
  - Fix some bugs.

- 2023-12-25
  - Improve the searcher component for showing more details for selection options.

- 2023-12-19
  - Allow to load preset graph data from local storage.
  - Allow to load graph from the predicted results.
  - Keep the graph data at the local storage.
  - [Fix Bug] changeSize will cause some problems.
  - Improve the node & edge menus.
  - [Fix Bug] Adding metadata field into the graph data will cause the graph dispearing.

- 2023-12-18
  - Make the graphin component responsive.
  - Allow to setup empty message.
  - [Fix Bug] Cannot show node & edge menu.

- 2023-12-17
  - Add operations for hiding edges and nodes.
  - Improve undo/redo stack.

- 2023-12-14
  - Improve the undo/redo actions.
  - Improve moveable component for avoiding to catch drag event.
  - Improve tooltips for nodes and edges.
  - Fix some bugs.

- 2023-12-12
  - [Fix Bugs] Cannot undo/redo correctly.
  - Improve the graph form + table.
  - Improve the layout settings.

- 2023-12-11
  - Allow to show nodes again.

- 2023-12-10
  - [Improvement] Add soem features for filtering edges and nodes.

- 2023-12-09
  - Allow to fetch paths between two nodes.
  - Add description item for each relation type.

- 2023-10-25
  - Release v0.2.8
  - Improve styles & fix some bugs.

- 2023-10-24
  - 1. Allow to access a biomedgps development server. 2. Support to undo and redo.
  - Use the username from an access token instead of an uuid.
  - 1. Support more layout algorithms. 2. Allow to customize parameters of layout algorithms.

- 2023-10-23
  - 1. Allow to restore status of all nodes & edges. 2. Allow to add tag on a node. 3. Allow to clear tags of nodes through one click.

- 2023-09-19
  - Improve the styles for KG studio and allow to load more findings from the database.

- 2023-09-17
  - Allow to initialize a knowledge graph with user-defined data.
  - Allow to transfer page and page_size fields into the GraphTable component.

- 2023-09-12
  - Improve the fetch function for nodes.
  - Enable intelligent searching.

- 2023-08-27
  - Improve the styles.

- 2023-08-09
  - Cannot enable plugins in the MarkdownViewer component.

- 2023-07-24
  - Improve style for the Chatbox component.

- 2023-07-21
  - Improve styles.
  - Add the BatchNodesSearcher component.
  - Fix some bugs.

- 2023-07-20
  - Update the version.
  - Add the SimilarityNodesSearcher component.
  - Add the QueryForm component.
  - Add the LinkPrediction component.
  - Fix some bugs.
  - Add the LinkedNodeSearcher component.

- 2023-07-18
  - Add the StatisticsDataArea & DataArea components.
  - Add the TransferTable component.
  - Add the EdgeInfoPanel component.
  - Add the NodeInfoPanel & GTexViewer components.
  - Improve the data types.
  - Add a Movable component.
  - Add the GraphStoreForm & GraphStoreTable components.
  - Add a NodeUploader component.

- 2023-07-17
  - Add the Toolbar component.
  - Add the CanvasStatisticsChart component.
  - Add the KnowledgeGraphEditor component.
  - Add the StatisticsChart & SimilarityChart components.

- 2023-07-16
  - Add the markdown component.
  - Add PlotlyViewer & ReactChatPlugin components.
  - Add an example for PlotlyEditor component.

- 2023-04-14
  - Add guide-scoper viewer

- 2023-04-13
  - Move antd & reactjs to devDependencies.
  - Remove antd and keep the library simpler.
  - Add GTexGeneBoxplotViewer & GTexGeneViolinViewer.
  - Add GTexTranscriptViewer component.
  - [Fix Bug] ERR_OSSL_EVP_UNSUPPORTED

- 2022-09-19
  - 08:55:05 +0800  Add publish command.

- 2022-09-13
  - 08:37:20 +0800  Add PathologyViewer component.
  - 20:29:53 +0800  Add TaskTable.

- 2022-09-12
  - 16:42:00 +0800  Add github action for deploying docs.
  - 16:26:46 +0800  First Commit.
  - 17:25:41 +0800  Improve package.json for publish.
  - 16:39:57 +0800  Improve publicPath for github pages.
  - 17:03:09 +0800  Improve github action.

