
var inpc = d3.format(".0%");
// var date_format = d3.format("%Y-%m-%d");

var vehicle_card_template = Handlebars.compile($("#vehicle-card-template").html());
var route_total_card_template = Handlebars.compile($("#route-total-card-template").html());

var context = {
    date_str: '2018-08-06',
    route_str: '1',
    switch_state: 'marey'
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

        d3.select(this).text(context.switch_state == 'map' ? 'Дивитись графік руху по зупинках' : 'Дивитись карту');

        if (context.switch_state == 'map') map.invalidateSize();
    });



function renderRoute(date_str, route_str) {
    d3.queue()
        .defer(data_provider.getTransactions.bind(this, date_str, route_str))
        .defer(data_provider.getSegments.bind(this, date_str, route_str))
        .defer(data_provider.getGpsPeriods.bind(this, date_str))
        .defer(data_provider.getOutPeriods.bind(this, date_str))
        .defer(data_provider.getRouteLines)
        .defer(data_provider.getStops)
        .await(function (err, transactions, segments, gps_periods, out_periods, lines, stops) {
            if (err) throw err;

            var date_start = new Date(date_str + " 00:00");
            var date_end = new Date(date_start);
            date_end.setDate(date_start.getDate() + 1);

            var date_extent = [date_start, date_end];

            // console.log(date_extent)

            var total_container = d3.select("#route-total-container");
            total_container.selectAll("*").remove();

            total_container
                .datum(transactions.total)
                .append("div").attr("class", "col-12")
                .html(d => route_total_card_template(d))
                .select('svg')
                .each(function(d) {
                    var chart = barchart()
                        .date_extent(date_extent)
                        .maxY(200)
                        .data(d);
                    d3.select(this).call(chart);
                });


            var small_multiples_container = d3.select("#small-multiples");
            small_multiples_container.selectAll('*').remove();

            if  (context.switch_state == 'marey') {
                showMarey(segments.get('0'), stops.get(context.route_str).get('0'));
            }

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
                        .data(d)
                        .periods(gps_periods.get(d.key))
                        .out_periods(out_periods.get(route_str + "-" + d.key));
                    d3.select(this).call(chart);
                });
            

            var line = lines.get(route_str);

            map.showLine(line);
            map.drawPoints(transactions.total.values);
            map.invalidateSize();
        });
}

function showMarey(segments, stops) {
    var svg = d3.select("#marey-svg");
    svg.selectAll("*").remove();

    if (!segments || !segments.length) {
        console.log("No marey data for route ");
        return;
    }

    var marey_chart = marey()
        .data(segments)
        .stops_data(stops);

    svg.call(marey_chart);
}
