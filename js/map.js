var map = (function () {

    var module = {};

    var mmapp
        , last_layer
        , points
        , seg_layer
        , stops
        ;

    var timeFormat = d3.timeFormat("%Y-%m-%d %H:%M:%S");

    var legend_value;

    var dir_colors = {
        "0": "#4a2366",
        "1": "#0B5D66"
    };

    var scale = d3.scaleLinear()
        .range([0, 40]);

    mmapp = L.map('map', {
        maxZoom: 18,
        minZoom: 11,
        maxBounds: L.latLngBounds(L.latLng(50.07, 28.29), L.latLng(50.47, 29.01))
    }).setView([50.2227664, 28.673982], 12);

    L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
        attribution: 'Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL. ',
        id: 'background'
    }).addTo(mmapp);

    // https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png

    var legend = L.control({position: 'topright'});
    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend');

        var g = d3.select(div)
            .append("svg")
            .append("g")
            .attr("transform", "translate(70, 15)");

        var dir = g.selectAll("g.dir")
            .data(["Прямий", "Зворотній"])
            .enter()
            .append("g")
            .attr("class", "dir")
            .attr("transform", (d, i) => "translate(0, " + i*25  + ")");

        dir.append("text")
            .attr("y", 15)
            .attr("x", -10)
            .text(d => d);

        dir.each(function(dir, iiii) {
            d3.select(this)
                .selectAll("rect.bar")
                .data([20])
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("width", 40)
                .attr("height", d => d)
                .attr("x", (d, i) => i * 40)
                .attr("y", 0)
                .style("fill-opacity", 0.5)
                .style("fill", (d, i) => dir_colors["" + iiii])
        });

        legend_value = dir.filter((d, i) => i==0)
            .append("text")
            .attr("class", 'value')
            .attr("y", 15)
            .attr("x", 46)
            .text("40");

        return div;
    };

    legend.addTo(mmapp);


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
                layer.bindPopup(renderPointPopup(feature));
            }

        }).addTo(mmapp);
    };

    module.drawSegments = function(segments) {
        if (seg_layer) mmapp.removeLayer(seg_layer);

        scale.domain([0, d3.max(segments, s => s.properties.transactions)]);

        seg_layer = L.geoJSON(segments, {
            style: function(feature) {
                return {
                    color: dir_colors[feature.properties.direction],
                    weight: scale(feature.properties.transactions),
                    opacity: .5,
                    lineCap: 'butt',
                    offset: scale(feature.properties.transactions) /2,
                    smoothFactor: 5
                }
            },
            onEachFeature: function(feature, layer) {
                layer.bindPopup(renderSegmentPopup(feature));
            }

        }).addTo(mmapp);

        legend_value.text(d3.format(".0f")(scale.invert(20)));
    };

    window.mmapp = mmapp;


    function renderPointPopup(feature) {
        return "<span>Квиток за межами маршруту</span>" +
             "<br><span>№ машини " + feature.properties.vehicle + "</span>" +
             "<br><span>Час: " + timeFormat(feature.properties.datetime) + "</span>"
    }

    function renderSegmentPopup(feature) {
        return "<span>Зупинка: " + stops.get(+feature.properties.stop_id)[0].name + "</span>" +
            "<br><span>Напрямок: " + (feature.properties.direction=="0" ? "Прямий" : "Зворотній") + "</span>" +
            "<br><span>Квитків за обраний період: " + feature.properties.transactions + "</span>"
    }

    module.invalidateSize = function() {
        if (mmapp) mmapp.invalidateSize();
        return module;
    };
    
    module.fitBounds = function() {
        if (!seg_layer) return module;

        mmapp.fitBounds(seg_layer.getBounds());
        return module;
    };
    
    module.stops = function (v) {
        if (!arguments.length) return stops;

        stops = v;
        return module;
    };

    return module;
})();
