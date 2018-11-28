var map = (function () {

    var module = {};

    var mmapp
        , last_layer
        , points
        ;

    var timeFormat = d3.timeFormat("%Y-%m-%d %H:%M:%S");

    mmapp = L.map('map', {
        maxZoom: 18,
        minZoom: 11,
        maxBounds: L.latLngBounds(L.latLng(50.07, 28.29), L.latLng(50.47, 29.01))
    }).setView([50.2227664, 28.673982], 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
        attribution: 'Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL. ',
        id: 'background'
    }).addTo(mmapp);

    // https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png

    module.showLine = function(line) {
        if (last_layer) mmapp.removeLayer(last_layer);
        last_layer = L.geoJSON(line).addTo(mmapp);

    };

    module.drawPoints = function(transactions) {
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
                   on_route: tr.on_route,
                   datetime: tr.datetime,
                   vehicle: tr.vehicle
               }
           })
        });

        var geojsonMarkerOptions = {
            radius: 4,
            fillColor: "#6d368b",
            color: "white",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        };

        points = L.geoJSON(geojson, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 4,
                    fillColor: feature.properties.on_route=='1' ? "#6d368b" : 'grey',
                    color: "white",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                });
            },
            onEachFeature: function(feature, layer) {
                layer.bindPopup(renderPopup(feature));
            }

        }).addTo(mmapp);

        points.on("click", function(e){
            console.log(e.layer)
        })

    };

    window.mmapp = mmapp;


    function renderPopup(feature) {
        return "<span>№ " + feature.properties.vehicle + "</span>" +
                "<br><span>Час: " + timeFormat(feature.properties.datetime) + "</span>"
    }

    module.invalidateSize = function() {
        if (mmapp) mmapp.invalidateSize();
        return module;
    };

    return module;
})();
