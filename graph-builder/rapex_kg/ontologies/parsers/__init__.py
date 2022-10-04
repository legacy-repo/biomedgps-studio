import obonet


def convert_obo_to_net(ontologyFile):
    """
    Takes an .obo file and returns a NetworkX graph representation of the ontology, that holds multiple \
    edges between two nodes.

    :param str ontologyFile: path to ontology file.
    :return: NetworkX graph.
    """
    graph = obonet.read_obo(ontologyFile)

    return graph
