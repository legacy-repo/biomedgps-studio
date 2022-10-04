# Knowledge Graph for RAPEX
A tool for building a knowledge graph by parsing and connecting more than twenty databases.

```bash
(biomedgps) ➜ /Users/codespace/Documents/Code/BioMedGPS git:(master) ✗ > rapex-kg --help
Usage: rapex-kg [OPTIONS] COMMAND [ARGS]...

Options:
  --help  Show this message and exit.

Commands:
  parse-database  Parse databases and make the related graph files.
  parse-ontology  Parse ontologies and make related graph files.
  print-config   Print the default config file.
```

### How to use it?

#### Step 1. Download and parse ontology databases

```bash
(biomedgps) ➜ /Users/codespace/Documents/Code/BioMedGPS git:(master) ✗ > rapex-kg parse-ontology --help
Usage: rapex-kg parse-ontology [OPTIONS]

  Parse ontologies and make related graph files.

Options:
  -d, --ontology-dir PATH     The directory which saved the downloaded
                              database files.  [required]

  -o, --output-dir PATH       The directory which saved the graph files.
                              [required]

  --download / --no-download  Whether download the source file(s)?
  --skip / --no-skip          Whether skip the existing file(s)?
  --help                      Show this message and exit.
```

#### Step 2. Download and parse databases

```bash
(biomedgps) ➜ /Users/codespace/Documents/Code/BioMedGPS git:(master) ✗ > rapex-kg parse-database --help
Usage: rapex-kg parse-database [OPTIONS]

  Parse databases and make the related graph files.

Options:
  -d, --db-dir PATH               The directory which saved the downloaded
                                  database files.  [required]

  -o, --output-dir PATH           The directory which saved the graph files.
                                  [required]

  -c, --config PATH               The config file related with database.
  --database [CTDGene|CTDPathway|CTDChemical|CTDbase]
                                  Which databases (you can specify the
                                  --database argument multiple times)?
                                  [required]

  -n, --n-jobs INTEGER            Hom many jobs?
  --download / --no-download      Whether download the source file(s)?
  --skip / --no-skip              Whether skip the existing file(s)?
  --help                          Show this message and exit.
```