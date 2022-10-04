from rapex_kg.databases.parsers.ctdgene_parser import CTDGeneParser
from rapex_kg.databases.parsers.reactome_parser import ReactomeParser
from rapex_kg.databases.parsers.kegg_pathway_parser import PathwayCommonsParser


parsers = {
    # Base Databases
    "CTDGene": CTDGeneParser,
    "Reactome": ReactomeParser,
    "PathwayCommons": PathwayCommonsParser,
}
