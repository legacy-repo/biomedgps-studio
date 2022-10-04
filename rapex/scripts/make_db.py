#!/usr/bin/env python3

import re
import os
import click
import duckdb


@click.group()
def database():
    pass


@database.command(help="Parse data files and make a degs database.")
@click.option('--data-dir', '-d', required=True,
              type=click.Path(exists=True, dir_okay=True),
              help="The directory which saved the data files.")
@click.option('--output-dir', '-o', required=True,
              type=click.Path(exists=True, dir_okay=True),
              help="The directory which saved the database file.")
def degdb(data_dir, output_dir):
    # read_only=True
    dbfile = os.path.join(output_dir, "rapex_degs.duckdb")

    if os.path.exists(dbfile):
        raise ("%s exists, please delete it and retry." % dbfile)

    conn = duckdb.connect(dbfile)

    files = os.listdir(data_dir)
    expected_files = [filename for filename in files if re.match(
        r"[a-z]{3}_[0-9]+_(fpkm_wilcox|fpkm_ttest|tpm_wilcox|tpm_ttest|counts_limma).csv", filename)]

    if len(expected_files) == 0:
        raise Exception("Cannot find any expected data files in %s." % data_dir)    

    for datafile in expected_files:
        id = datafile.split('.')[0]
        results = conn.execute(
            "CREATE TABLE %s AS SELECT * FROM read_csv_auto('%s');" % (id, datafile))

    conn.close()


@database.command(help="Parse data files and make a expr database.")
@click.option('--data-dir', '-d', required=True,
              type=click.Path(exists=True, dir_okay=True),
              help="The directory which saved the data files.")
@click.option('--output-dir', '-o', required=True,
              type=click.Path(exists=True, dir_okay=True),
              help="The directory which saved the database file.")
def exprdb(data_dir, output_dir):
    # read_only=True
    dbfile = os.path.join(output_dir, "rapex_expr.duckdb")

    if os.path.exists(dbfile):
        raise Exception("%s exists, please delete it and retry." % dbfile)

    conn = duckdb.connect(dbfile)

    files = os.listdir(data_dir)
    expected_files = [filename for filename in files if re.match(
        r"[a-z]{3}_[0-9]+_(fpkm|tpm|counts).csv", filename)]
    
    if len(expected_files) == 0:
        raise Exception("Cannot find any expected data files in %s." % data_dir)
        
    for datafile in expected_files:
        id = datafile.split('.')[0]
        results = conn.execute(
            "CREATE TABLE %s AS SELECT * FROM read_csv_auto('%s');" % (id, datafile))

    conn.close()
    

@database.command(help="Parse data files and make a pathway database.")
@click.option('--data-dir', '-d', required=True,
              type=click.Path(exists=True, dir_okay=True),
              help="The directory which saved the data files.")
@click.option('--output-dir', '-o', required=True,
              type=click.Path(exists=True, dir_okay=True),
              help="The directory which saved the database file.")
def pathwaydb(data_dir, output_dir):
    # read_only=True
    dbfile = os.path.join(output_dir, "rapex_pathway.duckdb")

    if os.path.exists(dbfile):
        raise Exception("%s exists, please delete it and retry." % dbfile)

    conn = duckdb.connect(dbfile)

    datafile = os.path.join(data_dir, "pathways.tsv")
    
    if not os.path.exists(datafile):
        raise Exception("%s doesn't exists, please prepare it and retry." % datafile)
        
    results = conn.execute(
        "CREATE TABLE kegg_pathway AS SELECT * FROM read_csv_auto('%s');" % datafile)

    conn.close()


if __name__ == '__main__':
    main = click.CommandCollection(sources=[database])
    main()
