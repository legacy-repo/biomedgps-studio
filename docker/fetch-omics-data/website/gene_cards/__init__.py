import os
import time
import requests
from bs4 import BeautifulSoup
from flask import Blueprint, request, Response
from urllib.parse import urljoin

website_name = "gene_cards"
website_baseurl = "https://www.genecards.org"

def get_website_url(gene):
    return f'https://www.genecards.org/cgi-bin/carddisp.pl?gene={gene}'


# Define a blueprint for the subroutes
subroute_blueprint = Blueprint('cdn-cgi', __name__)

# Route to transfer requests to another server

@subroute_blueprint.route('/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE'])
@subroute_blueprint.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def transfer_request(path):
    # Make a request to the other server
    response = requests.request(
        method=request.method,
        url=f"{website_baseurl}/cdn-cgi/{path}?{request.query_string.decode('utf-8')}",
        headers={key: value for (key, value)
                 in request.headers if key != 'Host'},
        data=request.get_data(),
        cookies=request.cookies,
        allow_redirects=False
    )

    # Create a Flask response object with the response from the other server
    headers = [(key, value) for (key, value)
               in response.headers.items() if key != 'Transfer-Encoding']
    return Response(response.content, response.status_code, headers)


def read_css_file():
    """Read the CSS contents from a file."""
    css_path = os.path.join(os.path.dirname(__file__), 'style.css')
    with open(css_path, 'r') as css_file:
        return css_file.read()
    
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36'
}

# geneSymbol: must be a valid gene symbol
def fetch(req_args={}, cache_dir="cache"):
    """Fetch and convert html page."""
    response = requests.get(
        get_website_url(req_args.get("geneSymbol")),
        headers=headers
    )
    text = response.text

    soup = BeautifulSoup(text, 'html.parser')

    css_contents = read_css_file()
    # Create a new `style` element and insert the CSS contents
    style_tag = soup.new_tag('style')
    style_tag.string = css_contents
    soup.head.append(style_tag)

    # Find all <a> tags and add the `target` attribute
    for a in soup.find_all('a'):
        a.attrs['target'] = '_blank'
        if 'href' in a.attrs:
            # Resolve relative links
            a.attrs['href'] = urljoin(website_baseurl, a['href'])

    for link in soup.find_all('link'):
        if 'href' in link.attrs:
            # Resolve relative links
            link.attrs['href'] = urljoin(website_baseurl, link['href'])

    for script in soup.find_all('script'):
        if 'src' in script.attrs:
            # Resolve relative links
            script.attrs['src'] = urljoin(website_baseurl, script['src'])

    for img in soup.find_all('img'):
        if 'src' in img.attrs:
            # Resolve relative links
            img.attrs['src'] = urljoin(website_baseurl, img['src'])

    # Write the modified HTML back to a file
    output_dir = os.path.join(cache_dir, website_name)
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(
        output_dir, time.strftime("%Y%m%d-%H%M%S") + '.html')
    with open(output_file, 'w') as f:
        f.write(str(soup))

    return output_file
