var wms_layers = [];

var lyr_DOP20_0 = new ol.layer.Tile({
                            source: new ol.source.TileWMS(({
                              url: "https%3A%2F%2Fopendata.lgln.niedersachsen.de%2Fdoorman%2Fnoauth%2Fdop_wms",
                              attributions: ' ',
                              params: {
                                "LAYERS": "ni_dop20",
                                "TILED": "true",
                                "VERSION": "1.3.0"},
                            })),
                            title: 'DOP20',
                            popuplayertitle: 'DOP20',
                            type: 'base',
                            opacity: 1.000000,
                            
                            
                          });
              wms_layers.push([lyr_DOP20_0, 0]);

        var lyr_OpenStreetMap_1 = new ol.layer.Tile({
            'title': 'OpenStreetMap',
            'type':'base',
            'opacity': 0.700000,
            
            
            source: new ol.source.XYZ({
            attributions: ' ',
                url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            })
        });
var format_LoD2_24125956_2_20201031_2 = new ol.format.GeoJSON();
var features_LoD2_24125956_2_20201031_2 = format_LoD2_24125956_2_20201031_2.readFeatures(json_LoD2_24125956_2_20201031_2, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_LoD2_24125956_2_20201031_2 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_LoD2_24125956_2_20201031_2.addFeatures(features_LoD2_24125956_2_20201031_2);
var lyr_LoD2_24125956_2_20201031_2 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_LoD2_24125956_2_20201031_2, 
                style: style_LoD2_24125956_2_20201031_2,
                popuplayertitle: 'LoD2_24125956_2_2020-10-31',
                interactive: false,
                title: '<img src="styles/legend/LoD2_24125956_2_20201031_2.png" /> LoD2_24125956_2_2020-10-31'
            });
var format_LoD2_24125958_2_20201031_3 = new ol.format.GeoJSON();
var features_LoD2_24125958_2_20201031_3 = format_LoD2_24125958_2_20201031_3.readFeatures(json_LoD2_24125958_2_20201031_3, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_LoD2_24125958_2_20201031_3 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_LoD2_24125958_2_20201031_3.addFeatures(features_LoD2_24125958_2_20201031_3);
var lyr_LoD2_24125958_2_20201031_3 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_LoD2_24125958_2_20201031_3, 
                style: style_LoD2_24125958_2_20201031_3,
                popuplayertitle: 'LoD2_24125958_2_2020-10-31',
                interactive: false,
                title: '<img src="styles/legend/LoD2_24125958_2_20201031_3.png" /> LoD2_24125958_2_2020-10-31'
            });
var format_LoD2_24145958_2_20201031_4 = new ol.format.GeoJSON();
var features_LoD2_24145958_2_20201031_4 = format_LoD2_24145958_2_20201031_4.readFeatures(json_LoD2_24145958_2_20201031_4, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_LoD2_24145958_2_20201031_4 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_LoD2_24145958_2_20201031_4.addFeatures(features_LoD2_24145958_2_20201031_4);
var lyr_LoD2_24145958_2_20201031_4 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_LoD2_24145958_2_20201031_4, 
                style: style_LoD2_24145958_2_20201031_4,
                popuplayertitle: 'LoD2_24145958_2_2020-10-31',
                interactive: false,
                title: '<img src="styles/legend/LoD2_24145958_2_20201031_4.png" /> LoD2_24145958_2_2020-10-31'
            });
var format_LoD2_24165958_2_20201031_5 = new ol.format.GeoJSON();
var features_LoD2_24165958_2_20201031_5 = format_LoD2_24165958_2_20201031_5.readFeatures(json_LoD2_24165958_2_20201031_5, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_LoD2_24165958_2_20201031_5 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_LoD2_24165958_2_20201031_5.addFeatures(features_LoD2_24165958_2_20201031_5);
var lyr_LoD2_24165958_2_20201031_5 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_LoD2_24165958_2_20201031_5, 
                style: style_LoD2_24165958_2_20201031_5,
                popuplayertitle: 'LoD2_24165958_2_2020-10-31',
                interactive: false,
                title: '<img src="styles/legend/LoD2_24165958_2_20201031_5.png" /> LoD2_24165958_2_2020-10-31'
            });
var format_SpiekeroogPfade_6 = new ol.format.GeoJSON();
var features_SpiekeroogPfade_6 = format_SpiekeroogPfade_6.readFeatures(json_SpiekeroogPfade_6, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_SpiekeroogPfade_6 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_SpiekeroogPfade_6.addFeatures(features_SpiekeroogPfade_6);
var lyr_SpiekeroogPfade_6 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_SpiekeroogPfade_6, 
                style: style_SpiekeroogPfade_6,
                popuplayertitle: 'Spiekeroog Pfade',
                interactive: false,
    title: 'Spiekeroog Pfade<br />\
    <img src="styles/legend/SpiekeroogPfade_6_0.png" /> Dünenspaziergang<br />\
    <img src="styles/legend/SpiekeroogPfade_6_1.png" /> Strandwanderung zur Verona<br />\
    <img src="styles/legend/SpiekeroogPfade_6_2.png" /> Erlebnispfad zum CVJM<br />\
    <img src="styles/legend/SpiekeroogPfade_6_3.png" /> Stadtbesichtigung<br />\
    <img src="styles/legend/SpiekeroogPfade_6_4.png" /> <br />' });
var format_Landmarken_7 = new ol.format.GeoJSON();
var features_Landmarken_7 = format_Landmarken_7.readFeatures(json_Landmarken_7, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_Landmarken_7 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_Landmarken_7.addFeatures(features_Landmarken_7);
cluster_Landmarken_7 = new ol.source.Cluster({
  distance: 30,
  source: jsonSource_Landmarken_7
});
var lyr_Landmarken_7 = new ol.layer.Vector({
                declutter: false,
                source:cluster_Landmarken_7, 
                style: style_Landmarken_7,
                popuplayertitle: 'Landmarken',
                interactive: true,
    title: 'Landmarken<br />\
    <img src="styles/legend/Landmarken_7_0.png" /> Sehenswürdigkeit<br />\
    <img src="styles/legend/Landmarken_7_1.png" /> Sportliche Aktion<br />\
    <img src="styles/legend/Landmarken_7_2.png" /> Aussichtsplattform<br />' });
var group_DGM = new ol.layer.Group({
                                layers: [],
                                fold: 'close',
                                title: 'DGM'});
var group_LoD2 = new ol.layer.Group({
                                layers: [lyr_LoD2_24125956_2_20201031_2,lyr_LoD2_24125958_2_20201031_3,lyr_LoD2_24145958_2_20201031_4,lyr_LoD2_24165958_2_20201031_5,],
                                fold: 'close',
                                title: 'LoD2'});

lyr_DOP20_0.setVisible(true);lyr_OpenStreetMap_1.setVisible(true);lyr_LoD2_24125956_2_20201031_2.setVisible(true);lyr_LoD2_24125958_2_20201031_3.setVisible(true);lyr_LoD2_24145958_2_20201031_4.setVisible(true);lyr_LoD2_24165958_2_20201031_5.setVisible(true);lyr_SpiekeroogPfade_6.setVisible(true);lyr_Landmarken_7.setVisible(true);
var layersList = [lyr_DOP20_0,lyr_OpenStreetMap_1,group_LoD2,lyr_SpiekeroogPfade_6,lyr_Landmarken_7];
lyr_LoD2_24125956_2_20201031_2.set('fieldAliases', {'ALKISOID': 'ALKISOID', 'GEBID': 'GEBID', 'NAME': 'NAME', 'FUNKTION': 'FUNKTION', 'AGS': 'AGS', 'ABLDATUM': 'ABLDATUM', 'BPDACH': 'BPDACH', 'DQDACH': 'DQDACH', 'DQLAGE': 'DQLAGE', 'DQBODEN': 'DQBODEN', 'DACHFORM': 'DACHFORM', 'HOEHEGEB': 'HOEHEGEB', 'HOEHEBD': 'HOEHEBD', 'HOEHETRAUF': 'HOEHETRAUF', 'HOEHEFIRST': 'HOEHEFIRST', 'GEMEINDE': 'GEMEINDE', 'LAGEHNR': 'LAGEHNR', });
lyr_LoD2_24125958_2_20201031_3.set('fieldAliases', {'ALKISOID': 'ALKISOID', 'GEBID': 'GEBID', 'NAME': 'NAME', 'FUNKTION': 'FUNKTION', 'AGS': 'AGS', 'ABLDATUM': 'ABLDATUM', 'BPDACH': 'BPDACH', 'DQDACH': 'DQDACH', 'DQLAGE': 'DQLAGE', 'DQBODEN': 'DQBODEN', 'DACHFORM': 'DACHFORM', 'HOEHEGEB': 'HOEHEGEB', 'HOEHEBD': 'HOEHEBD', 'HOEHETRAUF': 'HOEHETRAUF', 'HOEHEFIRST': 'HOEHEFIRST', 'GEMEINDE': 'GEMEINDE', 'LAGEHNR': 'LAGEHNR', });
lyr_LoD2_24145958_2_20201031_4.set('fieldAliases', {'ALKISOID': 'ALKISOID', 'GEBID': 'GEBID', 'NAME': 'NAME', 'FUNKTION': 'FUNKTION', 'AGS': 'AGS', 'ABLDATUM': 'ABLDATUM', 'BPDACH': 'BPDACH', 'DQDACH': 'DQDACH', 'DQLAGE': 'DQLAGE', 'DQBODEN': 'DQBODEN', 'DACHFORM': 'DACHFORM', 'HOEHEGEB': 'HOEHEGEB', 'HOEHEBD': 'HOEHEBD', 'HOEHETRAUF': 'HOEHETRAUF', 'HOEHEFIRST': 'HOEHEFIRST', 'GEMEINDE': 'GEMEINDE', 'LAGEHNR': 'LAGEHNR', });
lyr_LoD2_24165958_2_20201031_5.set('fieldAliases', {'ALKISOID': 'ALKISOID', 'GEBID': 'GEBID', 'NAME': 'NAME', 'FUNKTION': 'FUNKTION', 'AGS': 'AGS', 'ABLDATUM': 'ABLDATUM', 'BPDACH': 'BPDACH', 'DQDACH': 'DQDACH', 'DQLAGE': 'DQLAGE', 'DQBODEN': 'DQBODEN', 'DACHFORM': 'DACHFORM', 'HOEHEGEB': 'HOEHEGEB', 'HOEHEBD': 'HOEHEBD', 'HOEHETRAUF': 'HOEHETRAUF', 'HOEHEFIRST': 'HOEHEFIRST', 'GEMEINDE': 'GEMEINDE', 'LAGEHNR': 'LAGEHNR', });
lyr_SpiekeroogPfade_6.set('fieldAliases', {'fid': 'fid', });
lyr_Landmarken_7.set('fieldAliases', {'fid': 'fid', 'Bezeichnung': 'Bezeichnung', 'Beschreibung': 'Beschreibung', 'Bild': 'Bild', 'Kategorie': 'Kategorie', });
lyr_LoD2_24125956_2_20201031_2.set('fieldImages', {'ALKISOID': 'TextEdit', 'GEBID': 'TextEdit', 'NAME': 'TextEdit', 'FUNKTION': 'TextEdit', 'AGS': 'TextEdit', 'ABLDATUM': 'TextEdit', 'BPDACH': 'TextEdit', 'DQDACH': 'TextEdit', 'DQLAGE': 'TextEdit', 'DQBODEN': 'TextEdit', 'DACHFORM': 'TextEdit', 'HOEHEGEB': 'TextEdit', 'HOEHEBD': 'TextEdit', 'HOEHETRAUF': 'TextEdit', 'HOEHEFIRST': 'TextEdit', 'GEMEINDE': 'TextEdit', 'LAGEHNR': 'TextEdit', });
lyr_LoD2_24125958_2_20201031_3.set('fieldImages', {'ALKISOID': 'TextEdit', 'GEBID': 'TextEdit', 'NAME': 'TextEdit', 'FUNKTION': 'TextEdit', 'AGS': 'TextEdit', 'ABLDATUM': 'TextEdit', 'BPDACH': 'TextEdit', 'DQDACH': 'TextEdit', 'DQLAGE': 'TextEdit', 'DQBODEN': 'TextEdit', 'DACHFORM': 'TextEdit', 'HOEHEGEB': 'TextEdit', 'HOEHEBD': 'TextEdit', 'HOEHETRAUF': 'TextEdit', 'HOEHEFIRST': 'TextEdit', 'GEMEINDE': 'TextEdit', 'LAGEHNR': 'TextEdit', });
lyr_LoD2_24145958_2_20201031_4.set('fieldImages', {'ALKISOID': 'TextEdit', 'GEBID': 'TextEdit', 'NAME': 'TextEdit', 'FUNKTION': 'TextEdit', 'AGS': 'TextEdit', 'ABLDATUM': 'TextEdit', 'BPDACH': 'TextEdit', 'DQDACH': 'TextEdit', 'DQLAGE': 'TextEdit', 'DQBODEN': 'TextEdit', 'DACHFORM': 'TextEdit', 'HOEHEGEB': 'TextEdit', 'HOEHEBD': 'TextEdit', 'HOEHETRAUF': 'TextEdit', 'HOEHEFIRST': 'TextEdit', 'GEMEINDE': 'TextEdit', 'LAGEHNR': 'TextEdit', });
lyr_LoD2_24165958_2_20201031_5.set('fieldImages', {'ALKISOID': 'TextEdit', 'GEBID': 'TextEdit', 'NAME': 'TextEdit', 'FUNKTION': 'TextEdit', 'AGS': 'TextEdit', 'ABLDATUM': 'TextEdit', 'BPDACH': 'TextEdit', 'DQDACH': 'TextEdit', 'DQLAGE': 'TextEdit', 'DQBODEN': 'TextEdit', 'DACHFORM': 'TextEdit', 'HOEHEGEB': 'TextEdit', 'HOEHEBD': 'TextEdit', 'HOEHETRAUF': 'TextEdit', 'HOEHEFIRST': 'TextEdit', 'GEMEINDE': 'TextEdit', 'LAGEHNR': 'TextEdit', });
lyr_SpiekeroogPfade_6.set('fieldImages', {'fid': 'TextEdit', });
lyr_Landmarken_7.set('fieldImages', {'fid': 'TextEdit', 'Bezeichnung': 'TextEdit', 'Beschreibung': 'TextEdit', 'Bild': 'ExternalResource', 'Kategorie': 'ValueMap', });
lyr_LoD2_24125956_2_20201031_2.set('fieldLabels', {'ALKISOID': 'no label', 'GEBID': 'no label', 'NAME': 'no label', 'FUNKTION': 'no label', 'AGS': 'no label', 'ABLDATUM': 'no label', 'BPDACH': 'no label', 'DQDACH': 'no label', 'DQLAGE': 'no label', 'DQBODEN': 'no label', 'DACHFORM': 'no label', 'HOEHEGEB': 'no label', 'HOEHEBD': 'no label', 'HOEHETRAUF': 'no label', 'HOEHEFIRST': 'no label', 'GEMEINDE': 'no label', 'LAGEHNR': 'no label', });
lyr_LoD2_24125958_2_20201031_3.set('fieldLabels', {'ALKISOID': 'no label', 'GEBID': 'no label', 'NAME': 'no label', 'FUNKTION': 'no label', 'AGS': 'no label', 'ABLDATUM': 'no label', 'BPDACH': 'no label', 'DQDACH': 'no label', 'DQLAGE': 'no label', 'DQBODEN': 'no label', 'DACHFORM': 'no label', 'HOEHEGEB': 'no label', 'HOEHEBD': 'no label', 'HOEHETRAUF': 'no label', 'HOEHEFIRST': 'no label', 'GEMEINDE': 'no label', 'LAGEHNR': 'no label', });
lyr_LoD2_24145958_2_20201031_4.set('fieldLabels', {'ALKISOID': 'no label', 'GEBID': 'no label', 'NAME': 'no label', 'FUNKTION': 'no label', 'AGS': 'no label', 'ABLDATUM': 'no label', 'BPDACH': 'no label', 'DQDACH': 'no label', 'DQLAGE': 'no label', 'DQBODEN': 'no label', 'DACHFORM': 'no label', 'HOEHEGEB': 'no label', 'HOEHEBD': 'no label', 'HOEHETRAUF': 'no label', 'HOEHEFIRST': 'no label', 'GEMEINDE': 'no label', 'LAGEHNR': 'no label', });
lyr_LoD2_24165958_2_20201031_5.set('fieldLabels', {'ALKISOID': 'no label', 'GEBID': 'no label', 'NAME': 'no label', 'FUNKTION': 'no label', 'AGS': 'no label', 'ABLDATUM': 'no label', 'BPDACH': 'no label', 'DQDACH': 'no label', 'DQLAGE': 'no label', 'DQBODEN': 'no label', 'DACHFORM': 'no label', 'HOEHEGEB': 'no label', 'HOEHEBD': 'no label', 'HOEHETRAUF': 'no label', 'HOEHEFIRST': 'no label', 'GEMEINDE': 'no label', 'LAGEHNR': 'no label', });
lyr_SpiekeroogPfade_6.set('fieldLabels', {'fid': 'no label', });
lyr_Landmarken_7.set('fieldLabels', {'fid': 'hidden field', 'Bezeichnung': 'no label', 'Beschreibung': 'header label - always visible', 'Bild': 'no label', 'Kategorie': 'header label - always visible', });
lyr_Landmarken_7.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});