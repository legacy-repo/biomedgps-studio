#!/usr/bin/env python3

import re
import os
import sys
import click
import time
import duckdb
import csv
import sqlite3
import tempfile
import json
import mygene
import glob
import xmltodict
import pandas as pd
from Bio import Entrez

Entrez.email = "yjcyxky@163.com"


def to_snake_case(string):
    # Replace non-alphanumeric characters with spaces
    string = re.sub(r'\W+', ' ', string)

    # Convert to lowercase and replace spaces with underscores
    return '_'.join(string.lower().split())


def format_key(key):
    formated_key = re.sub(r'[\-:*.]', '_', key).lower()
    if formated_key in ["type", "unique", "select", "database", "table", "default"]:
        return "_" + formated_key
    else:
        return formated_key


def db_init(reader: csv.DictReader, cur: sqlite3.Cursor, filein, table) -> list:
    line = next(reader)
    db_fields = {}
    db_columns = []

    for key in line.keys():
        formated_key = format_key(key)
        db_columns.append(formated_key)
        if line[key].isdigit():
            # is integer
            db_fields[formated_key] = 'INTEGER'
        elif line[key].lstrip('-').replace('.', '', 1).isdigit():
            # is float/complex
            db_fields[formated_key] = 'FLOAT'
        else:
            db_fields[formated_key] = 'TEXT'

    # reset file line iterator
    filein.seek(0)
    next(reader)

    # run db init with key value concatenated to string
    query_str = 'CREATE TABLE IF NOT EXISTS '+table+' (' + \
                ', '.join(['%s %s' % (key, value)
                          for (key, value) in db_fields.items()]) + ')'
    try:
        print("SQL query string: %s" % query_str)
        cur.execute(query_str)
    except Exception as err:
        print(query_str)
        raise Exception(err)

    return db_columns


def csv2sqlite(csvfile, dbfile, table_name="data", skip=False):
    if os.path.exists(dbfile) and not skip:
        raise Exception("%s exists, please delete it and retry." % dbfile)

    delimiter = ','
    if csvfile.endswith('csv'):
        delimiter = ','
    elif csvfile.endswith('tsv'):
        delimiter = '\t'

    with open(csvfile, 'r') as filein:
        reader = csv.DictReader(filein, delimiter=delimiter)
        csv.field_size_limit(500 * 1024 * 1024)

        try:
            conn = sqlite3.connect(dbfile)
        except:  # catch *all* exceptions
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
            # print("INSERT INTO " + table_name + " (" + columns +
            #   ") VALUES ({qm});".format(qm=qmarks), db_fields)
            cur.execute("INSERT INTO " + table_name + " (" + columns +
                        ") VALUES ({qm});".format(qm=qmarks), db_fields)

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


def read_csv(csvfile, sep=","):
    with open(csvfile, 'r') as csvfile:
        reader = csv.DictReader(csvfile, delimiter=sep)
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


def write_csv(data, file="data.csv", sep=","):
    with open(file, 'w') as csvfile:
        fieldnames = data[0].keys()
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames, delimiter=sep)
        writer.writeheader()

        for item in data:
            writer.writerow(item)


def write_json(data, file="data.json"):
    with open(file, 'w') as jsonfile:
        jsonfile.write(json.dumps(data))


def fetch_ncbi_gene(ensembl_ids):
    handle = Entrez.efetch(db="gene", id=ensembl_ids, retmode="xml")
    result = xmltodict.parse(
        ''.join([i.decode().strip() for i in handle.readlines()]))
    return result.get("Entrezgene-Set").get("Entrezgene")


def fetch_ncbi_gene_summaries(entrez_ids):
    entrez_ids_str = ",".join(entrez_ids)
    handle = Entrez.esummary(db="gene", id=entrez_ids_str)
    result = xmltodict.parse(
        ''.join([i.decode().strip() for i in handle.readlines()]))
    esummary = result.get("eSummaryResult")
    document_summary_set = esummary.get("DocumentSummarySet")
    document_summaries = document_summary_set.get("DocumentSummary", "")
    summary_dict = {i.get("@uid"): i.get("Summary")
                    for i in document_summaries}
    results = [summary_dict.get(id, "") for id in entrez_ids]
    return results

    # Cannot get matched results
    # ncbi_gene_results = fetch_ncbi_gene(entrez_ids)
    # return [result.get("Entrezgene_summary")
    #         for result in ncbi_gene_results]


def fetch_my_gene(ensembl_ids):
    mg = mygene.MyGeneInfo()
    return mg.getgenes(ensembl_ids)


def merge_dict(dict1, dict2):
    return {**dict1, **dict2}


def format_pubmed_ids(pubmed_list):
    if pubmed_list:
        return ",".join(map(str, [i.get("pubmed") for i in pubmed_list]))
    else:
        return ""


def format_pfam(pfam):
    if type(pfam) == list:
        return ','.join(pfam)
    else:
        return pfam


def format_pdb(pdb):
    if type(pdb) == list:
        return ','.join(pdb)
    else:
        return pdb


def format_swiss_p(swiss_p):
    if type(swiss_p) == list:
        return ','.join(swiss_p)
    else:
        return swiss_p


def format_alias(alias):
    if type(alias) == list:
        return ','.join(alias)
    else:
        return alias


def format_prosite(prosite):
    if type(prosite) == list:
        return ','.join(prosite)
    else:
        return prosite


def format_mgi(mgi):
    if type(mgi) == list:
        return ','.join(mgi)
    else:
        return mgi


def format_genomic_pos(genomic_pos, field="start"):
    if genomic_pos:
        if type(genomic_pos) == list:
            return ",".join(map(str, [i.get(field) for i in genomic_pos]))
        else:
            return genomic_pos.get(field)
    else:
        return ""


def format_pubmed(pubmed):
    if pubmed:
        return "|".join(["#".join([str(i.get("pubmed")),
                                   re.sub("[\t\n]+", " ", i.get("text"))]) for i in pubmed])
    else:
        return "Unknown"


def format_genes_output(results):
    formated_results = []
    for result in results:
        genomic_pos = result.get("genomic_pos")
        formated_results.append({
            "gene_symbol": result.get("gene_symbol"),
            "ensembl_id": result.get("ensembl_id"),
            "entrez_id": result.get("entrez_id"),
            "name": result.get("name"),
            "taxid": result.get("taxid"),
            "type_of_gene": result.get("type_of_gene"),
            "description": result.get("description"),
            # http://www.informatics.jax.org/marker/MGI:95773
            "mgi_id": format_mgi(result.get("MGI")),
            # https://www.rcsb.org/structure/3AB3
            "pdb": format_pdb(result.get("pdb")),
            # https://www.ebi.ac.uk/interpro/search/text/PF00503
            "pfam": format_pfam(result.get("pfam")),
            # https://pubmed.ncbi.nlm.nih.gov/23703206,23703205
            "pubmed_ids": format_pubmed_ids(result.get("generif")),
            "pubmed": format_pubmed(result.get("generif")),
            "alias": format_alias(result.get("alias")),
            "chromosome": format_genomic_pos(genomic_pos, "chr"),
            "start": format_genomic_pos(genomic_pos, "start"),
            "end": format_genomic_pos(genomic_pos, "end"),
            "strand": format_genomic_pos(genomic_pos, "strand"),
            "swiss_p": format_swiss_p(result.get("ipi")),
            # https://prosite.expasy.org/cgi-bin/prosite/prosite_search_full.pl?SEARCH=xxx
            "prosite": format_prosite(result.get("prosite")),
        })
    return formated_results


@click.group()
def database():
    pass


@database.command(help="Generate graph metadata file.")
@click.option('--entity-dir', '-e', required=True,
              type=click.Path(exists=True, dir_okay=True, file_okay=False),
              help="The directory which saved the entity files.")
@click.option('--relationship-dir', '-r', required=True,
              type=click.Path(exists=True, dir_okay=True, file_okay=False),
              help="The directory which saved the relationship files.")
@click.option('--output-file', '-o', required=False, default="graph_metadata.json",
              help="The output file name.")
@click.option('--format', '-f', required=False, default="csv", type=click.Choice(["csv", "tsv"]))
def graph_metadata(entity_dir, relationship_dir, output_file, format):
    entity_files = [os.path.join(entity_dir, f)
                    for f in os.listdir(entity_dir) if f.endswith(format)]
    relationship_files = [os.path.join(relationship_dir, f)
                          for f in os.listdir(relationship_dir) if f.endswith(format)]

    graph_labels = {}
    print("Entity files:", len(entity_files))
    for f in entity_files:
        df = pd.read_csv(f, sep="\t" if format == "tsv" else ",", header=0)
        entity_type = to_snake_case(df[":LABEL"][0])
        print("Entity type:", entity_type, "file:", f,
              "rows:", df.shape[0], "columns:", df.shape[1])
        r = graph_labels.get(entity_type)
        if r is None:
            graph_labels[entity_type] = [f]
        else:
            graph_labels[entity_type] = r + [f]

    relationship_labels = []
    print("Relationship files:", len(relationship_files))
    for f in relationship_files:
        df = pd.read_csv(f, sep="\t" if format == "tsv" else ",", header=0)
        nrows = df.shape[0]
        if nrows > 0:
            relation_type = df["TYPE"][0]
            start_node_type = relation_type.split("::")[-1].split(":")[0]
            end_node_type = relation_type.split("::")[-1].split(":")[1]
            relationship_labels.append({
                "relation_type": relation_type,
                "start_node_type": start_node_type,
                "end_node_type": end_node_type,
                "relation_count": nrows,
            })

    output_dir = os.path.dirname(output_file)
    graph_metadata_file = os.path.join(output_dir, "graph_metadata.tsv")
    pd.DataFrame(relationship_labels).to_csv(
        graph_metadata_file, sep="\t", index=False)

    graph_labels["graph_metadata"] = graph_metadata_file
    print("Graph Labels:", graph_labels)
    with open(output_file, "w") as f:
        json.dump(graph_labels, f, indent=4)


@database.command(help="Parse graph files and make a graph labels database.")
@click.option('--graph-metadata-file', '-m', required=True,
              type=click.Path(exists=True, dir_okay=False, file_okay=True),
              help="The graph metadata file.")
@click.option('--output-dir', '-o', required=True,
              type=click.Path(exists=True, dir_okay=True, file_okay=False),
              help="The directory which saved the database file.")
@click.option('--db', '-b', required=False, default="sqlite",
              type=click.Choice(["sqlite", "duckdb"]),
              help="Which type of database.")
def graph_labels(graph_metadata_file, output_dir, db):
    # labels = {
    #     "gene": "HGNC_MGI/Gene.tsv",
    #     "metabolite": "HMDB/Metabolite.tsv",
    #     "pathway": "PathwayCommons/Pathway.tsv",
    #     "transcript": "RefSeq/Transcript.tsv",
    #     "protein": "UniProt/Protein.tsv",
    #     "peptide": "UniProt/Peptide.tsv",
    #     "disease": "Ontologies/Disease.tsv",
    #     "phenotype": "Ontologies/Phenotype.tsv",
    #     "publication": "JensenLab/Publications.tsv",
    #     "graph_metadata": "graph_metadata.tsv"
    # }

    if not os.path.exists(graph_metadata_file):
        error_msg = """
        Cannot find the metadata file (%s), you need to prepare the metadata file first. 
        The metadata file should be a json file and contains the following keys:
        {
            "<db_name1>": ["<data_file1>"],
            "<db_name2>": ["<data_file2>"],
            ...
            "<db_nameN>": ["<data_fileN>"],
            "graph_metadata": "graph_metadata.tsv"
        }

        <db_name>: the name of the database table, it's the lower case of label name. such as gene, metabolite, pathway, etc. Their corresponding label names are: Gene, Metabolite, Pathway, etc.
        <db_file>: the data file which contains the data of the database table. The data file should be a tsv file. **Please just keep it same with the node file that you imported to the graph database.**

        graph_metadata: [required] the data file which contains the metadata of the graph. The data file should be a tsv file. The metadata file should contains the following columns:
            - start_node_type: the type of the start node, such as Gene, Metabolite, Pathway, etc.
            - relation_type: the type of the relation, such as Gene-Pathway, Gene-Disease, etc. It's up to you to define the relation type.
            - end_node_type: the type of the end node, such as Gene, Metabolite, Pathway, etc.
            - relation_count: the number of the relations between the start node and the end node.
        """ % graph_metadata_file
        print(error_msg)
        return

    with open(graph_metadata_file, "r") as f:
        labels = json.load(f)

        dbfile = os.path.join(output_dir, "%s.%s" % ("graph_labels", db))
        if os.path.exists(dbfile):
            raise Exception("The database file (%s) already exists." % dbfile)

        for key in labels.keys():
            file_list = labels[key] \
                if type(labels[key]) == list else [labels[key]]
            df_list = []
            # Loop over each CSV file and load it into a pandas DataFrame
            for file in file_list:
                file = os.path.join(os.path.dirname(graph_metadata_file), file)
                df = pd.read_csv(file, sep="," if file.endswith(
                    "csv") else "\t", header=0)
                df_list.append(df)

            # Concatenate the DataFrames into a single DataFrame
            merged_df = pd.concat(df_list)

            # Create a temporary file for writing
            with tempfile.NamedTemporaryFile(mode='w', suffix=".csv", delete=False) as temp_file:

                # Write the merged DataFrame to the temporary file as a CSV
                print("Merged DataFrame:", temp_file.name)
                merged_df.to_csv(temp_file.name, index=False)
                temp_file_path = temp_file.name

                if os.path.exists(temp_file_path):
                    func_map.get(db)(temp_file_path, dbfile,
                                     table_name=key, skip=True)
                else:
                    print("Cannot find the datafile (%s)" % temp_file_path)


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
    genefile = os.path.join(data_dir, "formated_genes.tsv")

    if not os.path.exists(genefile):
        genes = map(lambda item: {
            "ensembl_id": item.get("ensembl_id"),
            "entrez_id": item.get("entrez_id"),
            "gene_symbol": item.get("gene_symbol")
        }, data)
        genefile = os.path.join(data_dir, "genes.csv")
        write_csv(
            list({v['ensembl_id']: v for v in genes}.values()), file=genefile)

    print("Import %s into database" % genefile)
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

    # Similar Genes
    similar_genes_dir = os.path.join(data_dir, "similar_genes")
    files = os.listdir(similar_genes_dir)
    expected_files = [filename for filename in files if re.match(
        r"[a-z]{3}_similar_genes.csv", filename)]

    if len(expected_files) == 0:
        raise Exception(
            "Cannot find any expected data files in %s." % data_dir)

    for datafile in expected_files:
        id = datafile.split('.')[0]
        datafile = os.path.join(similar_genes_dir, datafile)
        func_map.get(db)(datafile, dbfile, id, skip=True)


@database.command(help="Get the gene information from NCBI and myGene.")
@click.option('--gene-list-file', '-i', required=True, help="A file which contains gene ids.")
@click.option('--output-file', '-o', required=False, help="A output file.", default="genes.json")
@click.option('--output-tsv', is_flag=True, help='Whether to output tsv file.')
@click.option('--step', '-s', help='How many steps?', default=200)
@click.option('--waiting-seconds', '-w', type=int, default=2,
              help='How many seconds do you need to wait?.',)
def genes(gene_list_file, output_file, output_tsv, step, waiting_seconds):
    genes = read_csv(gene_list_file)

    if len(genes) == 0:
        raise Exception("Not a valid gene list file.")

    ids = genes[0].keys()
    if 'ensembl_id' not in ids:
        raise Exception("ensembl_id doesn't exist in the gene list file.")

    for (index, genesets) in enumerate([genes[i:i+step] for i in range(0, len(genes), step)]):
        filename = "_%s-%s.json" % ((index * step), (index * step) + step)
        outfile = output_file.replace(".json", filename)

        if not (os.path.exists(outfile) and os.path.exists(outfile.replace("json", "tsv"))):
            results = []
            ensembl_ids = [gene.get("ensembl_id") for gene in genesets]
            entrez_ids = [gene.get("entrez_id") for gene in genesets]
            print("Querying %s genes" % len(ensembl_ids))
            summaries = fetch_ncbi_gene_summaries(entrez_ids)
            mygene_results = fetch_my_gene(ensembl_ids)

            print("Get gene info: %s, %s" %
                  (len(summaries), len(mygene_results)))

            for (idx, gene) in enumerate(genesets):
                summary = {"description": summaries[idx]}
                mygene = mygene_results[idx]
                # print("Summary: %s, My Gene: %s" % (summary, mygene.keys()))
                gene_info = merge_dict(merge_dict(summary, mygene), gene)
                results.append(gene_info)

            write_json(results, file=outfile)

            if output_tsv:
                tsv_content = format_genes_output(results)
                write_csv(tsv_content, file=outfile.replace(".json", ".tsv"),
                          sep="\t")
            time.sleep(waiting_seconds)
        else:
            print("%s exists, so skip it." % outfile)


@database.command(help="Merge csv/tsv files.")
@click.option('--data-dir', '-d', required=True,
              type=click.Path(exists=True, dir_okay=True),
              help="A directory which contains csv/tsv files.")
@click.option('--output-file', '-o', required=False, default="output.tsv", help="A path of output file.")
@click.option('--output-csv', is_flag=True, help="Output as csv file?")
def merge(data_dir, output_file, output_csv):
    def read_file(filepath):
        if filepath.endswith("tsv"):
            return pd.read_csv(filepath, sep='\t')
        else:
            return pd.read_csv(filepath, sep=',')

    all_files = glob.glob(os.path.join(data_dir, "*.csv"))
    all_files.extend(glob.glob(os.path.join(data_dir, "*.tsv")))
    print("Merge %s files in %s" % (len(all_files), data_dir))

    if all_files:
        df_from_each_file = (read_file(f) for f in all_files)
        df_merged = pd.concat(df_from_each_file, ignore_index=True)
        if output_csv:
            df_merged.to_csv(output_file, sep=",", index=False)
        else:
            df_merged.to_csv(output_file, sep="\t", index=False)


if __name__ == '__main__':
    main = click.CommandCollection(sources=[database])
    main()
