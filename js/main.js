
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

var calendar_control = calendar()
    .onDateChange(function (date_str) {
        console.log(date_str);
        if (d3.event) {
            d3.event.preventDefault();
            // pills.classed("active", false);
            // d3.select(this).classed('active', true);
        }

        context.date_str = date_str;

        // d3.selectAll(".route-number-text").text(context.route_str);
        renderRoute(context.date_str, context.route_str);
    });

console.log("cal");
d3.select("body").call(calendar_control);


d3.select("#change-chart")
    .on('click', function(){
        context.switch_state = context.switch_state == 'map' ? 'marey' : 'map';

        d3.select(".marey-container").classed('hidden', context.switch_state != 'marey');
        d3.select("#map-container").classed('hidden', context.switch_state != 'map');

        d3.select(this).text(context.switch_state == 'map' ? 'Дивитись графік руху по зупинках' : 'Дивитись карту');

        if (context.switch_state == 'map') map.invalidateSize();
    });


// d3.select("#change-chart").datum({state: 'marey'}).on("click", function (d) {
//     console.log(d.state);
//     d.state = d.state == 'map' ? 'marey' : 'map';
//
//     d3.select(".marey-container").classed('hidden', d.state != 'marey');
//     d3.select("#map-container").classed('hidden', d.state != 'map');
//
//     d3.select(this).text(d.state == 'map' ? 'Дивитись графік руху по зупинках' : 'Дивитись карту');
//
//     renderRoute(date_str, route_str);
// });
var pills = d3.select("#route-pills")
    .selectAll("li")
    .data(all_routes)
    .enter()
    .append("li")
    .append("li")
    .attr("class", "nav-item")
    .append("a")
    .attr("class", "nav-link")
    .attr("href", "#")
    .text(d => d)
    .classed("active", (d, i) => i==0)
    .on("click", onRouteClick);


function onRouteClick(route_str) {
    if (d3.event) {
        d3.event.preventDefault();
        pills.classed("active", false);
        d3.select(this).classed('active', true);
    }

    context.route_str = route_str;

    d3.selectAll(".route-number-text").text(context.route_str);
    renderRoute(context.date_str, context.route_str);
}


function onDateClick(date_str) {
    if (d3.event) {
        d3.event.preventDefault();
        // pills.classed("active", false);
        // d3.select(this).classed('active', true);
    }

    context.date_str = date_str;

    // d3.selectAll(".route-number-text").text(context.route_str);
    renderRoute(context.date_str, context.route_str);
}


onRouteClick(all_routes[0]);

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

            // d3.select("#change-chart").datum({state: 'marey'}).on("click", function (d) {
            //     console.log(d.state);
            //     d.state = d.state == 'map' ? 'marey' : 'map';
            //
            //     d3.select(".marey-container").classed('hidden', d.state != 'marey');
            //     d3.select("#map-container").classed('hidden', d.state != 'map');
            //
            //     d3.select(this).text(d.state == 'map' ? 'Дивитись графік руху по зупинках' : 'Дивитись карту');
            //
            //     renderRoute(date_str, route_str);
            // });

            // d3.select("#route-pills")
            //     .select("li.nav-item a.nav-link")
            //     .each(function (route_fstr) {
            //         pills.classed("active", false);
            //         d3.select(this).classed('active', true);
            //         current_route_data = route_str;
            //         renderRoute(d);
            //     });


            // var nested = d3.nest()
            //     .key(function (d) {
            //         return d.vehicle
            //     })
            //     .entries(route_data.values);
            //
            // nested.sort(function(a,b){return b.values.length - a.values.length});
            //
            // nested.forEach(function(d){
            //     d.summary = calcSummary(d.values);
            // });

            // var total = {
            //     values: route_data.values,
            //     summary: calcSummary(route_data.values)
            // };

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



/////////////////////////////////////////////////////////////////////////////////////////////////////


//
// function prepareStopsData(stops) {
//     stops.forEach(r => {
//         r.id = +r.id;
//         r.direction = +r.direction;
//         r.fraction = +r.fraction;
//         r.priority = +r.priority;
//     });
//
//     stops = stops.filter(r => r.direction == 0);
//
//     return d3.nest()
//         .key(d => d.route)
//         .map(stops);
// }



// function calcSummary(d) {
//     var summary = {};
//
//     summary.total = d.length;
//     summary.cash = d.filter(function(dd){return dd.kind=="14"}).length;
//     summary.bank = d.filter(function(dd){return dd.kind=="32"}).length;
//     summary.pro = d.filter(function(dd){return ['16', '17'].indexOf(dd.kind) >= 0}).length;
//
//     summary.cash_pc = inpc(summary.cash/summary.total);
//     summary.bank_pc = inpc(summary.bank/summary.total);
//     summary.pro_pc = inpc(summary.pro/summary.total);
//
//     return summary;
// }




//
// function prepareTransactionsByRoute(transactions) {
//     transactions.forEach(function(d){d.datetime = new Date(d.datetime)});
//
//     return d3.nest()
//         .key(function(d){return d.route})
//         .sortKeys(d3.ascending)
//         .entries(transactions);
// }


// function prepareTransactions(transactions) {
//     transactions.forEach(function(d){d.datetime = new Date(d.datetime)});
// }
//


//
// function prepareSegData(data) {
//     data = data.filter(d => d.direction == '0');
//     data.forEach(r => {
//         r.direction = +r.direction;
//         r.transactions = +r.transactions;
//         r.chunk = +r.chunk;
//         r.fraction = +r.fraction;
//         r.start_datetime = new Date(r.start_datetime);
//         r.end_datetime = new Date(r.end_datetime);
//     });
//
//     // return d3.nest()
//     //     .key(row => row.route)
//     //     .map(data);
// }



// function prepareOutPeriods(out_periods) {
//     out_periods.forEach(d => {
//         d.start_datetime = new Date(d.start_datetime);
//         d.end_datetime = new Date(d.end_datetime);
//     });
//
//     return d3.nest()
//         .key(d => d.route + '-' + d.vehicle)
//         .map(out_periods);
// }



// function renderVehicle(container, d) {
//     var stats_container = container.append("div").attr("class", "col-3");
//
//     stats_container.append("span").text("Транзакцій: ");
//     stats_container.append("span").attr("class", "transactions").text(d.values.length);
//
//     stats_container.append("span").text("; Готівкою: ");
//     stats_container.append("span").attr("class", "cash").text(inpc(d.summary.cash/d.summary.total));
//
//     stats_container.append("span").text("; Проїзний: ");
//     stats_container.append("span").attr("class", "pro").text(inpc(d.summary.pro/d.summary.total));
//
//     stats_container.append("span").text("; Карткою: ");
//     stats_container.append("span").attr("class", "bank").text(inpc(d.summary.bank/d.summary.total));
// }
