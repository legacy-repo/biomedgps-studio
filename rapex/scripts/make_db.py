#!/usr/bin/env python3

import re
import os
import click
import duckdb
import csv


@click.group()
def database():
    pass


def read_csv(csvfile):
    with open(csvfile, 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        return [item for item in reader]


def format_deg_table(expected_files):
    data = []
    idx = 1
    for file in expected_files:
        filename = os.path.basename(file)
        organ, dataset, datatype, method = os.path.splitext(filename)[0].split('_')
        csv_reader = read_csv(file)
        for item in csv_reader:
            data.append({
                "id": idx,
                "ensembl_id": item.get("ensembl_id"),
                "entrez_id": item.get("entrez_id"),
                "gene_symbol": item.get("gene_symbol"),
                "organ": organ,
                "method": method,
                "dataset": dataset,
                "datatype": datatype,
                "padj": item.get("padj"),
                "pvalue": item.get("pvalue"),
                "logfc": item.get("logfc"),
                "direction": item.get("direction")
            })

            idx += 1

    return data


def write_csv(data, file="data.csv"):
    with open(file, 'w') as csvfile:
        fieldnames = data[0].keys()
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for item in data:
            writer.writerow(item)


@database.command(help="Parse data files and make a degs database.")
@click.option('--data-dir', '-d', required=True,
              type=click.Path(exists=True, dir_okay=True),
              help="The directory which saved the data files.")
@click.option('--output-dir', '-o', required=True,
              type=click.Path(exists=True, dir_okay=True),
              help="The directory which saved the database file.")
def degdb(data_dir, output_dir):
    files = os.listdir(data_dir)
    pattern = r"[a-z]{3}_[0-9]+_(fpkm_wilcox|fpkm_ttest|tpm_wilcox|tpm_ttest|counts_limma).csv"
    expected_files = [os.path.join(data_dir, filename)
                      for filename in files if re.match(pattern, filename)]

    if len(expected_files) == 0:
        raise Exception(
            "Cannot find any expected data files in %s." % data_dir)

    data = format_deg_table(expected_files)
    
    datafile = os.path.join(output_dir, "rapex_degs.csv")
    write_csv(data, file=datafile)

    # read_only=True
    dbfile = os.path.join(output_dir, "rapex_degs.duckdb")

    if os.path.exists(dbfile):
        raise Exception("%s exists, please delete it and retry." % dbfile)
    conn = duckdb.connect(dbfile)
    conn.execute(
        "CREATE TABLE data AS SELECT * FROM read_csv_auto('%s', HEADER=TRUE);" % datafile)

    conn.close()
    
    genes = map(lambda item: {
        "ensembl_id": item.get("ensembl_id"),
        "entrez_id": item.get("entrez_id"),
        "gene_symbol": item.get("gene_symbol")
    }, data)
    genefile = os.path.join(output_dir, "rapex_genes.csv")
    write_csv(list({v['ensembl_id']:v for v in genes}.values()), file=genefile)
    
    dbfile = os.path.join(output_dir, "rapex_genes.duckdb")
    if os.path.exists(dbfile):
        raise Exception("%s exists, please delete it and retry." % dbfile)
    conn = duckdb.connect(dbfile)
    conn.execute(
        "CREATE TABLE data AS SELECT * FROM read_csv_auto('%s', HEADER=TRUE);" % genefile)

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
        raise Exception(
            "Cannot find any expected data files in %s." % data_dir)

    for datafile in expected_files:
        id = datafile.split('.')[0]
        datafile = os.path.join(data_dir, datafile)
        results = conn.execute(
            "CREATE TABLE %s AS SELECT * FROM read_csv_auto('%s', HEADER=TRUE);" % (id, datafile))

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
        raise Exception(
            "%s doesn't exists, please prepare it and retry." % datafile)

    results = conn.execute(
        "CREATE TABLE kegg_pathway AS SELECT * FROM read_csv_auto('%s', HEADER=TRUE);" % datafile)

    conn.close()


if __name__ == '__main__':
    main = click.CommandCollection(sources=[database])
    main()
