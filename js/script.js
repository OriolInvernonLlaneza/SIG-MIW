kmls = [];

const routesInput = document.getElementById('myroutes');
routesInput.addEventListener('change', () => {
    loadedRoutes = [];
    let uploaded = "Subido/s: ";
    for (let i = 0; i < routesInput.files.length; i++) {
        const route = routesInput.files[i];
        if(validFileType(route)) {
            loadedRoutes.push(route);
            uploaded += i < routesInput.files.length-1 ? route.name + ", " : route.name + ".";
        }
    }
    document.getElementById("uploaded").innerText = uploaded;
    
    /*kmls = [];
    loadedRoutes.forEach((file => {
        kmls.push(new google.maps.KmlLayer(file, {
            map: map
        }));
    }));*/
});

function validFileType(file) {
    const name = file.name.split('.');
    return name[name.length-1] === 'kml';
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