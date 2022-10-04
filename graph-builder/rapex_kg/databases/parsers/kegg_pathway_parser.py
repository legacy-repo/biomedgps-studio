# PathwayCommons
import gzip
import os.path
import logging
import verboselogs
from rapex_kg.databases import config
from rapex_kg.databases.parsers.base_parser import BaseParser


logger = verboselogs.VerboseLogger('root')


class PathwayCommonsParser(BaseParser):
    def __init__(self, import_directory, database_directory, config_file=None, download=True, skip=True) -> None:
        self.database_name = 'PathwayCommons'
        config_dir = os.path.dirname(os.path.abspath(config.__file__))
        self.config_fpath = os.path.join(
            config_dir, "%s.yml" % self.database_name)

        super().__init__(import_directory, database_directory, config_file, download, skip)

    def parse(self):
        url = self.config['pathwayCommons_pathways_url']
        entities = set()
        relationships = set()
        directory = os.path.join(self.database_directory, "PathwayCommons")
        self.check_directory(directory)
        fileName = url.split('/')[-1]
        entities_header = self.config['pathways_header']
        relationships_header = self.config['relationships_header']

        if self.download:
            self.download_db(url, directory)
        f = os.path.join(directory, fileName)
        associations = gzip.open(f, 'r')
        for line in associations:
            data = line.decode('utf-8').rstrip("\r\n").split("\t")
            linkout = data[0]
            code = data[0].split("/")[-1]
            ptw_dict = dict([item.split(": ")[0], ":".join(
                item.split(": ")[1:])] for item in data[1].split("; "))
            proteins = data[2:]
            if "organism" in ptw_dict and ptw_dict["organism"] == "9606":
                name = ptw_dict["name"]
                source = ptw_dict["datasource"]
            else:
                continue

            entities.add((code, "Pathway", name, name,
                          ptw_dict["organism"], source, linkout))
            for protein in proteins:
                relationships.add((protein, code, "ANNOTATED_IN_PATHWAY",
                                   linkout, "PathwayCommons: "+source))

        associations.close()

        # self.remove_directory(directory)

        return (entities, relationships, entities_header, relationships_header)

    def build_stats(self):
        stats = set()
        entities, relationships, entities_header, relationships_header = self.parse()
        entity_outputfile = os.path.join(self.import_directory, "Pathway.tsv")
        self.write_entities(entities, entities_header, entity_outputfile)
        stats.add(self._build_stats(len(entities), "entity", "Pathway",
                  self.database_name, entity_outputfile, self.updated_on))
        pathway_outputfile = os.path.join(
            self.import_directory, "pathwaycommons_protein_associated_with_pathway.tsv")
        self.write_relationships(
            relationships, relationships_header, pathway_outputfile)
        logger.info("Database {} - Number of {} relationships: {}".format(
            self.database_name, "protein_associated_with_pathway", len(relationships)))
        stats.add(self._build_stats(len(relationships), "relationships",
                  "protein_associated_with_pathway", self.database_name, pathway_outputfile, self.updated_on))
        logger.success("Done Parsing database {}".format(self.database_name))
        return stats
