const contador = 1;
const selected_marker = null;
const WMS_URL = 'http://ide.gijon.es:8080/geoserver/wms?';
let WMS_Layers = '';//'Gijon:Rios,Gijon:LU_Zona_Verde,Gijon:Rutas_Verdes,Gijon:Zona_Verde,Gijon:Playas,Gijon:Instalaciones_Deportivas,Gijon:Colegios_Electorales';
let map;
const markersArray = [];
const TileWMS = function (coord, zoom) {
    const proj = map.getProjection();
    const zfactor = Math.pow(2, zoom);
    const top = proj.fromPointToLatLng(new google.maps.Point(coord.x * 256 / zfactor, coord.y * 256 / zfactor));
    const bot = proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * 256 / zfactor, (coord.y + 1) * 256 / zfactor));
    const bbox = top.lng() + "," + bot.lat() + "," + bot.lng() + "," + top.lat();

    let myURL = WMS_URL + "SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&SRS=EPSG%3A4326&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=TRUE";
    myURL += "&LAYERS=" + WMS_Layers;
    myURL += "&BBOX=" + bbox;
    return myURL;
}

let loadedRoutes;