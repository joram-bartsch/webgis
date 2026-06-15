#!/usr/bin/env python3
"""
Spiekeroog Routing Server
Serves the WebGIS at http://localhost:5000/ and provides a POST /route endpoint.

Original QGIS2Web files are NEVER modified.  The server injects routing.js
and the routingModeActive guard into index.html / qgis2web.js on-the-fly so
future QGIS2Web exports just work without any manual file editing.

On first start: downloads OSM walk network for Spiekeroog via Overpass and
caches it locally so subsequent starts are instant.
"""
import glob
import http.server
import json
import math
import os
import pickle
import re
import sys
import urllib.parse
import urllib.request
from socketserver import ThreadingMixIn

import networkx as nx

# BASE_DIR: where server.py (and routing.js) live — may be a parent directory.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# EXPORT_DIR: the QGIS2Web export to serve.
#   • CLI argument:  python3 server.py ./path/to/qgis2web_.../
#   • Auto-detect:   newest qgis2web_* subfolder of BASE_DIR
#   • Fallback:      BASE_DIR itself (server.py lives inside the export)
def _find_export_dir(base):
    candidates = sorted(
        [d for d in glob.glob(os.path.join(base, 'qgis2web_*')) if os.path.isdir(d)],
        key=os.path.getmtime, reverse=True
    )
    return candidates[0] if candidates else base

if len(sys.argv) > 1:
    EXPORT_DIR = os.path.abspath(sys.argv[1])
else:
    EXPORT_DIR = _find_export_dir(BASE_DIR)

GRAPH_CACHE = os.path.join(BASE_DIR, 'routing_graph.pkl')
OSM_CACHE   = os.path.join(BASE_DIR, 'routing_osm.json')
OVERPASS    = 'https://overpass-api.de/api/interpreter'
BBOX        = '53.74,7.60,53.81,7.83'   # south,west,north,east — Spiekeroog

CVJM_LON  = 7.7224    # fallback coordinates if OSM node is absent
CVJM_LAT  = 53.7710
CVJM_NODE = 2239548814  # fixed OSM start/end node at CVJM
PENALTY   = 1.5         # weight multiplier for already-used edges

G = None   # global routing graph


# ── Landmarken layer variable detector ───────────────────────────────────────

def _find_landmarken_var(export_dir):
    """Return the OL layer variable name for the Landmarken layer (e.g. lyr_Landmarken_7).

    Reads layers/layers.js from the export directory and looks for the variable
    whose declaration contains  popuplayertitle: 'Landmarken'.
    Falls back to any variable whose name contains 'Landmarken'.
    Returns None if the file is missing or no match is found.
    """
    path = os.path.join(export_dir, 'layers', 'layers.js')
    try:
        with open(path, encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        return None

    # Primary: variable whose block contains  popuplayertitle: 'Landmarken'
    m = re.search(
        r'var\s+(lyr_\w+)\s*=\s*new\s+ol\.layer\.Vector\b'
        r'[\s\S]{0,800}?popuplayertitle:\s*[\'"]Landmarken[\'"]',
        content
    )
    if m:
        return m.group(1)

    # Fallback: variable name contains 'Landmarken' (case-insensitive)
    m = re.search(r'var\s+(lyr_[A-Za-z0-9]*[Ll]andmarken[A-Za-z0-9_]*)', content)
    return m.group(1) if m else None


# ── URL-decode helper (used as callable replacement in PATCHES) ───────────────

def _fix_encoded_urls(m):
    """Decode %XX sequences inside a url: '...' or url: "..." value."""
    quote   = m.group(1)
    decoded = urllib.parse.unquote(m.group(2))
    return 'url: ' + quote + decoded + quote


# ── On-the-fly patches ────────────────────────────────────────────────────────
#
# Maps relative file path → list of (regex_pattern, replacement) tuples.
# re.sub(pattern, replacement, content, count=1) is used, so each patch fires
# at most once.  Patterns are written against stable code structure, not
# against fragile whitespace, so they survive new QGIS2Web exports unchanged.

PATCHES = {
    # 1) Inject routing.js before </body> — matches regardless of indentation
    #    or what other script tags surround it.
    'index.html': [
        (
            r'(?i)</body>',
            '        <script src="./routing.js"></script>\n    </body>'
        ),
    ],

    # 2) Suppress map click → popup while routing mode is active.
    #    Patterns capture the function signature + line ending + indentation so
    #    the replacement keeps the original formatting intact.
    'resources/qgis2web.js': [
        (
            r'(function onSingleClickFeatures\(evt\) \{)\r?\n(\s+)if \(doHover \|\| sketch\)',
            r'\1\n\2if (window.routingModeActive || doHover || sketch)'
        ),
        (
            r'(function onSingleClickWMS\(evt\) \{)\r?\n(\s+)if \(doHover \|\| sketch\)',
            r'\1\n\2if (window.routingModeActive || doHover || sketch)'
        ),
    ],

    # 3) Fix URL-encoded characters inside  url: '...'  or  url: "..."  values.
    #    QGIS2Web sometimes percent-encodes tile/WMS URLs, e.g.
    #      url: 'https%3A%2F%2Ftile.openstreetmap.org%2F%7Bz%7D%2F%7Bx%7D%2F%7By%7D.png'
    #    A callable replacement is used so urllib.parse.unquote can decode each
    #    match individually.  If no encoded URLs are found this is a silent no-op.
    'layers/layers.js': [
        (r"url:\s*(['\"])([^'\"]+)\1", _fix_encoded_urls),
    ],
}


# ── Geometry ──────────────────────────────────────────────────────────────────

def haversine(lon1, lat1, lon2, lat2):
    R = 6_371_000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def nearest_node(g, lon, lat):
    best, bd = None, float('inf')
    for nid, d in g.nodes(data=True):
        dist = haversine(lon, lat, d['lon'], d['lat'])
        if dist < bd:
            bd, best = dist, nid
    return best


# ── OSM download & graph build ────────────────────────────────────────────────

def fetch_osm():
    query = (
        '[out:json][timeout:90][bbox:' + BBOX + '];'
        'way["highway"]->.w;'
        'node(w.w)->.n;'
        '(.w;.n;);'
        'out;'
    )
    # GET with ?data= is more broadly accepted than POST across Overpass instances.
    # A User-Agent is required by most instances (missing UA → 406 on Python 3.14+).
    url = OVERPASS + '?data=' + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={
        'User-Agent': 'SpiekeroogWebGIS/1.0',
        'Accept':     'application/json, */*',
    })
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode())


def build_graph(osm):
    g = nx.Graph()
    coords = {}
    for el in osm.get('elements', []):
        if el['type'] == 'node':
            coords[el['id']] = (el['lat'], el['lon'])
    for el in osm.get('elements', []):
        if el['type'] != 'way':
            continue
        nids = el.get('nodes', [])
        for i in range(len(nids) - 1):
            a, b = nids[i], nids[i + 1]
            if a not in coords or b not in coords:
                continue
            alat, alon = coords[a]
            blat, blon = coords[b]
            for nid, lat, lon in [(a, alat, alon), (b, blat, blon)]:
                if not g.has_node(nid):
                    g.add_node(nid, lat=lat, lon=lon)
            d = haversine(alon, alat, blon, blat)
            if not g.has_edge(a, b):
                g.add_edge(a, b, weight=d)
    if not nx.is_connected(g):
        cc = max(nx.connected_components(g), key=len)
        g = g.subgraph(cc).copy()
        print(f'  Largest connected component: {g.number_of_nodes()} nodes')
    return g


def load_or_build():
    global G
    if os.path.exists(GRAPH_CACHE):
        print('Loading cached routing graph…')
        with open(GRAPH_CACHE, 'rb') as f:
            G = pickle.load(f)
        print(f'  {G.number_of_nodes()} nodes, {G.number_of_edges()} edges')
        return
    if os.path.exists(OSM_CACHE):
        print('Using cached OSM data…')
        with open(OSM_CACHE) as f:
            osm = json.load(f)
    else:
        print('Downloading OSM data for Spiekeroog (may take ~30 s)…')
        osm = fetch_osm()
        with open(OSM_CACHE, 'w') as f:
            json.dump(osm, f)
        print(f'  Downloaded {len(osm.get("elements", []))} elements')
    print('Building routing graph…')
    G = build_graph(osm)
    with open(GRAPH_CACHE, 'wb') as f:
        pickle.dump(G, f)
    print(f'  Cached: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges')


# ── Routing ───────────────────────────────────────────────────────────────────

def nn_tsp(dists, n):
    unvisited = list(range(1, n))
    tour = [0]
    while unvisited:
        cur = tour[-1]
        nxt = min(unvisited, key=lambda x: dists.get((cur, x), 1e18))
        tour.append(nxt)
        unvisited.remove(nxt)
    tour.append(0)
    return tour


def compute_route(waypoints):
    if G is None:
        raise RuntimeError('Graph not loaded')

    n = 1 + len(waypoints)

    # Index 0: CVJM — prefer the fixed OSM node, fall back to nearest
    if G.has_node(CVJM_NODE):
        start = CVJM_NODE
    else:
        print(f'WARN: OSM node {CVJM_NODE} not in graph, falling back to nearest node')
        start = nearest_node(G, CVJM_LON, CVJM_LAT)

    snap = [start] + [nearest_node(G, w[0], w[1]) for w in waypoints]

    # ── Step 1: TSP order with original weights ──────────────────────────────
    dists = {}
    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            try:
                dists[(i, j)] = nx.shortest_path_length(
                    G, snap[i], snap[j], weight='weight')
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                dists[(i, j)] = 1e18

    tour = nn_tsp(dists, n)

    # ── Step 2: Build path segments with edge-reuse penalty ──────────────────
    # penalties dict maps (min_id, max_id) → cumulative multiplier.
    # pw() is a closure: each segment sees penalties from all previous segments.
    penalties = {}

    def pw(u, v, d):
        return d['weight'] * penalties.get((min(u, v), max(u, v)), 1.0)

    coords, total = [], 0
    for step in range(len(tour) - 1):
        src, dst = snap[tour[step]], snap[tour[step + 1]]
        try:
            seg = nx.shortest_path(G, src, dst, weight=pw)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            seg = []

        for k in range(len(seg) - 1):
            a, b = seg[k], seg[k + 1]
            total += G[a][b]['weight']                         # real distance
            key = (min(a, b), max(a, b))
            penalties[key] = penalties.get(key, 1.0) * PENALTY  # raise cost

        for k, nid in enumerate(seg):
            if k == 0 and coords:
                continue
            nd = G.nodes[nid]
            coords.append([nd['lon'], nd['lat']])

    start_nd = G.nodes[start]
    return {
        'coordinates':  coords,
        'distance_m':   round(total),
        'visit_order':  [t - 1 for t in tour[1:-1]],
        'cvjm_coords':  [start_nd['lon'], start_nd['lat']],  # exact OSM node position
    }


# ── HTTP handler ──────────────────────────────────────────────────────────────

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Static files are served from the QGIS2Web export directory.
        super().__init__(*args, directory=EXPORT_DIR, **kwargs)

    def log_message(self, *_):
        pass

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _no_cache(self):
        """Headers that prevent any browser/proxy caching."""
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma',        'no-cache')
        self.send_header('Expires',       '0')

    def _serve_patched(self, rel_path):
        """Read a file from the export directory, patch it, and send it."""
        full = os.path.join(EXPORT_DIR, rel_path)
        try:
            with open(full, 'r', encoding='utf-8') as f:
                content = f.read()
        except FileNotFoundError:
            self.send_response(404)
            self.end_headers()
            return

        for pattern, replacement in PATCHES[rel_path]:
            if callable(replacement):
                # Replace ALL occurrences (e.g. URL-decode); silent no-op if none found
                content, n = re.subn(pattern, replacement, content)
                if n:
                    print(f'  Fixed {n} URL-encoded value(s) in {rel_path}')
            else:
                # Structural patch — expected exactly once; warn if missing
                patched, n = re.subn(pattern, replacement, content, count=1)
                if n == 0:
                    print(f'  WARN: patch pattern not matched in {rel_path} — '
                          f'check PATCHES if a new QGIS2Web export changed the structure')
                else:
                    content = patched

        body = content.encode('utf-8')
        mime = 'text/html' if rel_path.endswith('.html') else 'application/javascript'
        self.send_response(200)
        self.send_header('Content-Type', f'{mime}; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self._no_cache()
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _serve_js(self, rel_path):
        """Serve routing.js from BASE_DIR, prepend the detected Landmarken variable name."""
        full = os.path.join(BASE_DIR, rel_path)
        try:
            with open(full, 'rb') as f:
                body = f.read()
        except FileNotFoundError:
            self.send_response(404)
            self.end_headers()
            return
        # Inject the exact Landmarken layer variable name found in the export's
        # layers/layers.js so routing.js never depends on a hardcoded suffix number.
        var_name = _find_landmarken_var(EXPORT_DIR)
        if var_name:
            prefix = (
                '/* auto-injected by server.py */\n'
                f'var _spkLandmarkenVar = {json.dumps(var_name)};\n'
            ).encode()
            body = prefix + body
        self.send_response(200)
        self.send_header('Content-Type',   'application/javascript; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self._no_cache()
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == '/health':
            self._json(200, {'ok': True, 'nodes': G.number_of_nodes() if G else 0})
            return

        # Normalise path: '/' → 'index.html', strip query string
        rel = self.path.lstrip('/').split('?')[0]
        patch_key = rel if rel else 'index.html'

        if patch_key in PATCHES:
            self._serve_patched(patch_key)
            return

        # routing.js changes frequently — never let the browser cache it
        if rel == 'routing.js':
            self._serve_js(rel)
            return

        super().do_GET()

    def do_POST(self):
        if self.path != '/route':
            self.send_response(404)
            self.end_headers()
            return
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)
        try:
            data   = json.loads(body.decode())
            result = compute_route(data.get('waypoints', []))
            self._json(200, result)
        except Exception as exc:
            self._json(500, {'error': str(exc)})


class ThreadedServer(ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True


if __name__ == '__main__':
    load_or_build()
    port = 5000
    srv  = ThreadedServer(('0.0.0.0', port), Handler)
    print(f'\nSpiekeroog WebGIS + Routing  —  original files untouched')
    print(f'  Export:  {EXPORT_DIR}')
    print(f'  Karte:   http://0.0.0.0:{port}/')
    print(f'  API:     POST http://0.0.0.0:{port}/route')
    print('  Ctrl+C zum Beenden\n')
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print('\nServer gestoppt.')
