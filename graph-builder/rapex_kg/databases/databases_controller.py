import os
import logging
import coloredlogs
import verboselogs
import click

import sys
sys.path.append(os.getcwd())

from rapex_kg.databases import config as config_mod
from rapex_kg.databases.parsers import parsers
from joblib import Parallel, delayed


verboselogs.install()
coloredlogs.install(fmt='%(asctime)s - %(module)s:%(lineno)d - %(levelname)s - %(message)s')
logger = logging.getLogger('root')


@click.group()
def database():
    pass


def _parse_database(import_directory, database_directory, database,
                    config_file=None, download=True, skip=True):
    stats = set()
    Parser = parsers.get(database, None)
    if Parser:
        parser = Parser(import_directory, database_directory,
                        config_file=config_file, download=download, skip=skip)
        stats = parser.build_stats()
    return stats


class NotSupportedAction(Exception):
    pass


@database.command(help="Parse databases and make the related graph files.")
@click.option('--db-dir', '-d', required=True,
              type=click.Path(exists=True, dir_okay=True),
              help="The directory which saved the downloaded database files.")
@click.option('--output-dir', '-o', required=True,
              type=click.Path(exists=True, dir_okay=True),
              help="The directory which saved the graph files.")
@click.option('--config', '-c', required=False,
              type=click.Path(exists=True, file_okay=True),
              help="The config file related with database.")
@click.option('--database', required=True, type=click.Choice(parsers.keys()),
              help="Which databases (you can specify the --database argument multiple times)?", multiple=True)
@click.option('--n-jobs', '-n', required=False,
              help="Hom many jobs?", default=4)
@click.option('--download/--no-download', default=False, help="Whether download the source file(s)?")
@click.option('--skip/--no-skip', default=True, help="Whether skip the existing file(s)?")
def parse_database(output_dir, db_dir, database, config, download, n_jobs, skip):
    if config and len(database) > 1:
        raise NotSupportedAction(
            "Cannot support a single config file with several databases.")

    all_databases = database
    valid_databases = list(
        filter(lambda database: database in parsers.keys(), all_databases))
    invalid_databases = list(
        filter(lambda database: database not in parsers.keys(), all_databases))
    if len(invalid_databases) > 0:
        logger.warn("%s databases (%s) is not valid, skip them.",
                    len(invalid_databases), invalid_databases)
    logger.info("Run jobs with (output_dir: %s, db_dir: %s, databases: %s, config: %s, download: %s, skip: %s)" %
                (output_dir, db_dir, all_databases, config, download, skip))
    stats = Parallel(n_jobs=n_jobs)(delayed(_parse_database)(output_dir, db_dir, db,
                                                             config_file=config, download=download, skip=skip)
                                    for db in valid_databases)
    allstats = {val if type(sublist) == set else sublist
                for sublist in stats for val in sublist}
    logger.info("Stats: %s" % allstats)
    return allstats


@database.command(help="Print the default config file.")
@click.option('--database', required=True, type=click.Choice(parsers.keys()),
              help="Which database?", multiple=False)
def print_config(database):
    config_dir = os.path.dirname(os.path.abspath(config_mod.__file__))
    config_file = os.path.join(config_dir, "%s.yml" % database)
    with open(config_file, 'r') as f:
        print(f.read())


if __name__ == "__main__":
    main = click.CommandCollection(sources=[database])
    main()
