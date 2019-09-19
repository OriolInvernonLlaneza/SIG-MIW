let map;

function initMap() {
    options = {
        center: new google.maps.LatLng(oviedo[0], oviedo[1]),
        zoom: zoom,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        disableDefaultUI: true,
    };
    map = new google.maps.Map(document.getElementById("map_frame"), options);
}