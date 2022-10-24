#!/usr/bin/env python3

import re
import os
import sys
import click
import duckdb
import csv
import sqlite3
import tempfile

def db_init(reader:csv.DictReader, cur:sqlite3.Cursor, filein, table) -> list:
    line = next(reader)
    db_fields = {}
    db_columns = []

    for key in line.keys():
        db_columns.append(key)
        if line[key].isdigit():
            # is integer
            db_fields[key] = 'INTEGER'
        elif line[key].lstrip('-').replace('.', '', 1).isdigit():
            # is float/complex
            db_fields[key] = 'FLOAT'
        else:
            db_fields[key] = 'TEXT'
    # reset file line iterator
    filein.seek(0)
    next(reader)
    # run db init with key value concatenated to string
    cur.execute('CREATE TABLE IF NOT EXISTS '+table+' (' +
                ', '.join(['%s %s' % (key, value) for (key, value) in db_fields.items()]) + ')')

    return db_columns

def csv2sqlite(csvfile, dbfile, table_name="data", skip=False):
    if os.path.exists(dbfile) and not skip:
        raise Exception("%s exists, please delete it and retry." % dbfile)
    
    if csvfile.endswith('csv'):
        delimiter = ','
    elif csvfile.endswith('tsv'):
        delimiter = '\t'

    with open(csvfile, 'r') as filein:
        reader = csv.DictReader(filein, delimiter=delimiter)
        csv.field_size_limit(500 * 1024 * 1024)

        try:
            conn = sqlite3.connect(dbfile)
        except: # catch *all* exceptions
            e = sys.exc_info()[0]
            print(e)
            sys.exit(1)
        cur = conn.cursor()

        db_columns = db_init(reader, cur, filein, table_name)

        # add papers to table
        for line in reader:
            db_fields = []
            for key in line.keys():
                db_fields.append(line[key])

            qmarks = ','.join(['?'] * len(db_fields))
            columns = ','.join(db_columns)
            # print("INSERT INTO papers (" + columns + ") VALUES ({qm});".format(qm=qmarks))
            cur.execute("INSERT INTO " + table_name + " (" + columns + ") VALUES ({qm});".format(qm=qmarks), db_fields)

        conn.commit()
        
def csv2duckdb(csvfile, dbfile, table_name="data", skip=False):
    if os.path.exists(dbfile) and not skip:
        raise Exception("%s exists, please delete it and retry." % dbfile)
    conn = duckdb.connect(dbfile)
    conn.execute(
        "CREATE TABLE %s AS SELECT * FROM read_csv_auto('%s', HEADER=TRUE);" % (table_name, csvfile))

    conn.close()    
    

func_map = {
    "sqlite": csv2sqlite,
    "duckdb": csv2duckdb
}


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
        organ, datatype, method = os.path.splitext(filename)[0].split('_')
        csv_reader = read_csv(file)
        for item in csv_reader:
            data.append({
                "id": idx,
                "ensembl_id": item.get("ensembl_id"),
                "entrez_id": item.get("entrez_id"),
                "gene_symbol": item.get("gene_symbol"),
                "organ": organ,
                "method": method,
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


@database.command(help="Parse data files and make a dataset database.")
@click.option('--data-dir', '-d', required=True,
              type=click.Path(exists=True, dir_okay=True),
              help="The directory which saved the data files.")
@click.option('--output-dir', '-o', required=True,
              type=click.Path(exists=True, dir_okay=True),
              help="The directory which saved the database file.")
@click.option('--db', '-b', required=False, default="duckdb",
              type=click.Choice(["sqlite", "duckdb"]),
              help="Which type of database.")
def dataset(data_dir, output_dir, db):
    dataset_id = os.path.basename(data_dir)
    dbfile = os.path.join(output_dir, "%s.%s" % (dataset_id, db))

    # DEGs
    deg_dir = os.path.join(data_dir, "degs")
    files = os.listdir(deg_dir)
    pattern = r"[a-z]{3}_(fpkm_wilcox|fpkm_ttest|tpm_wilcox|tpm_ttest|counts_limma).csv"
    expected_files = [os.path.join(deg_dir, filename)
                      for filename in files if re.match(pattern, filename)]

    if len(expected_files) == 0:
        raise Exception(
            "Cannot find any expected data files in %s." % deg_dir)

    data = format_deg_table(expected_files)
    
    tempdir = tempfile.mkdtemp()
    datafile = os.path.join(tempdir, "rapex_degs.csv")
    write_csv(data, file=datafile)

    func_map.get(db)(datafile, dbfile, "degs")
    
    # Genes
    genes = map(lambda item: {
        "ensembl_id": item.get("ensembl_id"),
        "entrez_id": item.get("entrez_id"),
        "gene_symbol": item.get("gene_symbol")
    }, data)
    genefile = os.path.join(data_dir, "genes.csv")
    write_csv(list({v['ensembl_id']:v for v in genes}.values()), file=genefile)

    func_map.get(db)(genefile, dbfile, "genes", skip=True)
    
    # Expr
    expr_dir = os.path.join(data_dir, "expr")
    files = os.listdir(expr_dir)
    expected_files = [filename for filename in files if re.match(
        r"[a-z]{3}_(fpkm|tpm|counts).csv", filename)]

    if len(expected_files) == 0:
        raise Exception(
            "Cannot find any expected data files in %s." % data_dir)

    for datafile in expected_files:
        id = "expr_%s" % datafile.split('.')[0]
        datafile = os.path.join(expr_dir, datafile)
        func_map.get(db)(datafile, dbfile, id, skip=True)
        
    # Pathways
    datafile = os.path.join(data_dir, "pathways.tsv")

    if not os.path.exists(datafile):
        raise Exception(
            "%s doesn't exists, please prepare it and retry." % datafile)

    func_map.get(db)(datafile, dbfile, "pathways", skip=True)


if __name__ == '__main__':
    main = click.CommandCollection(sources=[database])
    main()
