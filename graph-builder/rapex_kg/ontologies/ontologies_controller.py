import os
import sys
import logging
import re
import click
import os.path
import pandas as pd
import csv
import sys
import yaml
import ftplib
import wget
import requests
import datetime
import coloredlogs
import verboselogs
from collections import defaultdict

import sys
sys.path.append(os.getcwd())

import rapex_kg
from rapex_kg.ontologies.parsers import snomedParser
from rapex_kg.ontologies.parsers import icdParser
from rapex_kg.ontologies.parsers import oboParser
from rapex_kg.ontologies.parsers import reflectParser
from rapex_kg.ontologies.parsers import efoParser


verboselogs.install()
coloredlogs.install(fmt='%(asctime)s - %(module)s:%(lineno)d - %(levelname)s - %(message)s')
logger = logging.getLogger('root')


class Ontology:
    def __init__(self, import_directory, ontology_directory, download=True, skip=True) -> None:
        self.import_directory = import_directory
        self.ontology_directory = ontology_directory

        config_dir = os.path.dirname(os.path.abspath(rapex_kg.__file__))
        self.config_fpath = os.path.join(config_dir, "config.yml")
        logger.info("Load config file %s" % self.config_fpath)
        builder_config = self.read_yaml(self.config_fpath)

        self.config = builder_config["ontology"]
        self.download = download
        self.skip = skip
        if self.download:
            self.updated_on = str(datetime.date.today())
        else:
            self.updated_on = None

    def read_yaml(self, yaml_file):
        content = None
        with open(yaml_file, 'r') as stream:
            try:
                content = yaml.safe_load(stream)
            except yaml.YAMLError as err:
                raise yaml.YAMLError(
                    "The yaml file {} could not be parsed. {}".format(yaml_file, err))
        return content

    def entries_to_remove(self, entries, the_dict):
        """
        This function removes pairs from a given dictionary, based on a list of provided keys.

        :param list entries: list of keys to be deleted from dictionary.
        :param dict the_dict: dictionary.
        :return: The original dictionary minus the key,value pairs from the provided entries list.
        """
        for key in entries:
            if key in the_dict:
                del the_dict[key]

    def get_extra_pairs(self, directory, extra_file):
        extra = set()
        file_path = os.path.join(directory, extra_file)

        if os.path.isfile(file_path):
            with open(file_path, 'r') as f:
                for line in f:
                    data = line.rstrip("\r\n").split("\t")
                    extra.add(tuple(data))

        return extra

    def get_extra_entities_rels(self, ontology_directory):
        extra_entities_file = 'extra_entities.tsv'
        extra_entities = self.get_extra_pairs(
            ontology_directory, extra_entities_file)
        extra_rels_file = 'extra_rels.tsv'
        extra_rels = self.get_extra_pairs(ontology_directory, extra_rels_file)

        return extra_entities, extra_rels

    def check_directory(self, directory):
        """
        Checks if given directory exists and if not, creates it.

        :param str directory: path to folder.
        """
        if not os.path.exists(directory):
            os.makedirs(directory)

    def download_from_ftp(self, ftp_url, user, password, to, file_name):
        try:
            domain = ftp_url.split('/')[2]
            ftp_file = '/'.join(ftp_url.split('/')[3:])
            with ftplib.FTP(domain) as ftp:
                ftp.login(user=user, passwd=password)
                with open(os.path.join(to, file_name), 'wb') as fp:
                    ftp.retrbinary("RETR " + ftp_file,  fp.write)
        except ftplib.error_reply as err:
            raise ftplib.error_reply(
                "Exception raised when an unexpected reply is received from the server. {}.\nURL:{}".format(err, ftp_url))
        except ftplib.error_temp as err:
            raise ftplib.error_temp(
                "Exception raised when an error code signifying a temporary error. {}.\nURL:{}".format(err, ftp_url))
        except ftplib.error_perm as err:
            raise ftplib.error_perm(
                "Exception raised when an error code signifying a permanent error. {}.\nURL:{}".format(err, ftp_url))
        except ftplib.error_proto:
            raise ftplib.error_proto(
                "Exception raised when a reply is received from the server that does not fit the response specifications of the File Transfer Protocol. {}.\nURL:{}".format(err, ftp_url))

    def download_db(self, database_url, directory, file_name=None, user="", password="", avoid_wget=False):
        """
        This function downloads the raw files from a biomedical database server when a link is provided.

        :param str databaseURL: link to access biomedical database server.
        :param directory:
        :type directory: str or None
        :param file_name: name of the file to dowload. If None, 'databaseURL' must contain \
                            filename after the last '/'.
        :type file_name: str or None
        :param str user: username to access biomedical database server if required.
        :param str password: password to access biomedical database server if required.
        """
        if file_name is None:
            file_name = database_url.split(
                '/')[-1].replace('?', '_').replace('=', '_')

        header = {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36'}

        filepath = os.path.join(directory, file_name)
        logger.info("Download file %s" % filepath)
        if os.path.exists(filepath):
            if self.skip:
                logger.info("%s exists, don't need to download it." % filepath)
                return None
            else:
                os.remove(filepath)
        try:
            if database_url.startswith('ftp:'):
                self.download_from_ftp(
                    database_url, user, password, directory, file_name)
            else:
                try:
                    if not avoid_wget:
                        wget.download(database_url, os.path.join(
                            directory, file_name))
                    else:
                        r = requests.get(database_url, headers=header)
                        with open(os.path.join(directory, file_name), 'wb') as out:
                            out.write(r.content)
                except Exception:
                    r = requests.get(database_url, headers=header)
                    with open(os.path.join(directory, file_name), 'wb') as out:
                        out.write(r.content)
        except Exception as err:
            raise Exception(
                "Something went wrong. {}.\nURL:{}".format(err, database_url))

    def get_current_time(self):
        """
        Returns current date (Year-Month-Day) and time (Hour-Minute-Second).

        :return: Two strings: date and time.
        """
        now = datetime.datetime.now()
        return '{}-{}-{}'.format(now.year, now.month, now.day), '{}:{}:{}'.format(now.hour, now.minute, now.second)

    def file_size(self, file_path):
        """
        This function returns the file size.

        :param str file_path: path to file.
        :return: Size in bytes of a plain file.
        :rtype: str
        """
        if os.path.isfile(file_path):
            file_info = os.stat(file_path)
            return str(file_info.st_size)

    def _build_stats(self, count, otype, name, dataset, filename, updated_on=None):
        """
        Returns a tuple with all the information needed to build a stats file.

        :param int count: number of entities/relationships.
        :param str otype: 'entity' or 'relationsgips'.
        :param str name: entity/relationship label.
        :param str dataset: database/ontology.
        :param str filename: path to file where entities/relationships are stored.
        :return: Tuple with date, time, database name, file where entities/relationships are stored, \
        file size, number of entities/relationships imported, type and label.
        """
        y, t = self.get_current_time()
        size = self.file_size(filename)
        filename = filename.split('/')[-1]

        return (str(y), str(t), dataset, filename, size, count, otype, name, updated_on)

    def parse_ontology(self, ontology):
        """
        Parses and extracts data from a given ontology file(s), and returns a tuple with multiple dictionaries.

        :param str ontology: acronym of the ontology to be parsed (e.g. Disease Ontology:'DO').
        :param bool download: wether database is to be downloaded.
        :return: Tuple with three nested dictionaries: terms, relationships between terms, and definitions of the terms.\
                For more information on the returned dictionaries, see the documentation for any ontology parser.
        """
        directory = self.ontology_directory
        ontology_directory = os.path.join(directory, ontology)
        self.check_directory(ontology_directory)
        ontology_files = []
        ontologyData = None
        mappings = None
        extra_entities = set()
        extra_rels = set()
        if ontology in self.config["ontology_types"]:
            otype = self.config["ontology_types"][ontology]
            if 'urls' in self.config:
                if otype in self.config['urls']:
                    urls = self.config['urls'][otype]
                    for url in urls:
                        f = url.split('/')[-1].replace('?',
                                                       '_').replace('=', '_')
                        ontology_files.append(
                            os.path.join(ontology_directory, f))
                        if self.download:
                            self.download_db(
                                url, directory=ontology_directory, file_name=f)
                elif otype in self.config["files"]:
                    ofiles = self.config["files"][otype]
                    for f in ofiles:
                        if '*' not in f:
                            if os.path.isfile(os.path.join(directory, f)):
                                ontology_files.append(
                                    os.path.join(directory, f))
                            else:
                                logger.error(
                                    "Error: file {} is not in the directory {}".format(f, directory))
                        else:
                            ontology_files.append(os.path.join(directory, f))

            filters = None
            if otype in self.config["parser_filters"]:
                filters = self.config["parser_filters"][otype]
            extra_entities, extra_rels = self.get_extra_entities_rels(
                ontology_directory)
        if len(ontology_files) > 0:
            if ontology == "SNOMED-CT":
                ontologyData = snomedParser.parser(ontology_files, filters)
            elif ontology == "ICD":
                ontologyData = icdParser.parser(ontology_files)
            elif ontology == 'EFO':
                ontologyData, mappings = efoParser.parser(ontology_files)
            else:
                ontologyData = oboParser.parser(ontology, ontology_files)
                self.build_mapping_from_obo(
                    ontology_files[0], ontology, ontology_directory)
        else:
            if ontology == "SNOMED-CT":
                logger.info("WARNING: SNOMED-CT terminology needs to be downloaded manually since it requires UMLS License. More information available here: https://www.nlm.nih.gov/databases/umls.html")
            else:
                logger.info(
                    "WARNING: Ontology {} could not be downloaded. Check that the link in configuration works.".format(ontology))

        return ontologyData, mappings, extra_entities, extra_rels

    def build_mapping_from_obo(self, oboFile, ontology, outputDir):
        """
        Parses and extracts ontology idnetifiers, names and synonyms from raw file, and writes all the information \
        to a .tsv file.
        :param str oboFile: path to ontology raw file.
        :param str ontology: ontology database acronym as defined in ontologies_config.yml.
        """
        cmapping_file = os.path.join(outputDir, "complete_mapping.tsv")
        mapping_file = os.path.join(outputDir, "mapping.tsv")
        identifiers = defaultdict(list)
        re_synonyms = r'\"(.+)\"'

        if os.path.exists(cmapping_file):
            os.remove(cmapping_file)

        with open(oboFile, 'r') as f:
            for line in f:
                if line.startswith("id:"):
                    ident = ":".join(line.rstrip("\r\n").split(":")[1:])
                elif line.startswith("name:"):
                    name = "".join(line.rstrip("\r\n").split(':')[1:])
                    identifiers[ident.strip()].append(("NAME", name.lstrip()))
                elif line.startswith("xref:"):
                    source_ref = line.rstrip("\r\n").split(":")[1:]
                    if len(source_ref) == 2:
                        identifiers[ident.strip()].append(
                            (source_ref[0].strip(), source_ref[1]))
                elif line.startswith("synonym:"):
                    synonym_type = "".join(line.rstrip("\r\n").split(":")[1:])
                    matches = re.search(re_synonyms, synonym_type)
                    if matches:
                        identifiers[ident.strip()].append(
                            ("SYN", matches.group(1).lstrip()))
        with open(mapping_file, 'w') as out:
            for ident in identifiers:
                for source, ref in identifiers[ident]:
                    out.write(ident+"\t"+source+"\t"+ref+"\n")

        os.rename(mapping_file, cmapping_file)

    def generate_graph_files(self, ontologies=None):
        """
        This function parses and extracts data from a given list of ontologies. If no ontologies are provided, \
        all availables ontologies are used. Terms, relationships and definitions are saved as .tsv files to be loaded into \
        the graph database.

        :param str import_directory: relative path from current python module to 'imports' directory.
        :param ontologies: list of ontologies to be imported. If None, all available ontologies are imported.
        :type ontologies: list or None
        :param bool download: wether database is to be downloaded.
        :return: Dictionary of tuples. Each tuple corresponds to a unique label/relationship type, date, time, \
                database, and number of nodes and relationships.
        """
        entities = self.config["ontologies"]
        if ontologies is not None:
            entities = {}
            for ontology in ontologies:
                ontology = ontology.capitalize()
                if ontology.capitalize() in self.config["ontologies"]:
                    entities.update(
                        {ontology: self.config["ontologies"][ontology]})

        stats = set()
        for entity in entities:
            ontology = self.config["ontologies"][entity]
            if ontology in self.config["ontology_types"]:
                ontologyType = self.config["ontology_types"][ontology]
            try:
                result, mappings, extra_entities, extra_rels = self.parse_ontology(
                    ontology)
                if result is not None:
                    terms, relationships, definitions = result
                    for namespace in terms:
                        if namespace in self.config["entities"]:
                            name = self.config["entities"][namespace]
                            entity_outputfile = os.path.join(
                                self.import_directory, name + ".tsv")
                            with open(entity_outputfile, 'w', encoding='utf-8') as csvfile:
                                writer = csv.writer(
                                    csvfile, delimiter='\t', escapechar='\\', quotechar='"', quoting=csv.QUOTE_ALL)
                                writer.writerow(
                                    ['ID', ':LABEL', 'name', 'description', 'type', 'synonyms'])
                                num_terms = 0
                                for term in terms[namespace]:
                                    writer.writerow([term, entity, list(terms[namespace][term])[
                                                    0], definitions[term], ontologyType, ",".join(terms[namespace][term])])
                                    num_terms += 1
                                for extra_entity in extra_entities:
                                    writer.writerow(list(extra_entity))
                                    num_terms += 1
                            logger.info(
                                "Ontology {} - Number of {} entities: {}".format(ontology, name, num_terms))
                            stats.add(self._build_stats(
                                num_terms, "entity", name, ontology, entity_outputfile, self.updated_on))
                            if namespace in relationships:
                                relationships_outputfile = os.path.join(
                                    self.import_directory, name+"_has_parent.tsv")
                                relationships[namespace].update(extra_rels)
                                relationshipsDf = pd.DataFrame(
                                    list(relationships[namespace]))
                                relationshipsDf.columns = [
                                    'START_ID', 'END_ID', 'TYPE']
                                relationshipsDf.to_csv(path_or_buf=relationships_outputfile,
                                                       sep='\t',
                                                       header=True, index=False, quotechar='"',
                                                       quoting=csv.QUOTE_ALL,
                                                       line_terminator='\n', escapechar='\\')
                                logger.info("Ontology {} - Number of {} relationships: {}".format(
                                    ontology, name+"_has_parent", len(relationships[namespace])))
                                stats.add(self._build_stats(len(
                                    relationships[namespace]), "relationships", name+"_has_parent", ontology, relationships_outputfile, self.updated_on))
                else:
                    logger.warning(
                        "Ontology {} - The parsing did not work".format(ontology))
                if mappings is not None:
                    for name in mappings:
                        mappings_outputfile = os.path.join(
                            self.import_directory, name + ".tsv")
                        mappingsDf = pd.DataFrame(list(mappings[name]))
                        mappingsDf.columns = ['START_ID', 'END_ID', 'TYPE']
                        mappingsDf.to_csv(path_or_buf=mappings_outputfile,
                                          sep='\t',
                                          header=True, index=False, quotechar='"',
                                          quoting=csv.QUOTE_ALL,
                                          line_terminator='\n', escapechar='\\')
                        logger.info(
                            "Ontology {} - Number of {} relationships: {}".format(ontology, name, len(mappings[name])))
                        stats.add(self._build_stats(len(
                            mappings[name]), "relationships", name, ontology, mappings_outputfile, self.updated_on))
            except Exception as err:
                exc_type, exc_obj, exc_tb = sys.exc_info()
                fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
                logger.error("Error: {}. Ontology {}: {}, file: {},line: {}".format(
                    err, ontology, sys.exc_info(), fname, exc_tb.tb_lineno))
        return stats


@click.group()
def ontology():
    pass


@ontology.command(help="Parse ontologies and make related graph files.")
@click.option('--ontology-dir', '-d', required=True,
              type=click.Path(exists=True, dir_okay=True),
              help="The directory which saved the downloaded database files.")
@click.option('--output-dir', '-o', required=True,
              type=click.Path(exists=True, dir_okay=True),
              help="The directory which saved the graph files.")
@click.option('--download/--no-download', default=False, help="Whether download the source file(s)?")
@click.option('--skip/--no-skip', default=True, help="Whether skip the existing file(s)?")
def parse_ontology(ontology_dir, output_dir, download, skip):
    ontology_parser = Ontology(output_dir, ontology_dir, download, skip)
    ontology_parser.generate_graph_files()


if __name__ == "__main__":
    main = click.CommandCollection(sources=[ontology])
    main()
