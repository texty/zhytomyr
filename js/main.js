
var inpc = d3.format(".0%");
// var date_format = d3.format("%Y-%m-%d");

var vehicle_card_template = Handlebars.compile($("#vehicle-card-template").html());
var route_total_card_template = Handlebars.compile($("#route-total-card-template").html());

var route_total_summary_template = Handlebars.compile($("#route-total-summary-template").html());

var context = {
    // date_str: '2018-12-31',
    route_str: '1',
    switch_state: 'marey',
    direction: '0',
    time_extent: null
};

var all_routes = [
    {type: "troll", name: 'Тролейбус', routes: [
        {key: '1', name: "Тролейбус 1"},
        {key: '2', name: "Тролейбус 2"},
        {key: '3', name: "Тролейбус 3"},
        {key: '4', name: "Тролейбус 4"},
        {key: '4A', name: "Тролейбус 4А"},
        {key: '5A', name: "Тролейбус 5А"},
        {key: '6', name: "Тролейбус 6"},
        {key: '7', name: "Тролейбус 7"},
        {key: '7A', name: "Тролейбус 7А"},
        {key: '8', name: "Тролейбус 8"},
        {key: '9', name: "Тролейбус 9"},
        {key: '10', name: "Тролейбус 10"},
        {key: '12', name: "Тролейбус 12"},
        {key: '15A', name: "Тролейбус 15А"},
        {key: 'H2', name: "Тролейбус Н2"},
        {key: 'H3', name: "Тролейбус Н3"},
        {key: 'H4', name: "Тролейбус Н4"},
        {key: 'H5', name: "Тролейбус Н5"},
        {key: 'H7', name: "Тролейбус Н7"}
    ]},
    {type: "bus", name: "Автобус", routes: [
        {key: '53', name: "Автобус 53"},
        {key: '53A', name: "Автобус 53А"}
    ]},
    {type: "tram", name: "Трамвай", routes: [
        {key: '91', picker_name: 'Т', name: "Трамвай"}
    ]}
];

var route_obj_by_route_key = {};
all_routes.forEach(rt => rt.routes.forEach(r => route_obj_by_route_key[r.key] = {type: rt, route: r}));

var route_picker = route_picker()
    .data(all_routes)
    .onChange(function(route_str){
        context.route_str = route_str;

        d3.selectAll(".route-number-text").text(route_obj_by_route_key[context.route_str].route.name);
        renderRoute(context.date_str, context.route_str);
    });

d3.select("#route-pills").call(route_picker);

data_provider.getHeatmap(function(err, heatmap){
    if (err) throw err;
    
    var calendar_control = calendar()
        .heatdata(heatmap.by_date)
        .onDateChange(function (date_str) {
            context.date_str = date_str;
            renderRoute(context.date_str, context.route_str);
            
            route_picker.heatdata(heatmap.by_date_route.get(date_str));
        });

    d3.select("body").call(calendar_control);

    // calendar_control.selected_date(context.date_str);
});

route_picker.route(route_obj_by_route_key[context.route_str].route.name, true);


var marey_map_pills = d3.select("#marey-map-pills")
    .selectAll("a.nav-link")
    .datum(function(){return d3.select(this).attr('data-chart')})


var direction_pills = d3.select('#marey-direction')
    .selectAll('a.nav-link')
    .datum(function(){return d3.select(this).attr('data-direction')})
    .on('click', function(d){
        d3.event.preventDefault();

        if (d == context.direction) return;
        context.direction = d;
        direction_pills.classed('active', dd => dd == context.direction);

        d3.queue()
            .defer(data_provider.getSegments.bind(this, context.date_str, context.route_str))
            .defer(data_provider.getStops)
            .await(function (err, segments, stops) {
                if (err) throw err;

                showMarey(
                    segments.get(context.direction),
                    stops.by_route_dir.get(context.route_str).get(context.direction),
                    context.time_domain
                );
            })
    });



function renderRoute(date_str, route_str) {
    d3.queue()
        .defer(data_provider.getTransactions.bind(this, date_str, route_str))
        .defer(data_provider.getSegments.bind(this, date_str, route_str))
        .defer(data_provider.getGpsPeriods.bind(this, date_str))
        .defer(data_provider.getOutPeriods.bind(this, date_str))
        .defer(data_provider.getRouteLines)
        .defer(data_provider.getStops)
        .defer(data_provider.getSegmentGeometries)
        .await(function (err, transactions, segments, gps_periods, out_periods, lines, stops, seg_geo) {
            if (err) throw err;

            map.stops(stops.by_id);

            var moment_start = moment(date_str).add({hours: 4});

            var date_start = moment_start.toDate();
            var date_end = moment_start.add({days: 1}).toDate();

            var date_extent = [date_start, date_end];

            context.time_domain = d3.extent(transactions.total.values, d => d.datetime);
            
            if  (context.switch_state == 'marey') {
                showMarey(segments.get(context.direction), stops.by_route_dir.get(context.route_str).get(context.direction), context.time_domain);
            }

            var totalMaxY = d3.max(transactions.total.bar_data, d => d.value);
            var vehiclesMaxY = d3.max(transactions.by_vehicles, veh => d3.max(veh.bar_data, d => d.value));

            console.log(totalMaxY);
            console.log(vehiclesMaxY);

            drawTotalChart();
            drawSmallMultiples();

            var line = lines.get(route_str);
            map.showLine(line);

            var points = pointsForMap(transactions);
            map.drawPoints(points);


            var map_segments = segmetsForMap(segments, seg_geo, context);
            map.drawSegments(map_segments);

            map.invalidateSize().fitBounds();

            marey_map_pills.on("click", function(chart){
                d3.event.preventDefault();

                if (chart == context.switch_state) return;

                context.switch_state = chart;

                d3.select(".marey-container").classed('hidden', context.switch_state != 'marey');
                d3.select("#map-container").classed('hidden', context.switch_state != 'map');
                d3.select(".by-vehicle-container").classed('hidden', context.switch_state != 'by-vehicle');

                d3.select(".hidden-on-by-vehicle").classed('invisible', context.switch_state === 'by-vehicle');

                if (context.switch_state == 'map') map.invalidateSize().fitBounds();
                if (context.switch_state == 'by-vehicle') drawSmallMultiples();

                marey_map_pills.classed('active', dd => dd == context.switch_state);
            });

            function drawTotalChart() {
                var total_container = d3.select("#route-total-container");
                total_container.selectAll("*").remove();

                var total_barchart_container = total_container
                    .datum(transactions.total)
                    .html(d => route_total_card_template(d));

                var total_summary_container = total_barchart_container
                    .select(".route-total-summary")
                    .html(d => route_total_summary_template(d));

                total_barchart_container
                    .select("svg")
                    .each(function(d) {
                        var chart = barchart()
                            .date_extent(date_extent)
                            .maxY(totalMaxY)
                            .data(d.bar_data)
                            .brush_enabled(true)
                            .brush_extent(context.time_domain)
                            .onBrushChange(function(time_extent){
                                var map_segments = segmetsForMap(segments, seg_geo, context, time_extent);
                                map.drawSegments(map_segments);

                                var points = pointsForMap(transactions, time_extent);
                                map.drawPoints(points);

                                context.marey_chart.time_domain(time_extent);

                                renderSummary(transactions, time_extent, total_summary_container)
                            });
                        d3.select(this).call(chart);
                    });
            }


            function drawSmallMultiples() {
                var small_multiples_container = d3.select("#small-multiples");
                small_multiples_container.selectAll('*').remove();

                var vehicle_container = small_multiples_container.selectAll('div.vehicle-card-container')
                    .data(transactions.by_vehicles, function(d){return d.key})
                    .enter()
                    .append("div")
                    .attr("class", "vehicle-card-container col-12")
                    .html(d => vehicle_card_template(d));

                vehicle_container.select("svg")
                    .each(function(d){
                        var chart = barchart()
                            .date_extent(date_extent)
                            .data(d.bar_data)
                            .maxY(vehiclesMaxY)
                            .periods(gps_periods.get(d.key))
                            .out_periods(out_periods.get(route_str + "-" + d.key));
                        d3.select(this).call(chart);
                    });
            }
        });
}


function showMarey(segments, stops, time_domain) {
    var svg = d3.select("#marey-svg");
    svg.selectAll("*").remove();
    
    d3.select("#marey-legend-container").selectAll('*').remove();
    

    if (!segments || !segments.length) {
        console.log("No marey data for route ");
        return;
    }

    context.marey_chart = marey()
        .data(segments)
        .time_domain(time_domain)
        .stops_data(stops)
        .legend_container("#marey-legend-container");

    svg.call(context.marey_chart);
}


function segmetsForMap(segments, seg_geo, context, time_extent) {

    var alldir_segments = [];

    segments.values().forEach(v => Array.prototype.push.apply(alldir_segments, v));

    if (time_extent) {
        alldir_segments = alldir_segments.filter(d =>
            d.start_datetime >= time_extent[0]
            && d.start_datetime < time_extent[1]
        )
    }

    var segs = d3.nest()
        .key(d => d.stop_id)
        .rollup(leaves => d3.sum(leaves, vv => vv.transactions))
        .entries(alldir_segments);

    return segs.map(function(s){
        var geo = seg_geo.get(context.route_str).get(s.key)[0];

        return {
            type: "Feature",
            geometry: geo.geometry,
            properties: {
                transactions: s.value,
                stop_id: s.key,
                direction: geo.properties.direction
            }
        }
    }).filter(f => f.geometry.type == 'LineString');
}


function pointsForMap(transactions, time_extent) {
    var points = transactions.total.values.filter(d => d.lat != 'NA' && d.on_route =='0');

    if (time_extent) {
        points = points.filter(d =>
            d.datetime >= time_extent[0]
            && d.datetime < time_extent[1]
        )
    }

    return points;
}

function renderSummary(transactions, time_extent, container) {
    var tr = transactions.total.values;

    if (time_extent) {
        tr = transactions.total.values.filter(d =>
            d.datetime >= time_extent[0]
            && d.datetime < time_extent[1]
        )
    }

    var summary = calcSummary(tr);
    
    container.html(route_total_summary_template({summary: summary}));
}