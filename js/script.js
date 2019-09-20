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

function loadFile() {
    const fileUrlInput = document.getElementById('fileUrl');
    const fileNameInput = document.getElementById('fileName');

    kmlLayers.push({ kml: new google.maps.KmlLayer({
        url: fileUrlInput.value,
        //suppressInfoWindows: true,
        map: map
    }), name: fileNameInput.value});

    document.getElementById('kml-list').innerHTML += 
        `<li><button class="kml" onclick="deleteRoute(${kmlLayers.length-1})">
        ${fileNameInput.value}</button></li>`;
    
    fileNameInput.value = "";
    fileUrlInput.value = "";
}

function deleteRoute(index) {
    kmlLayers[index].kml.setMap(null);
    kmlLayers.splice(index, 1);

    const list = document.getElementById('kml-list');
    list.innerHTML = "";
    for (const [i, l] of kmlLayers.entries()) {
        list.innerHTML += 
        `<li><button class="kml" onclick="deleteRoute(${i})">
        ${l.name}</button></li>`;
    }
}

function validFileType(file) {
    const name = file.name.split('.');
    const extension = name[name.length - 1];
    return  extension  === 'kml' ||  extension === 'kmz';
}

function initialize() {
    const gijon = new google.maps.LatLng(43.540935, -5.673168);
    const misOpciones = {
        zoom: zoom,
        center: gijon,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"), misOpciones);

    const overlayOptions =
    {
        getTileUrl: TileWMS,
        tileSize: new google.maps.Size(256, 256)
    };
    const overlayWMS = new google.maps.ImageMapType(overlayOptions);
    map.overlayMapTypes.push(overlayWMS);
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