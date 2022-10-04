import os
import yaml
import requests
import ftplib
import gzip
import wget
from Bio import SeqIO
import shutil
import logging
import pandas as pd
import csv
import datetime
import collections
import rapex_kg
import time
import verboselogs
from collections import defaultdict


logger = verboselogs.VerboseLogger('root')


class InvalidConfigPath(Exception):
    pass


class InvalidSubClass(Exception):
    pass


class BaseParser:
    '''
    TODO: 1. Check the prerequisites, such as databases? 
          2. Define the schema for each database?
          3. How to split all fields to two parts for building graph and attribute database respectively?
    '''

    def __init__(self, import_directory, database_directory, config_file=None, download=True, skip=True) -> None:
        config_dir = os.path.dirname(os.path.abspath(rapex_kg.__file__))
        self.builder_config = self.read_yaml(
            os.path.join(config_dir, "config.yml"))
        self.import_directory = import_directory
        self.database_directory = database_directory
        self.download = download
        self.skip = skip
        if self.download:
            self.updated_on = str(datetime.date.today())
        else:
            self.updated_on = None
        self.database_name = self.database_name if self.database_name else None
        # If the user pass a config file, use it instead of the default config file.
        if config_file:
            logger.warn(
                "CAUTION: Use the customized config file instead of the default config.")
            self.config_fpath = config_file
        else:
            self.config_fpath = self.config_fpath if self.config_fpath else None
        self.check_obj()
        self.config = self.read_config()

    def check_obj(self):
        if self.config_fpath and self.database_name:
            pass
        else:
            raise InvalidSubClass(
                'You need to set self.config_fpath and self.database_name.')

    def read_yaml(self, yaml_file):
        content = None
        with open(yaml_file, 'r') as stream:
            try:
                content = yaml.safe_load(stream)
            except yaml.YAMLError as err:
                raise yaml.YAMLError(
                    "The yaml file {} could not be parsed. {}".format(yaml_file, err))
        return content

    def read_config(self):
        logger.info("Read config file %s" % self.config_fpath)
        if self.config_fpath and os.path.exists(self.config_fpath):
            return self.read_yaml(self.config_fpath)
        else:
            raise InvalidConfigPath(
                "%s is not valid, you need to set self.config_fpath firstly." % self.config_fpath)

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

    def check_directory(self, directory):
        """
        Checks if given directory exists and if not, creates it.

        :param str directory: path to folder.
        """
        if not os.path.exists(directory):
            os.makedirs(directory)

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
        logger.info("Download file from %s into %s" % (database_url, filepath))
        if os.path.exists(filepath):
            if self.skip:
                logger.info("%s exists, don't need to download it." % filepath)
                return None
            else:
                os.remove(filepath)
        try:
            if database_url.startswith('ftp:'):
                self.download_from_ftp(database_url, user,
                                       password, directory, file_name)
            else:
                try:
                    if not avoid_wget:
                        wget.download(database_url,
                                      os.path.join(directory, file_name))
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

    def list_directory_files(directory):
        """
        Lists all files in a specified directory.

        :param str directory: path to folder.
        :return: List of file names.
        """
        from os import listdir
        from os.path import isfile, join
        onlyfiles = [f for f in listdir(directory) if isfile(
            join(directory, f)) and not f.startswith('.')]

        return onlyfiles

    def list_directory_folders(directory):
        """
        Lists all directories in a specified directory.

        :param str directory: path to folder.
        :return: List of folder names.
        """
        from os import listdir
        from os.path import isdir, join
        dircontent = [f for f in listdir(directory) if isdir(
            join(directory, f)) and not f.startswith('.')]
        return dircontent

    def remove_directory(self, directory):
        if os.path.exists(directory):
            files = self.list_directory_files(directory)
            folders = self.list_directory_folders(directory)
            if 'complete_mapping.tsv' in files:
                for f in files:
                    if f != 'complete_mapping.tsv':
                        os.remove(os.path.join(directory, f))
                for d in folders:
                    self.remove_directory(os.path.join(directory, d))
            else:
                shutil.rmtree(directory, ignore_errors=False, onerror=None)
        else:
            logger.success("Done")

    def write_entities(self, entities, header, outputfile):
        """
        Reads a set of entities and saves them to a file.

        :param set entities: set of tuples with entities data: identifier, label, name\
                            and other attributes.
        :param list header: list of column names.
        :param str outputfile: path to file to be saved (including filename and extention).
        """
        try:
            df = pd.DataFrame(list(entities), columns=header)
            df.to_csv(path_or_buf=outputfile, sep='\t',
                      header=True, index=False, quotechar='"',
                      line_terminator='\n', escapechar='\\')
        except csv.Error as err:
            raise csv.Error(
                "Error writing etities to file: {}.\n {}".format(outputfile, err))

    def write_relationships(self, relationships, header, outputfile):
        """
        Reads a set of relationships and saves them to a file.

        :param set relationships: set of tuples with relationship data: source node, target node, \
                                    relationship type, source and other attributes.
        :param list header: list of column names.
        :param str outputfile: path to file to be saved (including filename and extention).
        """
        try:
            df = pd.DataFrame(list(relationships), columns=header)
            df.to_csv(path_or_buf=outputfile, sep='\t',
                      header=True, index=False, quotechar='"',
                      line_terminator='\n', escapechar='\\')
        except Exception as err:
            raise csv.Error(
                "Error writing relationships to file: {}.\n {}".format(outputfile, err))

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

    def build_stats(self):
        raise NotImplementedError("build_stats method is not implemented.")

    def mark_complete_mapping(self):
        """
        Checks if mapping.tsv file exists and renames it to complete_mapping.tsv.
        """
        directory = os.path.join(self.database_directory, self.database_name)
        mapping_file = os.path.join(directory, "mapping.tsv")
        new_mapping_file = os.path.join(directory, "complete_mapping.tsv")
        if os.path.exists(mapping_file):
            os.rename(mapping_file, new_mapping_file)

    def reset_mapping(self):
        """
        Checks if mapping.tsv file exists and removes it.
        """
        directory = os.path.join(self.database_directory, self.database_name)
        mapping_file = os.path.join(directory, "complete_mapping.tsv")
        if os.path.exists(mapping_file):
            os.remove(mapping_file)

    def flatten(self, t):
        """
        Code from: https://gist.github.com/shaxbee/0ada767debf9eefbdb6e
        Acknowledgements: Zbigniew Mandziejewicz (shaxbee)
        Generator flattening the structure

        >>> list(flatten([2, [2, (4, 5, [7], [2, [6, 2, 6, [6], 4]], 6)]]))
        [2, 2, 4, 5, 7, 2, 6, 2, 6, 6, 4, 6]
        """
        for x in t:
            if not isinstance(x, collections.Iterable) or isinstance(x, str):
                yield x
            else:
                yield from self.flatten(x)

    def get_mapping_from_ontology(self, ontology, source=None):
        """
        Converts .tsv file with complete list of ontology identifiers and aliases,
        to dictionary with aliases as keys and ontology identifiers as values.

        :param str ontology: ontology label as defined in ontologies_config.yml.
        :param source: name of the source database for selecting aliases.
        :type source: str or None
        :return: Dictionary of aliases (keys) and ontology identifiers (values).
        """
        mapping = {}
        ont = self.builder_config["ontology"]["ontologies"][ontology]
        dir_file = os.path.join(self.database_directory, ont)
        logger.info("Get mapping from ontology %s in %s" % (ont, dir_file))
        mapping_file = os.path.join(dir_file, "complete_mapping.tsv")
        max_wait = 0
        while not os.path.isfile(mapping_file) and max_wait < 5000:
            logger.warn("No such file %s, please wait a minute or build the %s firstly." % (
                mapping_file, ont))
            time.sleep(5)
            max_wait += 1
        try:
            with open(mapping_file, 'r') as f:
                for line in f:
                    data = line.rstrip("\r\n").split("\t")
                    if data[1] == source or source is None:
                        mapping[data[2].lower()] = data[0]
        except Exception:
            raise Exception(
                "mapping - No mapping file {} for entity {}".format(mapping_file, ontology))

        return mapping

    def get_mapping_for_entity(self, entity):
        """
        Converts .tsv file with complete list of entity identifiers and aliases, \
        to dictionary with aliases as keys and entity identifiers as values.

        :param str entity: entity label as defined in databases_config.yml.
        :return: Dictionary of aliases (keys) and entity identifiers (value).
        """
        mapping = {}
        sources = self.builder_config["database"]["sources"]
        logger.info("Get sources from database config %s" % sources)
        if entity in sources:
            source = sources[entity]
            dir = os.path.join(self.database_directory, source)
            logger.info("Get mapping from entity %s in %s" % (entity, dir))
            mapping_file = os.path.join(dir, "complete_mapping.tsv")
            max_wait = 0
            while not os.path.isfile(mapping_file) and max_wait < 5000:
                time.sleep(15)
                max_wait += 1
                logger.warn("No such file %s, please wait a minute or build the %s firstly." % (
                    mapping_file, source))
            try:
                with open(mapping_file, 'r', encoding='utf-8') as mf:
                    for line in mf:
                        data = line.rstrip("\r\n").split("\t")
                        if len(data) > 1:
                            ident = data[0]
                            alias = data[1]
                            mapping[alias] = ident
            except Exception as err:
                raise Exception(
                    "mapping - No mapping file {} for entity {}. Error: {}".format(mapping_file, entity, err))

        return mapping

    def get_multiple_mapping_for_entity(self, entity):
        """
        Converts .tsv file with complete list of entity identifiers and aliases, \
        to dictionary with aliases to other databases as keys and entity identifiers as values.

        :param str entity: entity label as defined in databases_config.yml.
        :return: Dictionary of aliases (keys) and set of unique entity identifiers (values).
        """
        mapping = defaultdict(set)
        sources = self.builder_config["database"]["sources"]
        logger.info("Get sources from database config %s" % sources)
        if entity in sources:
            source = sources[entity]
            dir = os.path.join(self.database_directory, source)
            logger.info("Get mapping from entity %s in %s" % (entity, dir))
            mapping_file = os.path.join(dir, "complete_mapping.tsv")
            max_wait = 0
            while not os.path.isfile(mapping_file) and max_wait < 5000:
                time.sleep(5)
                max_wait += 1
                logger.warn("No such file %s, please wait a minute or build the %s firstly." % (
                    mapping_file, source))
            try:
                with open(mapping_file, 'r') as mf:
                    for line in mf:
                        data = line.rstrip("\r\n").split("\t")
                        if len(data) > 1:
                            ident = data[0]
                            alias = data[1]
                            mapping[alias].add(ident)
            except Exception:
                raise Exception(
                    "mapping - No mapping file {} for entity {}".format(mapping, entity))

        return mapping

    def read_gzipped_file(self, filepath):
        """
        Opens an underlying process to access a gzip file through the creation of a new pipe to the child.

        :param str filepath: path to gzip file.
        :return: A bytes sequence that specifies the standard output.
        """
        handle = gzip.open(filepath, "rt")

        return handle

    def list_ftp_directory(self, ftp_url, user='', password=''):
        """
        Lists all files present in folder from FTP server.

        :param str ftp_url: link to access ftp server.
        :param str user: username to access ftp server if required.
        :param str password: password to access ftp server if required.
        :return: List of files contained in ftp server folder provided with ftp_url.
        """
        try:
            domain = ftp_url.split('/')[2]
            if len(ftp_url.split('/')) > 3:
                ftp_dir = '/'.join(ftp_url.split('/')[3:])
            else:
                ftp_dir = ''
            with ftplib.FTP(domain) as ftp:
                ftp.login(user=user, passwd=password)
                files = ftp.nlst(ftp_dir)
        except ftplib.error_perm as err:
            raise Exception(
                "builder_utils - Problem listing file at {} ftp directory > {}.".format(ftp_dir, err))

        return files

    def _parse_fasta(self, file_handler):
        """
        Using BioPython to read fasta file as SeqIO objects

        :param file_handler file_handler: opened fasta file
        :return iterator records: iterator of sequence objects
        """
        records = SeqIO.parse(file_handler, format="fasta")

        return records

    def batch_iterator(self, iterator, batch_size):
        """Returns lists of length batch_size.

        This can be used on any iterator, for example to batch up
        SeqRecord objects from Bio.SeqIO.parse(...), or to batch
        Alignment objects from Bio.AlignIO.parse(...), or simply
        lines from a file handle.

        This is a generator function, and it returns lists of the
        entries from the supplied iterator.  Each list will have
        batch_size entries, although the final list may be shorter.

        :param iterator iterator: batch to be extracted
        :param integer batch_size: size of the batch
        :return list batch: list with the batch elements of size batch_size

        source: https://biopython.org/wiki/Split_large_file
        """
        entry = True
        while entry:
            batch = []
            while len(batch) < batch_size:
                try:
                    entry = next(iterator)
                except StopIteration:
                    entry = None
                if entry is None:
                    # End of file
                    break
                batch.append(entry)
            if batch:
                yield batch
