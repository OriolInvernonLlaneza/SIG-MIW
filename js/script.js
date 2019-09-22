//let kmls = [];
//let loadedRoutes = [];

/**const routesInput = document.getElementById('myroutes');
 routesInput.addEventListener('change', (e) => {
    e.preventDefault();
    loadedRoutes = [];
    kmls = [];
    kmlLayers = [];

    let uploaded = "Subido/s: ";
    for (let i = 0; i < routesInput.files.length; i++) {
        const route = routesInput.files[i];
        if (validFileType(route)) {
            loadedRoutes.push(route);
            uploaded += i < routesInput.files.length - 1 ? route.name + ", " : route.name + ".";
        } else {
            alert('Por favor, asegúrese de que el archivo está en formato KML o KMZ.')
        }
    }
    document.getElementById("uploaded").innerText = uploaded;

    const reader = new FileReader();
    reader.onloadend = kml => {
        if (kml.target.readyState == FileReader.DONE) {
            kmlLayers.push(new google.maps.KmlLayer({
                url: kml.target.result,
                //suppressInfoWindows: true,
                map: map
            }));
        } else {
            alert('Se ha producido un error leyendo el fichero.');
        }
    };
    loadedRoutes.forEach(f => reader.readAsDataURL(f));
});**/

/**
 * Loads a KML layer from a given url.
 * Prepares streetview activation when user clicks a marker.
 * Updates the layer list.
 */
function loadFile() {
    const fileUrlInput = document.getElementById('fileUrl');
    const fileNameInput = document.getElementById('fileName');

    if (fileUrlInput.value !== "" && fileNameInput.value !== "" && validURL(fileUrlInput.value)) {
        const aux = new google.maps.KmlLayer({
            url: fileUrlInput.value,
            suppressInfoWindows: true,
            map: map
        });
        aux.addListener('click', (event) => {
            if (event.pixelOffset.height !== 0) { // Fix marrullero
                const pano = map.getStreetView();
                pano.setPosition(event.latLng);
                pano.setPov({ heading: 0, pitch: 0 });
                pano.setOptions({
                    linksControl: false,
                    zoomControl: false,
                    clickToGo: false
                });
                pano.setVisible(true);
            }
        });

        kmlLayers.push({ kml: aux, name: fileNameInput.value, url: fileUrlInput.value });

        document.getElementById('kml-list').innerHTML +=
            `<button class="kml" onclick="deleteRoute(${kmlLayers.length - 1})">
        ${fileNameInput.value}</button>`;

        fileNameInput.value = "";
        fileUrlInput.value = "";
    }
}

/**
 * Removes the chosen KML layer and updates the list.
 * @param {*} index of th ekml to be deleted.
 */
function deleteRoute(index) {
    kmlLayers[index].kml.setMap(null);
    kmlLayers.splice(index, 1);

    const list = document.getElementById('kml-list');
    list.innerHTML = "";
    for (const [i, l] of kmlLayers.entries()) {
        list.innerHTML +=
            `<button class="kml" onclick="deleteRoute(${i})">
        ${l.name}</button>`;
    }
}

/**
 * Checks that the received file is a KML or KMZ
 * @deprecated
 * @param {*} file
 */
function validFileType(file) {
    const name = file.name.split('.');
    const extension = name[name.length - 1];
    return extension === 'kml' || extension === 'kmz';
}

/**
 * Initializes the map with the starting options and the chosen WMS tiles.
 * Also reloads any KML layer that was added previously.
 */
function initialize() {
    const gijon = new google.maps.LatLng(43.540935, -5.673168);
    const misOpciones = {
        zoom: zoom,
        center: gijon,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: true,
        fullscreenControl: true
    };
    map = new google.maps.Map(document.getElementById("map_canvas"), misOpciones);

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        draggable: true,
        map: map,
        panel: document.getElementById('directions-panel')
    });
    const overlayOptions = {
        getTileUrl: TileWMS,
        tileSize: new google.maps.Size(256, 256)
    };
    const overlayWMS = new google.maps.ImageMapType(overlayOptions);
    map.overlayMapTypes.push(overlayWMS);

    const aux = [];
    kmlLayers.forEach(l => {
        const lay = new google.maps.KmlLayer({
            url: l.url,
            suppressInfoWindows: true,
            map: map
        });
        lay.addListener('click', (event) => {
            if (event.pixelOffset.height !== 0) { // Fix marrullero
                const pano = map.getStreetView();
                pano.setPosition(event.latLng);
                pano.setPov({ heading: 0, pitch: 0 });
                pano.setOptions({
                    linksControl: false,
                    zoomControl: false,
                    clickToGo: false
                });
                pano.setVisible(true);
            }
        });
        aux.push({ kml: lay, name: l.name, url: l.url });
    });
    kmlLayers = aux;
}

function check(cb) {
    let checked = cb.checked;
    if (checked) {
        if (WMS_Layers === "") {
            WMS_Layers = WMS_Layers.concat(cb.value);
        } else {
            WMS_Layers = WMS_Layers.concat("," + cb.value);
        }
        console.log(cb.value);
    } else {
        WMS_Layers = WMS_Layers.replace(`,${cb.value}`, '');
        WMS_Layers = WMS_Layers.replace(`${cb.value}`, '');
        if (WMS_Layers.charAt(0) === ",") {
            WMS_Layers = WMS_Layers.slice(1);
        }
    }
    initialize();
}

// https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
function validURL(str) {
    const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
}


let newMarker;
let markers = [];
let waypts = [];
let routesListener;

function startDrawing() {
    document.getElementById("finish_route").classList.toggle('occult');
    document.getElementById("create_btn").classList.toggle('occult');

    routesListener = google.maps.event.addListener(map, 'click', (event) => {
        newMarker = new google.maps.Marker({ position: event.latLng, map: map });
        console.log("Latlng: " + event.latLng);
        markers.push(newMarker);
        if (markers.length > 2) {
            waypts.push({
                location: markers[markers.length - 2].position,
                stopover: true
            });
        }

    });
}


function displayRoute(origin, destination, service, display) {
    service.route({
        origin: origin,
        destination: destination,
        waypoints: waypts,
        travelMode: 'WALKING',
        avoidTolls: true
    }, function (response, status) {
        if (status === 'OK') {
            console.log("All OK")
            directionsRenderer.setDirections(response);
            waypts = [];
            let route = response.routes[0];
            console.log(route);
            let duration = 0;
            for (l of route.legs) {
                duration += l.duration.value;
            }
            // transform the duration in minutes
            duration = duration / 60;
            // For each route, display summary information.
            document.getElementById("duration_route").innerText = `Duración: ${Math.round(duration)} min`;

        } else {
            alert('Could not display directions due to: ' + status);
        }
    });
}

function finishRoute() {
    document.getElementById("finish_route").classList.toggle('occult');
    document.getElementById("create_btn").classList.toggle('occult');

    if (markers.length > 1) {
        displayRoute(markers[0].position, markers[markers.length - 1].position, directionsService,
        directionsRenderer);
    }

    deleteMarkers();
    google.maps.event.removeListener(routesListener);
}

function clearRoute() {
    document.getElementById("finish_route").classList.add('occult');
    document.getElementById("create_btn").classList.remove('occult');
    document.getElementById("duration_route").innerText = "";

    deleteMarkers();
    directionsRenderer.setDirections({ routes: [] });
    google.maps.event.removeListener(routesListener);
}

function deleteMarkers() {
    for (m of markers) {
        m.setMap(null);
    }
    markers = [];
    waypts = [];
}

function showDirections() {
    const dirWindow = window.open();
    dirWindow.document.write(document.getElementById("directions-panel").innerHTML);
}