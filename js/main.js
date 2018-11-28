
var inpc = d3.format(".0%");

var vehicle_card_template = Handlebars.compile($("#vehicle-card-template").html());
var route_total_card_template = Handlebars.compile($("#route-total-card-template").html());

d3.queue()
    .defer(d3.csv, "data/transactions_geo/2018-08-06.csv")
    .defer(d3.json, "data/routes_lines.geojson")
    .defer(d3.csv, "data/gps_periods/periods.csv")
    .defer(d3.csv, "data/out_periods/periods.csv")
    .defer(d3.csv, "data/sample.csv")
    .defer(d3.csv, "data/stops.csv")
    .await(function(err, transactions, routes, gps_periods, out_periods, data, stops){
        if (err) throw err;

        var by_route = prepareTransactionsByRoute(transactions);
        var periods_by_vehicle = prepareGpsPeriods(gps_periods);
        var out_periods_map = prepareOutPeriods(out_periods);
        var seg_data = prepareSegData(data);
        var stops_data = prepareStopsData(stops);

        var current_route_data;

        var pills = d3.select("#route-pills")
            .selectAll("li")
            .data(by_route)
            .enter()
            .append("li")
            .append("li")
            .attr("class", "nav-item")
            .append("a")
            .attr("class", "nav-link")
            .attr("href", "#")
            .text(function(d) {return d.key})
            .on("click", function(d){
                pills.classed("active", false);
                d3.select(this).classed('active', true);

                d3.selectAll(".route-number-text").text(d.key);
                current_route_data = d;
                renderRoute(d);
                d3.event.preventDefault();
            });

        d3.select("#change-chart").datum({state: 'marey'}).on("click",function(d){
            console.log(d.state);
            d.state = d.state=='map' ? 'marey' : 'map';

            d3.select(".marey-container").classed('hidden', d.state != 'marey');
            d3.select("#map-container").classed('hidden', d.state != 'map');

            d3.select(this).text(d.state == 'map' ? 'Дивитись графік руху по зупинках' : 'Дивитись карту');

            renderRoute(current_route_data)
        });

        d3.select("#route-pills")
            .select("li.nav-item a.nav-link")
            .each(function(d){
                pills.classed("active", false);
                d3.select(this).classed('active', true);
                current_route_data = d;
                renderRoute(d);
            });


        function renderRoute(route_data) {
            var nested = d3.nest()
                .key(function (d) {
                    return d.vehicle
                })
                .entries(route_data.values);

            nested.sort(function(a,b){return b.values.length - a.values.length});

            nested.forEach(function(d){
                d.summary = calcSummary(d.values);
            });

            var total = {
                values: route_data.values,
                summary: calcSummary(route_data.values)
            };

            var total_container = d3.select("#route-total-container");
            total_container.selectAll("*").remove();


            total_container
                .datum(total)
                .append("div").attr("class", "col-12")
                .html(d => route_total_card_template(d))
                .select('svg')
                .each(function(d){
                    var chart = barchart().data(total).maxY(200);
                    d3.select(this).call(chart);
                });


            var small_multiples_container = d3.select("#small-multiples");
            small_multiples_container.selectAll('*').remove();

            var switch_state = d3.select("#change-chart").datum().state;

            if  (switch_state == 'marey') {
                showMarey(current_route_data.key);
            }

            var vehicle_container = small_multiples_container.selectAll('div.vehicle-card-container')
                .data(nested, function(d){return d.key})
                .enter()
                .append("div")
                .attr("class", "vehicle-card-container col-12")
                .html(d => vehicle_card_template(d));

            vehicle_container.select("svg")
                .each(function(d){
                    var chart = barchart()
                        .data(d)
                        .periods(periods_by_vehicle.get(d.key))
                        .out_periods(out_periods_map.get(route_data.key + "-" + d.key));
                    d3.select(this).call(chart);
                });

            var line = routes.features.filter(function(d){
                return (d.properties.route == route_data.key) &&
                        (["trol", "tram", "bus"].indexOf(d.properties.tk) >=0 )
            })[0];
            
            console.log(line);

            map.showLine(line);
            map.drawPoints(route_data.values);
            map.invalidateSize();


            var calendar_control = calendar();
            d3.select("body").call(calendar_control)
        }


        function calcSummary(d) {
            var summary = {};

            summary.total = d.length;
            summary.cash = d.filter(function(dd){return dd.kind=="14"}).length;
            summary.bank = d.filter(function(dd){return dd.kind=="32"}).length;
            summary.pro = d.filter(function(dd){return ['16', '17'].indexOf(dd.kind) >= 0}).length;

            summary.cash_pc = inpc(summary.cash/summary.total);
            summary.bank_pc = inpc(summary.bank/summary.total);
            summary.pro_pc = inpc(summary.pro/summary.total);

            return summary;
        }


        function renderVehicle(container, d) {
            var stats_container = container.append("div").attr("class", "col-3");

            stats_container.append("span").text("Транзакцій: ");
            stats_container.append("span").attr("class", "transactions").text(d.values.length);

            stats_container.append("span").text("; Готівкою: ");
            stats_container.append("span").attr("class", "cash").text(inpc(d.summary.cash/d.summary.total));

            stats_container.append("span").text("; Проїзний: ");
            stats_container.append("span").attr("class", "pro").text(inpc(d.summary.pro/d.summary.total));

            stats_container.append("span").text("; Карткою: ");
            stats_container.append("span").attr("class", "bank").text(inpc(d.summary.bank/d.summary.total));
        }


        function showMarey(route) {
            var svg = d3.select("#marey-svg");
            svg.selectAll("*").remove();

            var marey_chart = marey()
                .data(seg_data.get(route).filter(d=>d.direction == 0))
                .stops_data(stops_data.get(route));

            svg.call(marey_chart);
        }


        function prepareTransactionsByRoute(transactions) {
            transactions.forEach(function(d){d.datetime = new Date(d.datetime)});

            return d3.nest()
                .key(function(d){return d.route})
                .sortKeys(d3.ascending)
                .entries(transactions);
        }

        function prepareGpsPeriods(gps_periods) {
            gps_periods.forEach(d => {
                d.start_datetime = new Date(d.start_datetime);
                d.end_datetime = new Date(d.end_datetime);
            });

            return d3.nest()
                .key(d => d.vehicle)
                .map(gps_periods);
        }

        function prepareOutPeriods(out_periods) {
            out_periods.forEach(d => {
                d.start_datetime = new Date(d.start_datetime);
                d.end_datetime = new Date(d.end_datetime);
            });

            return d3.nest()
                .key(d => d.route + '-' + d.vehicle)
                .map(out_periods);
        }

        function prepareSegData(data) {
            data = data.filter(d => d.direction == '0');
            data.forEach(r => {
                r.direction = +r.direction;
                r.transactions = +r.transactions;
                r.chunk = +r.chunk;
                r.fraction = +r.fraction;
                r.start_datetime = new Date(r.start_datetime);
                r.end_datetime = new Date(r.end_datetime);
            });

            return d3.nest()
                .key(row => row.route)
                .map(data);
        }

        function prepareStopsData(stops) {
            stops.forEach(r => {
                r.id = +r.id;
                r.direction = +r.direction;
                r.fraction = +r.fraction;
                r.priority = +r.priority;
            });

            stops = stops.filter(r => r.direction == 0);

            return d3.nest()
                .key(d => d.route)
                .map(stops);

        }
    });
