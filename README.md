# Rapex

A knowledge graph system with graph neural network for drug discovery, disease mechanism, biomarker screening and discovering response to toxicant exposure.

## Features

- [x] Knowledge graph studio for graph query, visualization and analysis.
- [x] Graph neural network for drug discovery, disease mechanism, biomarker screening and discovering response to toxicant exposure.
- [x] Support customized knowledge graph schema and data source.
- [x] Support customized graph neural network model.
- [x] Support customized omics datasets.
- [x] Integrated large language models (such as vicuna, rwkv, chatgpt etc. more details on [chat-publications](https://github.com/yjcyxky/chat-publications)) for answering questions.

## Demo

### Ask questions with chatbot

![chatbot](./assets/chatbot.png)

### Find similar diseases with your queried disease

![disease](./assets/disease-similarities.png)

### Predict drugs and related genes for your queried disease

![disease](./assets/drug-targets-genes.png)


### Find potential paths between two nodes

![path](./assets/path.png)


## Installation

### Clone the repo

```bash
git clone https://github.com/yjcyxky/rapex.git
```

### Compile it

```bash
./bin/lein uberjar
```

### Launch a postgresql instance for testing

```
bash create-db.sh rapex_dev 54320
```

### Launch rapex

```bash
export MIGRATE_DB=true
export JAVA_OPTS='-Dconf=./example-conf.edn'

bash bin/start
```

### Launch frontend

```bash
cd studio && yarn start:local-dev

# Release it to GitHub
cd studio && yarn build && yarn gh-pages
```

## Usage

FIXME: explanation

    $ java -jar rapex-0.1.0-standalone.jar [args]

## Options

FIXME: listing of options this app accepts.

### Bugs

...

### Any Other Sections
### That You Think
### Might be Useful

## TODO List

- [] Add advanced search for knowledge graph.
    - [] Two modes: add to current canvas & add to new canvas.

## License

Copyright © 2022 FIXME

This program and the accompanying materials are made available under the
terms of the Eclipse Public License 2.0 which is available at
http://www.eclipse.org/legal/epl-2.0.

This Source Code may also be made available under the following Secondary
Licenses when the conditions for such availability set forth in the Eclipse
Public License, v. 2.0 are satisfied: GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or (at your
option) any later version, with the GNU Classpath Exception which is available
at https://www.gnu.org/software/classpath/license.html.
