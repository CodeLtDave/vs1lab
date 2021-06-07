/**
 * Template für Übungsaufgabe VS1lab/Aufgabe3
 * Das Skript soll die Serverseite der gegebenen Client Komponenten im
 * Verzeichnisbaum implementieren. Dazu müssen die TODOs erledigt werden.
 */

/**
 * Definiere Modul Abhängigkeiten und erzeuge Express app.
 */

var http = require('http');
//var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var express = require('express');
const { response } = require('express');
const { body } = require('express-validator');

var app;
app = express();
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));

// Setze ejs als View Engine
app.set('view engine', 'ejs');

/**
 * Konfiguriere den Pfad für statische Dateien.
 * Teste das Ergebnis im Browser unter 'http://localhost:3000/'.
 */

 app.use(express.static('public'))

/**
 * Konstruktor für GeoTag Objekte.
 * GeoTag Objekte sollen min. alle Felder des 'tag-form' Formulars aufnehmen.
 */

class GeoTag{
    constructor(body) {
        this.latitude = body.latitude
        this.longitude = body.longitude
        this.name = body.name
        this.hashtag = body.hashtag
    }
}

/**
 * Modul für 'In-Memory'-Speicherung von GeoTags mit folgenden Komponenten:
 * - Array als Speicher für Geo Tags.
 * - Funktion zur Suche von Geo Tags in einem Radius um eine Koordinate.
 * - Funktion zur Suche von Geo Tags nach Suchbegriff.
 * - Funktion zum hinzufügen eines Geo Tags.
 * - Funktion zum Löschen eines Geo Tags.
 */

var tagList = [];
var filteredList = [];

function searchName(searchTerm) {
    for(var i = 0; i<tagList.length; i++) {
        if(tagList[i].name.includes(searchTerm) || tagList[i].hashtag.includes(searchTerm)) {
            filteredList.push(getTagg(i));
        }
    }
}

function addTag(body) {
    tagList.push(new GeoTag(body));
    console.log("Tagg added!");
}

function deleteTag(index) {
    tagList.splice(index,1);
    console.log("Tagg deleted");
}

function getTagg(i) {
    var body = {
        latitude: tagList[i].latitude,
        longitude: tagList[i].longitude,
        name: tagList[i].name,
        hashtag: tagList[i].hashtag
    };
    return new GeoTag(body)
}

/**
 * Route mit Pfad '/' für HTTP 'GET' Requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests enthalten keine Parameter
 *
 * Als Response wird das ejs-Template ohne Geo Tag Objekte gerendert.
 */

app.get('/', function(req, res) {
    res.render('gta', {
        taglist: []
    });
});

/**
 * Route mit Pfad '/tagging' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'tag-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Mit den Formulardaten wird ein neuer Geo Tag erstellt und gespeichert.
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 */

 app.post('/tagging', function(req, res){
    console.log(req.body);
    addTag(req.body);
    res.render('gta', {taglist: tagList, latitude: req.body.latitude, longitude: req.body.latitude});
 });

/**
 * Route mit Pfad '/discovery' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'filter-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 * Falls 'term' vorhanden ist, wird nach Suchwort gefiltert.
 */

 app.post('/discovery', function(req, res){
    filteredList = [];
    searchName(req.body.searchTerm);
    console.log('Search for: "' + req.body.searchTerm + '" gave ' + filteredList.length + ' results');
    res.render('gta', {taglist: filteredList});
 });

/**
 * Setze Port und speichere in Express.
 */

var port = 3000;
app.set('port', port);

/**
 * Erstelle HTTP Server
 */

var server = http.createServer(app);

/**
 * Horche auf dem Port an allen Netzwerk-Interfaces
 */

server.listen(port);
