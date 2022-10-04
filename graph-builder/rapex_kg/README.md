## How does it work?

```
knowledge-graph parse-ontology -d ~/Downloads/KG/Databases -o ~/Downloads/KG/Importers/Ontologies --download --skip

# and

knowledge-graph parse-database -d /Users/codespace/Downloads/KG/Databases -o /Users/codespace/Downloads/KG/Importers/Databases --database CancerGenomeInterpreter --download --skip
```

All database files are located in `~/Downloads/KG/Databases` directory, each database have own subdirectory, such as DrugBank, DO, ....

All converted graph files are located in `~/Downloads/KG/Importers/Ontologies` or `~/Downloads/KG/Importers/Databases` directory.

### Cautions

Some databases have dependencies on other databases. such as CancerGenomeInterpreter database. If you want to build it succssfully, you need to build DrugBank, DO, UniProt firstly.
