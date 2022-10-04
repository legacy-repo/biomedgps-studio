import click
from rapex_kg.databases.databases_controller import database
from rapex_kg.ontologies.ontologies_controller import ontology

knowledge_graph = click.CommandCollection(sources=[database, ontology])