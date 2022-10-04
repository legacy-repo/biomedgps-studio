import os.path
import logging
import verboselogs
from rapex_kg.databases import config
from rapex_kg.databases.parsers.base_parser import BaseParser


logger = verboselogs.VerboseLogger('root')


class CTDGeneParser(BaseParser):
    def __init__(self, import_directory, database_directory, config_file=None, download=True, skip=True) -> None:
        self.database_name = 'CTDGene'
        config_dir = os.path.dirname(os.path.abspath(config.__file__))
        self.config_fpath = os.path.join(
            config_dir, "%s.yml" % self.database_name)

        super().__init__(import_directory, database_directory, config_file, download, skip)

    def parse(self):
        url = self.config['ctd_gene_url']
        entities = set()
        directory = os.path.join(self.database_directory, "CTDGene")
        self.check_directory(directory)
        fileName = os.path.join(directory, url.split('/')[-1])
        # Mus musculus (https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=10090)
        taxid = 10090
        entities_header = self.config['header']

        if self.download:
            self.download_db(url, directory)

        if os.path.exists(fileName):
            with self.read_gzipped_file(fileName) as df:
                first = True
                for line in df:
                    if first:
                        first = False
                        continue
                    # Skip the comments
                    if line.startswith("#"):
                        continue
                    data = line.rstrip("\r\n").split(",")
                    geneSymbol = data[0]
                    geneName = data[1]
                    entrezId = data[2]
                    synonyms = [i for i in data[3:7] if len(i) > 0]
                    joined_synonyms = "" if len(synonyms) == 0 else "|".join(synonyms)

                    entities.add((geneSymbol, "Gene", geneName,
                                  entrezId, joined_synonyms, taxid))

        return entities, entities_header

    def build_stats(self):
        stats = set()
        entities, header = self.parse()
        outputfile = os.path.join(self.import_directory, "Gene.tsv")
        self.write_entities(entities, header, outputfile)
        logger.info("Database {} - Number of {} entities: {}".format(
            self.database_name, "Gene", len(entities)))
        stats.add(self._build_stats(len(entities), "entity", "Gene",
                  self.database_name, outputfile, self.updated_on))
        logger.success("Done Parsing database {}".format(self.database_name))
        return stats
