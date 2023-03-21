import os
import re
import sys
import click
import neo4j
import pandas as pd

cypher_query = """
USING PERIODIC COMMIT 10000
LOAD CSV WITH HEADERS FROM "file:///FILE_PATH" AS line
FIELDTERMINATOR ','
MATCH (p:START_LABEL {id: line.START_ID})
MATCH (mp:END_LABEL {id: line.END_ID})
MERGE (p)-[r:`RELASTIONSHIP`]->(mp)
RETURN COUNT(r) AS c;
"""


def connect_neo4j(db_url="localhost:7687", user="neo4j", password="password"):
    try:
        uri = "bolt://%s" % db_url
        driver = neo4j.GraphDatabase.driver(uri, auth=(user, password),
                                            encrypted=False)
        return driver
    except Exception as err:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        sys_error = "{}, file: {},line: {}".format(
            sys.exc_info(), fname, exc_tb.tb_lineno)
        print("Database is not online")
        raise Exception("Unexpected error:{}.\n{}".format(err, sys_error))


def commit_query(driver, query, parameters={}):
    result = None
    try:
        session = driver.session()
        result = session.run(query, parameters)
        print(result.values())
    except neo4j.exceptions.ClientError as err:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        sys_error = "{}, file: {},line: {}".format(
            sys.exc_info(), fname, exc_tb.tb_lineno)
        print("Connection error:{}.\n{}".format(err, sys_error))
    except Exception as err:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        sys_error = "{}, file: {},line: {}".format(
            sys.exc_info(), fname, exc_tb.tb_lineno)
        raise Exception("Connection error:{}.\n{}".format(err, sys_error))

    return (result, session)


@click.group()
def importer():
    pass


@importer.command(help="Import relationship file into graph database.")
@click.option('--file', '-f', required=True,
              type=click.Path(exists=True, dir_okay=True, file_okay=True),
              help="The data file/directory which saved the relationships, you need to confirm that the remote directory exists the same file/directory.")
@click.option('--db-url', '-D', required=True, help="Neo4j database url. Please contain database name, such as localhost:7687/default.")
@click.option('--db-username', '-U', default="neo4j", help="Neo4j database username.")
@click.option('--db-password', '-P', default="NeO4J", help="Neo4j database password.")
def import_relationships(file, db_url, db_username, db_password):
    driver = connect_neo4j(db_url=db_url,
                           user=db_username,
                           password=db_password)

    def commit(file):
        file = file.replace("./", "")
        df = pd.read_csv(file)
        types = list(set(df["TYPE"]))
        if len(types) > 1:
            raise Exception(
                "Several relationship types exist, please just keep one.")
        else:
            which_relationship = types[0]
            print("Import relationships with `%s` type." % which_relationship)
            start, end = which_relationship.split("::")[2].split(":")
            query = cypher_query.replace("RELASTIONSHIP", which_relationship).replace(
                "START_LABEL", start).replace("END_LABEL", end).replace("FILE_PATH", file)
            print("Your summiting query clause is: %s" % query)
            commit_query(driver, query)

    if os.path.isfile(file):
        commit(file)
    elif os.path.isdir(file):
        files = [f for f in os.listdir(file) if re.match(r".*.csv", f)]
        for i in files:
            commit(os.path.join(file, i))


@importer.command(help="Import entity file into graph database.")
@click.option('--file', '-f', required=True,
              help="The data file/directory which saved the entities.")
@click.option('--db-url', '-D', required=True, help="Neo4j database url. Please contain database name, such as localhost:7687/default.")
@click.option('--db-username', '-U', default="neo4j", help="Neo4j database username.")
@click.option('--db-password', '-P', default="NeO4J", help="Neo4j database password.")
def import_entities(file, db_url, db_username, db_password):
    driver = connect_neo4j(db_url=db_url,
                           user=db_username,
                           password=db_password)

    cypher_query = """
    USING PERIODIC COMMIT 10000
    LOAD CSV WITH HEADERS FROM "file:///<FILEPATH>" AS line
    FIELDTERMINATOR ','
    MERGE (e:`<ENTITY>` {id: line.ID})
    ON CREATE SET <FIELDS>
    RETURN COUNT(e) AS c;
    """

    def commit(file):
        file = file.replace("./", "")
        df = pd.read_csv(file)
        types = list(set(df[":LABEL"]))
        if len(types) > 1:
            raise Exception(
                "Several entitiy types exist, please just keep one.")
        else:
            fields = ",".join(df.head())
            which_entity = types[0]
            all_fields = [field for field in list(map(lambda x: x.strip(), fields.split(",")))
                          if field not in [":LABEL", "ID"]]
            fields_str_lst = []

            for field in all_fields:
                fields_str_lst.append("e.%s=line.%s" % (field, field))

            fields_str = ",".join(fields_str_lst)

            query = cypher_query.replace("<ENTITY>", which_entity).replace(
                "<FIELDS>", fields_str).replace("<FILEPATH>", file)
            print("Your summiting query clause is: %s" % query)
            commit_query(driver, query)

    if os.path.isfile(file):
        commit(file)
    elif os.path.isdir(file):
        files = [f for f in os.listdir(file) if re.match(r".*.csv", f)]
        for i in files:
            commit(os.path.join(file, i))


def to_snake_case(string):
    # Replace non-alphanumeric characters with spaces
    string = re.sub(r'\W+', ' ', string)

    # Convert to lowercase and replace spaces with underscores
    return '_'.join(string.lower().split())


@importer.command(help="Make filtered file from a whole relationship file.")
@click.option('--in-file', '-i', required=True,
              type=click.Path(exists=True, dir_okay=False, file_okay=True),
              help="The data file which saved the relationships.")
@click.option('--out-file', '-o', required=False,
              help="The data file which saved the relationships.")
@click.option('--which-relationship', '-R', required=False, help="Which relationship do you want to import.")
def filter_file(in_file, which_relationship, out_file):
    df = pd.read_csv(in_file)

    def split(df, which_relationship, out_file):
        filtered_df = df[df["TYPE"].str.contains(
            r".*%s.*" % re.escape(which_relationship))]
        if filtered_df.empty:
            print("No any relationships.")
        else:
            print("Okay")
            filtered_df.to_csv(out_file, index=False)

    if which_relationship and out_file:
        split(df, which_relationship, out_file)
    elif which_relationship:
        split(df, which_relationship, "%s.csv" %
              to_snake_case(which_relationship))
    else:
        # types = [t.split("::")[2] for t in df["TYPE"]]
        types = df["TYPE"]
        uniq_types = set(types)
        for t in uniq_types:
            filename = "%s.csv" % to_snake_case(t)
            print("Save to %s: " % filename, end="\t")
            if out_file:
                split(df, t, os.path.join(out_file, filename))
            else:
                split(df, t, filename)


if __name__ == '__main__':
    importer()
