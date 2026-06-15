// routing.js — Spiekeroog Route Planner
// Requires: map, lyr_Landmarken_6 (from layers.js / qgis2web.js)

(function () {
    'use strict';

    // When served via python server: relative URLs work.
    // When opened as file://:  fall back to localhost:5000.
    var API = location.protocol === 'file:' ? 'http://localhost:5000' : '';

    window.routingModeActive = false;

    // Resolve the Landmarken OL layer.
    // Strategy 1 (preferred): server.py injects  _spkLandmarkenVar = "lyr_Landmarken_7"
    //   into this file at serve-time by reading the export's layers/layers.js.
    // Strategy 2 (fallback): search window.layersList by popuplayertitle.
    //   Uses window.* so a missing global causes no ReferenceError.
    var lyrLandmarken = (function () {
        // Strategy 1
        if (typeof _spkLandmarkenVar !== 'undefined' && window[_spkLandmarkenVar]) {
            return window[_spkLandmarkenVar];
        }
        // Strategy 2
        var list = window.layersList || [];
        function search(layers) {
            for (var i = 0; i < layers.length; i++) {
                var l = layers[i];
                try {
                    if (typeof l.getLayers === 'function') {
                        var hit = search(l.getLayers().getArray());
                        if (hit) return hit;
                    } else if (l.get) {
                        var t = (l.get('popuplayertitle') || '').toLowerCase();
                        if (t.indexOf('landmarken') !== -1) return l;
                    }
                } catch (e) { /* skip broken layer */ }
            }
            return null;
        }
        return search(list);
    }());

    if (!lyrLandmarken) {
        console.warn('routing.js: Layer "Landmarken" nicht gefunden — Klick-Routing deaktiviert.');
    }

    var _state     = 'idle'; // idle | selecting | calculating | result | error
    var _wps       = [];     // [{fid, name, lon, lat}]
    var _lastRoute = null;   // last server response, kept for GPX export
    var _routeSrc, _wpSrc;

    // ── Layers ────────────────────────────────────────────────────────────────

    function initLayers() {
        _routeSrc = new ol.source.Vector();
        map.addLayer(new ol.layer.Vector({
            source: _routeSrc,
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#e74c3c', width: 5,
                    lineCap: 'round', lineJoin: 'round'
                })
            }),
            displayInLayerSwitcher: false,
            zIndex: 100
        }));

        _wpSrc = new ol.source.Vector();
        map.addLayer(new ol.layer.Vector({
            source: _wpSrc,
            style: function (feat) {
                var isHome   = feat.get('isHome');
                var isSelect = feat.get('isSelect'); // true while user is choosing
                var label    = feat.get('label');

                var radius = isSelect ? 10 : 12;
                var fill   = isHome ? '#2980b9' : '#e07070';

                return new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: radius,
                        fill:   new ol.style.Fill({ color: fill }),
                        stroke: new ol.style.Stroke({
                            color: 'rgba(255,255,255,0.85)', width: 1.5
                        })
                    }),
                    text: new ol.style.Text({
                        text:  label,
                        fill:  new ol.style.Fill({ color: 'rgba(255,255,255,0.92)' }),
                        font:  'bold 9px sans-serif',
                        offsetY: 0.5
                    })
                });
            },
            displayInLayerSwitcher: false,
            zIndex: 101
        }));
    }

    // ── CSS ───────────────────────────────────────────────────────────────────

    function injectCSS() {
        var s = document.createElement('style');
        s.textContent = [
            /* ── Panel shell ── */
            '#routing-panel{',
            '  position:relative;float:right;clear:right;',
            '  margin:8px 8px 0 0;width:224px;',
            '  background:#fff!important;',
            '  padding:0!important;',
            '  border-radius:8px!important;',
            '  box-shadow:0 2px 8px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.07);',
            '  font-size:12px;color:#2c3e50;',
            '  box-sizing:border-box;',
            '  max-height:calc(100vh - 80px);',
            '  overflow-x:hidden;overflow-y:auto;',
            '}',
            /* ── Header ── */
            '#routing-panel .rp-hd{',
            '  display:flex;align-items:center;gap:7px;',
            '  padding:9px 12px 8px;',
            '  background:#f0f4f8!important;',
            '  border-bottom:1px solid #dde3ea;',
            '  border-radius:8px 8px 0 0!important;',
            '  font-weight:700;font-size:12px;color:#1a2b3c;',
            '}',
            '#routing-panel .rp-hd-icon{',
            '  width:22px;height:22px;border-radius:50%!important;',
            '  background:#2980b9!important;color:#fff!important;',
            '  display:flex;align-items:center;justify-content:center;',
            '  font-size:11px;flex-shrink:0;',
            '}',
            /* ── Body / actions ── */
            '#routing-panel .rp-body{padding:10px 12px!important;background:#fff!important;}',
            '#routing-panel .rp-actions{',
            '  position:sticky;bottom:0;',
            '  padding:8px 12px 10px!important;',
            '  background:#fff!important;',
            '  border-top:1px solid #edf0f3;',
            '  border-radius:0 0 8px 8px!important;',
            '}',
            /* ── Hint ── */
            '#routing-panel .rp-hint{',
            '  color:#6c7a89;font-size:11px;line-height:1.5;margin:0 0 9px;',
            '}',
            /* ── Waypoint list ── */
            '#routing-panel ul.rp-list{list-style:none;padding:0;margin:0 0 8px;}',
            '#routing-panel .rp-item{',
            '  display:flex;align-items:center;gap:7px;',
            '  padding:5px 0;border-bottom:1px solid #f2f4f7;',
            '}',
            '#routing-panel .rp-item:last-child{border-bottom:none;}',
            /* number badge — mirrors map markers */
            '#routing-panel .rp-badge{',
            '  flex-shrink:0;width:20px;height:20px;',
            '  border-radius:50%!important;',
            '  background:#e74c3c!important;color:#fff!important;',
            '  font-size:10px;font-weight:700;',
            '  display:flex;align-items:center;justify-content:center;',
            '}',
            '#routing-panel .rp-badge-h{background:#2980b9!important;}',
            '#routing-panel .rp-name{',
            '  flex:1;font-size:11px;',
            '  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
            '}',
            '#routing-panel .rp-tag{font-size:10px;color:#aab4be;white-space:nowrap;}',
            '#routing-panel .rp-remove{',
            '  flex-shrink:0;cursor:pointer;color:#c8d0d9;',
            '  border:none;background:none!important;',
            '  padding:0;font-size:17px;line-height:1;transition:color .15s;',
            '}',
            '#routing-panel .rp-remove:hover{color:#e74c3c!important;}',
            /* ── Buttons ── */
            '#routing-panel .rp-btn{',
            '  display:block;width:100%;margin-top:5px;',
            '  padding:6px 8px;cursor:pointer;',
            '  border-radius:5px!important;border:1px solid transparent;',
            '  font-size:12px;font-weight:500;text-align:center;',
            '  box-sizing:border-box;transition:filter .15s;',
            '}',
            '#routing-panel .rp-btn:first-child{margin-top:0;}',
            '#routing-panel .rp-btn:hover:not([disabled]){filter:brightness(1.07);}',
            '#routing-panel .rp-btn[disabled]{opacity:.4;cursor:default;}',
            '#routing-panel .rp-primary{',
            '  background:#2980b9!important;color:#fff!important;border-color:#236fa3;',
            '}',
            '#routing-panel .rp-secondary{',
            '  background:#fff!important;color:#4a5568!important;border-color:#d0d7de;',
            '}',
            '#routing-panel .rp-secondary:hover:not([disabled]){background:#f5f7f9!important;}',
            '#routing-panel .rp-gpx{',
            '  background:#27ae60!important;color:#fff!important;border-color:#229954;',
            '}',
            /* ── Result: distance chip + steps ── */
            '#routing-panel .rp-chip{',
            '  display:inline-flex;align-items:center;gap:4px;',
            '  background:#eaf4fb!important;color:#2471a3;',
            '  border:1px solid #aed6f1;border-radius:12px!important;',
            '  padding:3px 10px;font-weight:700;font-size:13px;',
            '  margin-bottom:9px;',
            '}',
            '#routing-panel .rp-steps{margin-bottom:2px;}',
            '#routing-panel .rp-step{',
            '  font-size:11px;padding:3px 0;',
            '  border-bottom:1px solid #f2f4f7;',
            '  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
            '}',
            '#routing-panel .rp-step:last-child{border-bottom:none;}',
            '#routing-panel .rp-step-h{color:#2980b9;font-weight:600;}',
            /* ── Spinner ── */
            '@keyframes rp-spin{to{transform:rotate(360deg)}}',
            '#routing-panel .rp-spinner{',
            '  width:26px;height:26px;margin:14px auto;',
            '  border:3px solid #dde3ea;border-top-color:#2980b9;',
            '  border-radius:50%!important;animation:rp-spin .75s linear infinite;',
            '}',
            '#routing-panel .rp-spin-lbl{text-align:center;color:#8899a6;font-size:11px;margin-bottom:10px;}',
            /* ── Error ── */
            '#routing-panel .rp-err{',
            '  background:#fdf3f3!important;border:1px solid #f5c6c6;',
            '  border-radius:5px!important;color:#a93226;',
            '  font-size:11px;padding:8px 10px;margin-bottom:6px;line-height:1.6;',
            '}',
            '#routing-panel .rp-err code{',
            '  background:rgba(0,0,0,.07)!important;',
            '  padding:1px 4px;border-radius:3px!important;font-size:10px;',
            '}',
        ].join('');
        document.head.appendChild(s);
    }

    // ── Panel ──────────────────────────────────────────────────────────────────

    var _panel;

    function buildPanel() {
        _panel = document.createElement('div');
        _panel.id = 'routing-panel';
        _panel.className = 'ol-unselectable ol-control';
        _panel.addEventListener('click', onPanelClick);
        document.getElementById('top-right-container').appendChild(_panel);
        render();
    }

    function onPanelClick(e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var a = btn.dataset.action;
        if      (a === 'start')     startRouting();
        else if (a === 'cancel')    cancelRouting();
        else if (a === 'calculate') doCalcRoute();
        else if (a === 'close')     closeRoute();
        else if (a === 'gpx')       exportGPX();
        else if (a === 'remove')    removeWp(parseInt(btn.dataset.i, 10));
    }

    function esc(s) {
        return String(s)
            .replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;');
    }

    function render() {
        if (!_panel) return;
        _panel.innerHTML = tpl();
    }

    function hd(icon, title) {
        return '<div class="rp-hd">' +
               '<div class="rp-hd-icon">' + icon + '</div>' +
               '<span>' + title + '</span>' +
               '</div>';
    }

    function tpl() {
        if (_state === 'idle') {
            return hd('&#9776;', 'Route planen') +
                   '<div class="rp-body">' +
                   '<p class="rp-hint">Erstelle deine eigene Tour &uuml;ber Spiekeroog &mdash; ' +
                   'w&auml;hle Stationen und erhalte die k&uuml;rzeste Rundroute ab&nbsp;CVJM.</p>' +
                   '<button class="rp-btn rp-primary" data-action="start">Routing starten</button>' +
                   '</div>';
        }

        if (_state === 'selecting') {
            var cvjm = '<li class="rp-item">' +
                       '<span class="rp-badge rp-badge-h">H</span>' +
                       '<span class="rp-name"><b>CVJM</b></span>' +
                       '<span class="rp-tag">Start &amp; Ziel</span>' +
                       '</li>';
            var items = _wps.map(function (wp, i) {
                return '<li class="rp-item">' +
                       '<span class="rp-badge">' + (i + 1) + '</span>' +
                       '<span class="rp-name">' + esc(wp.name) + '</span>' +
                       '<button class="rp-remove" data-action="remove" data-i="' + i +
                       '" title="Entfernen">&times;</button>' +
                       '</li>';
            }).join('');
            var hint = _wps.length === 0
                ? 'Klicke auf eine Landmarke auf der Karte.'
                : _wps.length + '&nbsp;Station' + (_wps.length !== 1 ? 'en' : '') + ' ausgew&auml;hlt';
            return hd('&#128205;', 'Stationen w&auml;hlen') +
                   '<div class="rp-body">' +
                   '<ul class="rp-list">' + cvjm + items + '</ul>' +
                   '<p class="rp-hint">' + hint + '</p>' +
                   '</div>' +
                   '<div class="rp-actions">' +
                   '<button class="rp-btn rp-primary" data-action="calculate"' +
                   (_wps.length === 0 ? ' disabled' : '') + '>Route berechnen</button>' +
                   '<button class="rp-btn rp-secondary" data-action="cancel">Abbrechen</button>' +
                   '</div>';
        }

        if (_state === 'calculating') {
            return hd('&#9776;', 'Route planen') +
                   '<div class="rp-body">' +
                   '<div class="rp-spinner"></div>' +
                   '<p class="rp-spin-lbl">Berechne Route&hellip;</p>' +
                   '</div>';
        }

        if (_state === 'result') {
            // .rp-body is filled after render() by showRoute()
            return hd('&#10003;', 'Deine Route') +
                   '<div class="rp-body" id="rp-result-body"></div>' +
                   '<div class="rp-actions">' +
                   '<button class="rp-btn rp-primary" data-action="start">Neue Route</button>' +
                   '<button class="rp-btn rp-gpx" data-action="gpx">&#8681;&nbsp;GPX exportieren</button>' +
                   '<button class="rp-btn rp-secondary" data-action="close">Schlie&szlig;en</button>' +
                   '</div>';
        }

        if (_state === 'error') {
            return hd('&#9888;', 'Route planen') +
                   '<div class="rp-body">' +
                   '<div class="rp-err">Server nicht erreichbar.<br>' +
                   'Bitte starten mit:<br><code>python3 server.py</code></div>' +
                   '</div>' +
                   '<div class="rp-actions">' +
                   '<button class="rp-btn rp-primary" data-action="start">Neu versuchen</button>' +
                   '<button class="rp-btn rp-secondary" data-action="cancel">Abbrechen</button>' +
                   '</div>';
        }

        return '';
    }

    // ── State transitions ─────────────────────────────────────────────────────

    function startRouting() {
        _state = 'selecting';
        _wps   = [];
        window.routingModeActive = true;
        clearLayers();
        render();
    }

    function cancelRouting() {
        _state = 'idle';
        _wps   = [];
        window.routingModeActive = false;
        clearLayers();
        render();
    }

    function removeWp(i) {
        _wps.splice(i, 1);
        refreshSelectionMarkers();
        render();
    }

    function closeRoute() {
        _state = 'idle';
        window.routingModeActive = false;
        clearLayers();
        render();
    }

    function doCalcRoute() {
        if (_wps.length === 0) return;
        _state = 'calculating';
        render();

        fetch(API + '/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ waypoints: _wps.map(function (w) { return [w.lon, w.lat]; }) })
        })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (data.error) throw new Error(data.error);
            _lastRoute = data;
            showRoute(data);
        })
        .catch(function () {
            _state = 'error';
            window.routingModeActive = false;
            render();
        });
    }

    // ── Route display ─────────────────────────────────────────────────────────

    function proj(lonlat) {
        return ol.proj.transform(lonlat, 'EPSG:4326', 'EPSG:3857');
    }

    function addMarker(coord3857, label, isHome, isSelect) {
        var f = new ol.Feature({ geometry: new ol.geom.Point(coord3857) });
        f.set('label',    label);
        f.set('isHome',   !!isHome);
        f.set('isSelect', !!isSelect);
        _wpSrc.addFeature(f);
    }

    function showRoute(data) {
        _state = 'result';
        window.routingModeActive = false;
        clearLayers();

        // Draw route line
        if (data.coordinates && data.coordinates.length > 1) {
            var line = new ol.geom.LineString(data.coordinates.map(proj));
            _routeSrc.addFeature(new ol.Feature({ geometry: line }));
            map.getView().fit(line.getExtent(), { duration: 800, padding: [60, 60, 60, 60] });
        }

        // CVJM home marker — exact OSM node coordinates from server
        var cvjmCoords = data.cvjm_coords || [7.7224, 53.7710];
        addMarker(proj(cvjmCoords), 'H', true, false);

        // Ordered waypoint markers
        var order = data.visit_order || _wps.map(function (_, i) { return i; });
        order.forEach(function (wpIdx, visitNum) {
            var wp = _wps[wpIdx];
            if (wp) addMarker(proj([wp.lon, wp.lat]), String(visitNum + 1), false, false);
        });

        render();

        // Fill result body
        var container = document.getElementById('rp-result-body');
        if (!container) return;
        var orderedWps = (data.visit_order || _wps.map(function (_, i) { return i; }))
            .map(function (i) { return _wps[i]; })
            .filter(Boolean);
        var distKm = (data.distance_m / 1000).toFixed(1);
        var steps  = orderedWps.map(function (wp, i) {
            return '<div class="rp-step">' +
                   '<span style="display:inline-flex;align-items:center;justify-content:center;' +
                   'width:15px;height:15px;border-radius:50%;background:#e74c3c;color:#fff;' +
                   'font-size:9px;font-weight:700;margin-right:5px;flex-shrink:0;">' +
                   (i + 1) + '</span>' + esc(wp.name) + '</div>';
        }).join('');
        container.innerHTML =
            '<div class="rp-chip">&#128344;&nbsp;' + distKm + '&nbsp;km</div>' +
            '<div class="rp-steps">' +
            '<div class="rp-step rp-step-h">&#9679; CVJM &mdash; Start</div>' +
            steps +
            '<div class="rp-step rp-step-h">&#9679; CVJM &mdash; Ziel</div>' +
            '</div>';
    }

    function refreshSelectionMarkers() {
        _wpSrc.clear();
        _wps.forEach(function (wp, i) {
            addMarker(proj([wp.lon, wp.lat]), String(i + 1), false, true);
        });
    }

    function clearLayers() {
        _routeSrc.clear();
        _wpSrc.clear();
    }

    // ── GPX export ────────────────────────────────────────────────────────────

    function exportGPX() {
        if (!_lastRoute || !_lastRoute.coordinates) return;

        var now   = new Date().toISOString();
        var order = _lastRoute.visit_order || _wps.map(function (_, i) { return i; });

        // Build <wpt> elements: CVJM + waypoints in visit order
        var wpts = '<wpt lat="53.7710" lon="7.7224">\n' +
                   '  <name>CVJM (Start &amp; Ziel)</name>\n</wpt>\n';
        order.forEach(function (wpIdx, visitNum) {
            var wp = _wps[wpIdx];
            if (!wp) return;
            wpts += '<wpt lat="' + wp.lat.toFixed(7) + '" lon="' + wp.lon.toFixed(7) + '">\n' +
                    '  <name>' + (visitNum + 1) + '. ' + escXml(wp.name) + '</name>\n' +
                    '</wpt>\n';
        });

        // Build <trkseg> from route coordinates
        var trkpts = _lastRoute.coordinates.map(function (c) {
            return '  <trkpt lat="' + c[1].toFixed(7) + '" lon="' + c[0].toFixed(7) + '"></trkpt>';
        }).join('\n');

        var distKm = (_lastRoute.distance_m / 1000).toFixed(1);
        var gpx =
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<gpx version="1.1" creator="Spiekeroog WebGIS"\n' +
            '  xmlns="http://www.topografix.com/GPX/1/1"\n' +
            '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
            '  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
            'http://www.topografix.com/GPX/1/1/gpx.xsd">\n' +
            '<metadata>\n' +
            '  <name>Spiekeroog Route</name>\n' +
            '  <desc>Rundroute ab dem CVJM, ' + distKm + ' km</desc>\n' +
            '  <time>' + now + '</time>\n' +
            '</metadata>\n' +
            wpts +
            '<trk>\n' +
            '  <name>Spiekeroog Route</name>\n' +
            '  <trkseg>\n' +
            trkpts + '\n' +
            '  </trkseg>\n' +
            '</trk>\n' +
            '</gpx>';

        var blob = new Blob([gpx], { type: 'application/gpx+xml' });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href     = url;
        a.download = 'spiekeroog_route.gpx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function escXml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── Map click handler ─────────────────────────────────────────────────────

    map.on('singleclick', function (evt) {
        if (!window.routingModeActive || _state !== 'selecting') return;

        var pixel = map.getEventPixel(evt.originalEvent);
        var handled = false;

        map.forEachFeatureAtPixel(pixel, function (feat, layer) {
            if (handled || !lyrLandmarken || layer !== lyrLandmarken) return;

            var cluster  = feat.get('features');
            var features = cluster || [feat];

            if (features.length > 1) {
                // Zoom into cluster so user can pick individual landmarks
                var ext = ol.extent.createEmpty();
                features.forEach(function (f) {
                    ol.extent.extend(ext, f.getGeometry().getExtent());
                });
                map.getView().fit(
                    ol.extent.buffer(ext, 200),
                    { duration: 400, maxZoom: 17 }
                );
                handled = true;
                return;
            }

            var f      = features[0];
            var fid    = f.get('fid');
            var name   = (f.get('Bezeichnung') || 'Unbekannt').trim();
            var coord  = f.getGeometry().getCoordinates(); // EPSG:3857
            var lonlat = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');

            var idx = _wps.findIndex(function (w) { return w.fid === fid; });
            if (idx >= 0) {
                _wps.splice(idx, 1);   // deselect on second click
            } else {
                _wps.push({ fid: fid, name: name, lon: lonlat[0], lat: lonlat[1] });
            }

            refreshSelectionMarkers();
            render();
            handled = true;
        });
    });

    // ── Width sync with layer switcher ────────────────────────────────────────
    // Waits for the user to expand the OL layer switcher once, then reads its
    // rendered offsetWidth and applies it to the routing panel permanently.

    function syncWidthToLayerSwitcher() {
        var ls    = document.querySelector('.layer-switcher');
        var panel = document.getElementById('routing-panel');
        if (!ls || !panel) return;

        var apply = function () {
            var w = ls.offsetWidth;
            if (w > 60) { panel.style.width = w + 'px'; }   // 60 px = collapsed button only
        };

        // If the switcher is already open on load, apply immediately
        if (ls.classList.contains('shown')) { apply(); return; }

        // Otherwise watch for the 'shown' class to appear
        var obs = new MutationObserver(function () {
            if (ls.classList.contains('shown')) {
                apply();
                obs.disconnect();
            }
        });
        obs.observe(ls, { attributes: true, attributeFilter: ['class'] });
    }

    // ── Boot ──────────────────────────────────────────────────────────────────
    // Each step is isolated so a failure in one cannot prevent the panel
    // from appearing (e.g. map / layersList missing in a new export variant).

    injectCSS();
    try { initLayers(); }
    catch (e) { console.warn('routing.js initLayers:', e); }
    try { buildPanel(); }
    catch (e) { console.warn('routing.js buildPanel:', e); }
    try { syncWidthToLayerSwitcher(); }
    catch (e) { /* non-critical */ }

}());
