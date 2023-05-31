import json
import os
from flask_cors import CORS
from flask import Flask, request as flask_req, send_from_directory, redirect
from gevent.pywsgi import WSGIServer
from website import websites, blueprints

app = Flask(__name__)
CORS(app, resources={r"*": {"origins": "*"}})

# Route to serve static files


@app.route('/cache/<path:path>')
def serve_static(path):
    print("Serving static file: " + path)
    return send_from_directory('cache', path)


@app.route("/fetch/<website_name>")
def fetch_html(website_name):
    """Fetches a URL and returns the response."""
    args = flask_req.args
    print("Fetching website: %s %s" % (website_name, args))
    if website_name:
        website = websites.get(website_name)
        if website:
            cache_dir = os.path.join(os.path.dirname(__file__), 'cache')
            filepath = website.fetch(args, cache_dir=cache_dir)
            relative_path = os.path.relpath(filepath, cache_dir)
            url = flask_req.url_root + 'cache/' + relative_path
            return redirect(url)
    else:
        return 'Please specify a website name.'

# Register blueprints
for blueprint in blueprints:
    app.register_blueprint(blueprint['blueprint'], url_prefix=blueprint['url_prefix'])

if __name__ == '__main__':
    print("Launching the fetcher server on 0.0.0.0:3000")
    http_server = WSGIServer(('', 3000), app)
    http_server.serve_forever()
