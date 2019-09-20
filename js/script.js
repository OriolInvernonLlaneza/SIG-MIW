function initialize() {
    const gijon = new google.maps.LatLng(43.540935, -5.673168);
    const misOpciones = {
        zoom: 13,
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