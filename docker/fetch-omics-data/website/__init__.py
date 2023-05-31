from website import expression_atlas
from website import gene_cards
from website import sanger_cosmic

websites = {
    'expression_atlas': expression_atlas,
    'gene_cards': gene_cards,
    'sanger_cosmic': sanger_cosmic
}

blueprints = [
    {
        'name': 'gxa',
        'url_prefix': '/gxa',
        'blueprint': expression_atlas.subroute_blueprint
    },
    {
        'name': 'sanger_cosmic',
        'url_prefix': '/sanger_cosmic',
        'blueprint': sanger_cosmic.subroute_blueprint
    },
    {
        'name': 'gene_cards',
        'url_prefix': '/cdn-cgi',
        'blueprint': gene_cards.subroute_blueprint
    }
]
