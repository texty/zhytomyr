
var inpc = d3.format(".0%");
// var date_format = d3.format("%Y-%m-%d");

var vehicle_card_template = Handlebars.compile($("#vehicle-card-template").html());
var route_total_card_template = Handlebars.compile($("#route-total-card-template").html());

var context = {
    date_str: '2018-08-06',
    route_str: '1',
    switch_state: 'marey',
    direction: '0',
    time_extent: null
};

var all_routes = ['1', '2', '3', '4', '4A', '5A','6', '7', '7A', '8', '9', '10', '12', '15A', '53', '53A',
    '91', 'H2', 'H3', 'H4', 'H5', 'H7'];


var route_picker = route_picker()
    .data(all_routes)
    .onChange(function(route_str){
        context.route_str = route_str;

        d3.selectAll(".route-number-text").text(context.route_str);
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

    calendar_control.selected_date(context.date_str);
});

route_picker.route(context.route_str, true);


d3.select("#change-chart")
    .on('click', function(){
        context.switch_state = context.switch_state == 'map' ? 'marey' : 'map';

        d3.select(".marey-container").classed('hidden', context.switch_state != 'marey');
        d3.select("#map-container").classed('hidden', context.switch_state != 'map');
        if (context.switch_state == 'map') map.invalidateSize().fitBounds();

        d3.select(this).text(context.switch_state == 'map' ? 'Дивитись графік руху по зупинках' : 'Дивитись карту');

    });

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
            
            var date_start = new Date(date_str + " 00:00");
            var date_end = new Date(date_start);
            date_end.setDate(date_start.getDate() + 1);

            var date_extent = [date_start, date_end];

            context.time_domain = d3.extent(transactions.total.values, d => d.datetime);
            
            if  (context.switch_state == 'marey') {
                showMarey(segments.get(context.direction), stops.by_route_dir.get(context.route_str).get(context.direction), context.time_domain);
            }

            var total_container = d3.select("#route-total-container");
            total_container.selectAll("*").remove();

            console.log(transactions);
            var totalMaxY = d3.max(transactions.total.bar_data, d => d.value);
            var vehiclesMaxY = d3.max(transactions.by_vehicles, veh => d3.max(veh.bar_data, d => d.value));

            console.log(totalMaxY);
            console.log(vehiclesMaxY);

            var total_barchart_container = total_container
                .datum(transactions.total)
                .append("div").attr("class", "col-12")
                .append("div").attr("class", "row");

            var total_summary_container = total_barchart_container
                .append("div").attr("class", "route-total-summary")
                .html(d => route_total_card_template(d));
                
            total_barchart_container.append("div").attr("class", "col-12")
                .append("svg")
                .attr("width", "100%").attr("data-min-height", 65).attr("height", 65).attr("class", "dark-bg")
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
            

            var line = lines.get(route_str);
            map.showLine(line);

            var points = pointsForMap(transactions);
            map.drawPoints(points);


            var map_segments = segmetsForMap(segments, seg_geo, context);
            map.drawSegments(map_segments);

            map.invalidateSize().fitBounds();
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
    
    container.html(route_total_card_template({summary: summary}));
}