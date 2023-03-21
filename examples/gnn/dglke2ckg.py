import re
import os
import pandas as pd


def to_snake_case(string):
    # Replace non-alphanumeric characters with spaces
    string = re.sub(r'\W+', ' ', string)

    # Convert to lowercase and replace spaces with underscores
    return '_'.join(string.lower().split())


def read_entity_map(datafile):
    df = pd.read_csv(datafile, sep='\t', header=None)
    entities = list(df[1])

    entity_map = {}
    for entity in entities:
        [etype, eid] = entity.split("::")
        entity_map[eid] = etype

    return entity_map


def format_drugbank(datafile):
    df = pd.read_csv(datafile)
    df = df.rename(columns={
        'DrugBank ID': 'ID',
        'Common name': 'name',
        'Accession Numbers': 'accession_numbers',
        'CAS': 'cas_number',
        'Synonyms': 'synonyms',
        'Standard InChI Key': 'inchi_key',
        'UNII': 'unii'
    })

    df[':LABEL'] = 'Compound'

    df.to_csv('formated_data/drugbank.csv', index=False)


def format_doid(datafile):
    df = pd.read_csv(datafile, sep="\t", header=None)

    df = df.rename(columns={
        0: 'ID',
        1: 'name'
    })

    df[':LABEL'] = 'Disease'
    df.to_csv('formated_data/doid.csv', index=False)


def format_gene(datafile):
    df = pd.read_csv(datafile, usecols=lambda col: col in [
                     "entrez_id", "refseq_ids", "official_symbol",
                     "official_full_name", "taxname"
                     ])

    df = df.rename(columns={
        "entrez_id": "ID",
        "official_symbol": "name",
        "official_full_name": "full_name",
        "refseq_ids": "refseq_ids",
        "taxname": "taxname"
    })

    df[':LABEL'] = 'Gene'
    df['refseq_ids'] = df['refseq_ids'].str.replace(
        r"\['?|'?\]", "", regex=True).replace(r"', '", ",", regex=True)
    df.to_csv('formated_data/gene.csv', index=False)


def format_meddra(datafile):
    df = pd.read_csv(datafile, header=None, sep='\t')
    df = df.rename(columns={
        0: 'ID',
        1: 'type',
        2: 'meddra',
        3: 'name'
    })

    df = df.groupby('ID').agg({
        'type': lambda x: ','.join(set(x)),
        'meddra': 'first',
        'name': 'first'
    }).reset_index()

    df[':LABEL'] = 'Side Effect'
    df.to_csv('formated_data/meddra.csv', index=False)


def format_mesh(datafile, entity_map={}):
    df = pd.read_csv(datafile, header=None, sep='\t')

    df = df.rename(columns={
        0: 'ID',
        1: 'name'
    })

    df = df.groupby('ID').agg({
        'name': 'first'
    }).reset_index()

    labels = []
    for index, row in df.iterrows():
        labels.append(entity_map.get(row["ID"], "Unknown"))

    df[':LABEL'] = labels
    df = df[df[':LABEL'] != "Unknown"]

    types = [t for t in df[":LABEL"]]
    uniq_types = set(types)
    for t in uniq_types:
        df[df[':LABEL'] == t].to_csv(
            'formated_data/meshmapping_%s.csv' % to_snake_case(t.lower()), index=False)


def format_ndf_rt(datafile):
    df = pd.read_csv(datafile, sep='\t', header=None)

    df = df.rename(columns={
        0: 'ID',
        1: 'name',
        2: 'type'
    })

    df[':LABEL'] = 'Pharmacologic Class'
    df.to_csv('formated_data/ndf_rt.csv', index=False)


def format_hetionet(datafile):
    df = pd.read_csv(datafile, sep='\t')

    df = df.rename(columns={
        'id': 'ID',
        'name': 'name',
        'kind': ':LABEL'
    })

    df["ID"] = df["ID"].str.replace(r".*::", "", regex=True)

    types = [t for t in df[":LABEL"]]
    uniq_types = set(types)
    for t in uniq_types:
        df[df[':LABEL'] == t].to_csv(
            'formated_data/hetionet_%s.csv' % to_snake_case(t.lower()), index=False)


def format_relationships(datafile):
    df = pd.read_csv(datafile, sep="\t", header=None)

    df = df.rename(columns={
        0: 'START_ID',
        2: 'END_ID',
        1: 'TYPE'
    })

    df["START_ID"] = df["START_ID"].str.replace(r".*::", "", regex=True)
    df["END_ID"] = df["END_ID"].str.replace(r".*::", "", regex=True)

    df.to_csv('formated_data/relationships.csv', index=False)


if __name__ == "__main__":
    drugbank = os.path.join(os.getcwd(), "data/drugbank_vocabulary.csv")
    format_drugbank(drugbank)

    doid = os.path.join(os.getcwd(), "data/doidmapping.tsv")
    format_doid(doid)

    gene = os.path.join(os.getcwd(), "data/GeneNumberAnno.csv")
    format_gene(gene)

    meddra = os.path.join(os.getcwd(), "data/meddra.tsv")
    format_meddra(meddra)

    entity_map_file = os.path.realpath(
        os.path.join(os.getcwd(), "data/entities.tsv"))
    entity_map = read_entity_map(entity_map_file)
    mesh = os.path.join(os.getcwd(), "data/meshmapping.tsv")
    format_mesh(mesh, entity_map=entity_map)

    ndf_rt = os.path.join(os.getcwd(), "data/NDF-RT_2018-02-05.txt")
    format_ndf_rt(ndf_rt)

    hetionet = os.path.join(os.getcwd(), "data/hetionet-v1.0-nodes.tsv")
    format_hetionet(hetionet)

    relationships = os.path.join(os.getcwd(), "data/relationships.tsv")
    format_relationships(relationships)
