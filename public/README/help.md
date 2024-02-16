<h2 align="center">Network Medicine Platform</h2>
<p align="center">A network medicine platform with biomedical knowledge graph and graph neural network for drug repurposing and disease mechanism.</p>

## Features

### `Predict Drug/Target` Module
- [x] Predict known drugs for your queried disease (Drug Repurposing).
- [x] Predict new indications for your queried drug.
- [x] Understand the molecular mechanisms of human diseases.
- [x] Predict similar diseases for your queried disease.
- [x] Predict similar drugs for your queried drug.
  
### `Explain Your Results` Module
- [x] Knowledge graph studio for graph query, visualization and analysis.
- [x] Graph neural network for drug discovery, disease mechanism, biomarker screening and discovering response to toxicant exposure.
- [x] Support customized knowledge graph schema and data source.
- [x] Support customized graph neural network model.
- [x] Support customized omics datasets.
- [x] Integrated large language models (such as vicuna, rwkv, chatgpt etc. more details on [chat-publications](https://github.com/yjcyxky/chat-publications)) for answering questions.

## Ecosystem

| Name                                                                              | Language | Description                                                                                                                               |
| :-------------------------------------------------------------------------------- | :------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| [BioMedGPS Data](https://github.com/yjcyxky/biomedgps-data)                       | Python   | For building the knowledge graph of BioMedGPS and training the graph neural network models.                                               |
| [Chat Publications](https://github.com/yjcyxky/chat-publications)                 | Python   | Ask questions and get answers from publications.                                                                                          |
| [BioMedical Knowledgebases](https://github.com/yjcyxky/biomedical-knowledgebases) | Markdown | A collection of biomedical knowledgebases, ontologies, datasets and publications etc.                                                     |
| [R Omics Utility](https://github.com/yjcyxky/r-omics-utils)                       | R        | Utilities for omics data with R. It will be part of biomedgps system and provide visulization and analysis functions of multi-omics data. |

## Demo

### Ask questions with chatbot

![chatbot](https://github.com/yjcyxky/biomedgps-studio/blob/master/public/assets/chatbot.png?raw=true)

### Find similar diseases with your queried disease

![disease](https://github.com/yjcyxky/biomedgps-studio/blob/master/public/assets/disease-similarities.png?raw=true)

### Predict drugs and related genes for your queried disease

![disease](https://github.com/yjcyxky/biomedgps-studio/blob/master/public/assets/drug-targets-genes.png?raw=true)

### Find potential paths between two nodes

![path](https://github.com/yjcyxky/biomedgps-studio/blob/master/public/assets/path.png?raw=true)
