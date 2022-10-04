# Reactome database
import re
import os.path
import logging
import verboselogs
from collections import defaultdict
from rapex_kg.databases import config
from rapex_kg.databases.parsers.base_parser import BaseParser


logger = verboselogs.VerboseLogger('root')


class ReactomeParser(BaseParser):
    def __init__(self, import_directory, database_directory, config_file=None, download=True, skip=True) -> None:
        self.database_name = 'Reactome'
        config_dir = os.path.dirname(os.path.abspath(config.__file__))
        self.config_fpath = os.path.join(
            config_dir, "%s.yml" % self.database_name)

        super().__init__(import_directory, database_directory, config_file, download, skip)

    def parse(self):
        urls = self.config['reactome_urls']
        entities = set()
        relationships = defaultdict(set)
        entities_header = self.config['pathway_header']
        relationships_headers = self.config['relationships_header']
        directory = os.path.join(self.database_directory, "Reactome")
        self.check_directory(directory)

        for dataset in urls:
            url = urls[dataset]
            file_name = url.split('/')[-1]
            if self.download:
                self.download_db(url, directory)
            f = os.path.join(directory, file_name)
            with open(f, 'r') as rf:
                if dataset == "pathway":
                    entities = self.parse_pathways(rf)
                elif dataset == "hierarchy":
                    relationships[("pathway", "has_parent")
                                  ] = self.parse_pathway_hierarchy(rf)

        return entities, relationships, entities_header, relationships_headers

    def build_stats(self):
        stats = set()
        entities, relationships, entities_header, relationships_header = self.parse()
        entity_outputfile = os.path.join(
            self.import_directory, self.database_name.lower()+"_Pathway.tsv")
        self.write_entities(entities, entities_header, entity_outputfile)
        stats.add(self._build_stats(len(entities), "entity", "Pathway",
                  self.database_name, entity_outputfile, self.updated_on))
        for entity, relationship in relationships:
            reactome_outputfile = os.path.join(self.import_directory,
                                               self.database_name.lower()+"_"+entity.lower()+"_"+relationship.lower()+".tsv")
            self.write_relationships(relationships[(
                entity, relationship)], relationships_header[entity], reactome_outputfile)
            logger.info("Database {} - Number of {} {} relationships: {}".format(
                self.database_name, entity, relationship, len(relationships[(entity, relationship)])))
            stats.add(self._build_stats(len(relationships[(
                entity, relationship)]), "relationships", relationship, self.database_name, reactome_outputfile, self.updated_on))
        logger.success("Done Parsing database {}".format(self.database_name))
        return stats

    def parse_pathways(self, fhandler):
        entities = set()
        organisms = self.config['organisms']
        url = self.config['linkout_url']
        directory = os.path.join(self.database_directory, "Reactome")
        mapping_file = os.path.join(directory, "mapping.tsv")

        self.reset_mapping()
        with open(mapping_file, 'w') as mf:
            for line in fhandler:
                data = line.rstrip("\r\n").split("\t")
                identifier = data[0]
                name = data[1]
                organism = data[2]
                linkout = url.replace("PATHWAY", identifier)
                if organism in organisms:
                    organism = organisms[organism]
                    entities.add((identifier, "Pathway", name,
                                 name, organism, linkout, "Reactome"))
                    mf.write(identifier+"\t"+name+"\n")

        self.mark_complete_mapping()

        return entities

    def parse_pathway_hierarchy(self, fhandler):
        relationships = set()
        for line in fhandler:
            data = line.rstrip("\r\n").split("\t")
            parent = data[0]
            child = data[1]
            relationships.add((child, parent, "HAS_PARENT", "Reactome"))

        return relationships

    def parse_pathway_relationships(self, fhandler, mapping=None):
        relationships = set()
        regex = r"(.+)\s\[(.+)\]"
        organisms = self.config['organisms']
        for line in fhandler:
            data = line.rstrip("\r\n").split("\t")
            identifier = data[0]
            id_loc = data[2]
            pathway = data[3]
            evidence = data[6]
            organism = data[7]
            match = re.search(regex, id_loc)
            loc = "unspecified"
            if match:
                name = match.group(1)
                loc = match.group(2)
                if organism in organisms:
                    organism = organisms[organism]
                    if mapping is not None:
                        if identifier in mapping:
                            identifier = mapping[identifier]
                        elif name in mapping:
                            identifier = mapping[name]
                        else:
                            continue
                    relationships.add(
                        (identifier, pathway, "ANNOTATED_TO_PATHWAY", evidence, organism, loc, "Reactome"))

        return relationships
