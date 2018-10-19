var map = (function () {

    var module = {};

    var mmapp = L.map('map').setView([50.2557664, 28.653982], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
        attribution: 'Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL. ',
        maxZoom: 18,
        id: 'background'
    }).addTo(mmapp);

    // https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png

    var last_layer;
    var points;

    module.showLine = function(line) {
        if (last_layer) mmapp.removeLayer(last_layer);
        last_layer = L.geoJSON(line).addTo(mmapp);

    };

    module.drawPoints = function(transactions) {
        console.log(transactions)
        if (points) mmapp.removeLayer(points);

        var geojson = [];

        transactions.forEach(function(tr){
            if (tr.lon == 'NA') return;

           geojson.push( {
               type: "Feature",
               geometry: {
                   coordinates: [+tr.lon, +tr.lat],
                   type: "Point"
               },
               properties: {

               }
           })
        });

        var geojsonMarkerOptions = {
            radius: 4,
            fillColor: "#ff7800",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        };

        points = L.geoJSON(geojson, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, geojsonMarkerOptions);
            }
        }).addTo(mmapp);

    };

    window.mmapp = mmapp;

    return module;
})();
