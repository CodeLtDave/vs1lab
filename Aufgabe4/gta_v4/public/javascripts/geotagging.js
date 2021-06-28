/* Dieses Skript wird ausgeführt, wenn der Browser index.html lädt. */

// Befehle werden sequenziell abgearbeitet ...

/**
 * "console.log" schreibt auf die Konsole des Browsers
 * Das Konsolenfenster muss im Browser explizit geöffnet werden.
 */
console.log("The script is going to start...");
var response;

// Es folgen einige Deklarationen, die aber noch nicht ausgeführt werden ...

// Hier wird die verwendete API für Geolocations gewählt
// Die folgende Deklaration ist ein 'Mockup', das immer funktioniert und eine fixe Position liefert.
GEOLOCATIONAPI = {
    getCurrentPosition: function(onsuccess) {
        onsuccess({
            "coords": {
                "latitude": 49.013790,
                "longitude": 8.390071,
                "altitude": null,
                "accuracy": 39,
                "altitudeAccuracy": null,
                "heading": null,
                "speed": null
            },
            "timestamp": 1540282332239
        });
    }
};



// Die echte API ist diese.
// Falls es damit Probleme gibt, kommentieren Sie die Zeile aus.
GEOLOCATIONAPI = navigator.geolocation;

/**
 * GeoTagApp Locator Modul
 */
var gtaLocator = (function GtaLocator(geoLocationApi) {

    // Private Member

    /**
     * Funktion spricht Geolocation API an.
     * Bei Erfolg Callback 'onsuccess' mit Position.
     * Bei Fehler Callback 'onerror' mit Meldung.
     * Callback Funktionen als Parameter übergeben.
     */
    var tryLocate = function(onsuccess, onerror) {
        if (geoLocationApi) {
            geoLocationApi.getCurrentPosition(onsuccess, function(error) {
                var msg;
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        msg = "User denied the request for Geolocation.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        msg = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        msg = "The request to get user location timed out.";
                        break;
                    case error.UNKNOWN_ERROR:
                        msg = "An unknown error occurred.";
                        break;
                }
                onerror(msg);
            });
        } else {
            onerror("Geolocation is not supported by this browser.");
        }
    };

    // Auslesen Breitengrad aus der Position
    var getLatitude = function(position) {
        return position.coords.latitude;
    };

    // Auslesen Längengrad aus Position
    var getLongitude = function(position) {
        return position.coords.longitude;
    };

    // Hier API Key eintragen
    var apiKey = "mffLMOUBH6Gew8LhuDEP8RpagqUXFJtl";

    /**
     * Funktion erzeugt eine URL, die auf die Karte verweist.
     * Falls die Karte geladen werden soll, muss oben ein API Key angegeben
     * sein.
     *
     * lat, lon : aktuelle Koordinaten (hier zentriert die Karte)
     * tags : Array mit Geotag Objekten, das auch leer bleiben kann
     * zoom: Zoomfaktor der Karte
     */
    var getLocationMapSrc = function(lat, lon, tags, zoom) {
        zoom = typeof zoom !== 'undefined' ? zoom : 10;

        if (apiKey === "YOUR_API_KEY_HERE") {
            console.log("No API key provided.");
            return "images/mapview.jpg";
        }

        var tagList = "&pois=You," + lat + "," + lon;
        if (tags !== undefined) tags.forEach(function(tag) {
            tagList += "|" + tag.name + "," + tag.latitude + "," + tag.longitude;
        });

        var urlString = "https://www.mapquestapi.com/staticmap/v4/getmap?key=" +
            apiKey + "&size=600,400&zoom=" + zoom + "&center=" + lat + "," + lon + "&" + tagList;

        //console.log("Generated Maps Url: " + urlString);
        return urlString;
    };

    

    return { // Start öffentlicher Teil des Moduls ...

        // Public Member

        readme: "Dieses Objekt enthält 'öffentliche' Teile des Moduls.",

        updateLocation: function(tagList=undefined) {
            var latitude = document.getElementById("latitude").value;
            var longitude = document.getElementById("longitude").value;
            if ( (latitude == "") || (longitude == "") ) {
                tryLocate(function(position) { 
                        latitude = getLatitude(position);
                        longitude = getLongitude(position);
                        
                        document.getElementById("latitude").value = latitude;
                        document.getElementById("longitude").value = longitude;

                        console.log("Calling Geo Locater api");
                        gtaLocator.syncMap(tagList);
                    },

                    function(error) {
                        alert(error);
                    }
                );
            }
            else
                gtaLocator.syncMap(tagList);

        },
        syncMap: function(tagList=undefined) {
            console.log("Requesting image ");
            var latitude = document.getElementById("latitude").value;
            var longitude = document.getElementById("longitude").value;

            document.getElementById("result-img").src = getLocationMapSrc(latitude, longitude, tagList, 15 );
        }

    }; // ... Ende öffentlicher Teil
})(GEOLOCATIONAPI);

/**
 * $(function(){...}) wartet, bis die Seite komplett geladen wurde. Dann wird die
 * angegebene Funktion aufgerufen. An dieser Stelle beginnt die eigentliche Arbeit
 * des Skripts.
 */
$(function() {
    //Beim ersten Aufruf, bzw. laden der Seite wird tagListGET aufgerufen
    tagListGET();
    
    //Beim clicken des tagging-button's wird tagListPOST aufgerufen
    document.getElementById("tagging-button").addEventListener("click", function() {tagListPOST();});


    //Wenn discovery button gedrückt wird, wird tagListGET aufgerufen
    document.getElementById("discovery-button").addEventListener("click", function() {tagListGET();});
});

//Funktion um mit einem tagList array die HTML Liste neu zu laden
function updatetagList(tagList) {
    var ul = document.getElementById("results");
    ul.innerHTML="";
    tagList.forEach(tag => {
        var entry = document.createElement("li");
        entry.appendChild(document.createTextNode(tag.name+ " (" + tag.latitude + ", " + tag.longitude + ") " + tag.hashtag));
        ul.appendChild(entry);
    });
}

//Sendet eine GET Anfrage (für die tagList) an den Server und aktualisiert anschließend die Map,
//sowie die HTML Liste in der die Tags stehen
function tagListGET(page = 1) {
    var ajax = new XMLHttpRequest();
    var searchTerm = document.getElementById("searchTerm").value;

    if(searchTerm!="")    
        ajax.open("GET", "/discovery/" + page + "/" + searchTerm, true);     //Sendet GET mit Suchwort (z.B. /discovery/abc)
    else
        ajax.open("GET", "/discovery/" + page , true);                   //Sendet GET ohne Suchwort

    //Wenn die Anfrage beendet ist und die tagList vom Server vorliegt, rufe UpdatetagList auf
    ajax.onreadystatechange = function() {
        if(ajax.readyState==4) {
            response = JSON.parse(ajax.responseText);        //Parsed die response des Server von JSON in ein tagList array
            console.log("GET DISCOVERY: " + ajax.responseText); 
            if (response.pageCount>0) {
                gtaLocator.updateLocation(response.tags);                 //Aktualiesiert die Map
                updatetagList(response.tags);                             //Aktualiesiert die HTML Liste in der die Tags stehen
                paginationHTMLButtons(response);
            }
        }
    }
    ajax.send();
}


//Sendet eine POST Anfrage mit einem neuen Tag an den Server und bekommt anschließend die vollständige TagList zurück
//danach werden Map sowie die HTML List in der die Tags stehen aktualisiert
function tagListPOST() {
    //Lädt die Werte aus dem Formular in Variablen
    var latitude = document.getElementById("latitude").value;
    var longitude = document.getElementById("longitude").value;
    var name = document.getElementById("name").value;
    var hashtag = document.getElementById("hashtag").value;

    var ajax = new XMLHttpRequest();

    ajax.open("POST", "/tagging/1", true);                        
    ajax.setRequestHeader("Content-Type", "application/json;charset=UTF-8");    //informiert den Server, dass die Daten in JSON Form geschickt werden

    //Wenn die Anfrage beendet ist und die tagList vom Server vorliegt, rufe UpdatetagList auf
    ajax.onreadystatechange = function() {
        if (ajax.readyState==4) {
            response = JSON.parse(ajax.responseText);         //Parsed die response des Server von JSON in ein tagList array
            console.log("Tagg added, complete List: " + ajax.responseText);
            gtaLocator.updateLocation(response.tags);                  //Aktualiesiert die Map
            updatetagList(response.tags);                              //Aktualiesiert die HTML Liste in der die Tags stehen
            paginationHTMLButtons(response);
        }
    }

    //Sende den Tag an den Server
    ajax.send(JSON.stringify({ 
        "latitude": latitude,
        "longitude":longitude, 
        "name": name,
        "hashtag": hashtag,
    }));
}

function paginationHTMLButtons(response) {
    var paginationBox = document.getElementById("pagination-box");
    var paginationButtonLeft;
    var paginationButtonRight;

    resetButtons();

    if (response.pageCount > 1) {
        for (var i = 1; i<=response.pageCount; i++) {
            addButton(i);
        }
    }

    document.getElementById("pagination-button-"+response.page).style.color = "black";

    function addButton (buttonNumber) {
        var newEntry = document.createElement("button");
        newEntry.innerHTML = buttonNumber;
        newEntry.id = "pagination-button-" + buttonNumber;
        newEntry.addEventListener("click", function(){tagListGET(buttonNumber);})
        
        paginationBox.insertBefore(newEntry, paginationButtonRight);
    }

    function resetButtons() {
        paginationBox.innerHTML="";

        paginationButtonLeft = document.createElement("button");
        paginationButtonLeft.innerHTML = "<<";
        paginationButtonLeft.id = "pagination-button-<<";
        paginationButtonLeft.addEventListener("click", function() {paginationButtonLeftClick();})
        paginationBox.appendChild(paginationButtonLeft);

        paginationButtonRight = document.createElement("button");
        paginationButtonRight.innerHTML = ">>"
        paginationButtonRight.id = "pagination-button->>";
        paginationButtonRight.addEventListener("click", function() {paginationButtonRightClick();})

        paginationBox.appendChild(paginationButtonRight);
    }
}

function paginationButtonLeftClick() {
    if (response.page > 1) {
        tagListGET(parseInt(response.page)-1);
    }
}

function paginationButtonRightClick() {
    if (response.page < response.pageCount) {
        tagListGET(parseInt(response.page)+1);
    }
}