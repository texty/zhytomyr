
var inpc = d3.format(".0%");

// var source = $("#parking-card-template").html();
// var template = Handlebars.compile(source);



d3.queue()
    .defer(d3.csv, "data/transactions_geo/2018-08-06.csv")
    .defer(d3.json, "data/routes_lines.geojson")
    .defer(d3.csv, "data/gps_periods/periods.csv")
    .defer(d3.csv, "data/out_periods/periods.csv")
    .defer(d3.csv, "data/sample.csv")
    .defer(d3.csv, "data/stops.csv")
    .await(function(err, transactions, routes, periods, out_periods, data, stops){
        if (err) throw err;

        transactions.forEach(function(d){d.datetime = new Date(d.datetime)});

        var nested = d3.nest()
            .key(function (d) {
                return d.vehicle
            })
            .entries(transactions);

        console.log(transactions);
        window.transactions = transactions;
        window.routes = routes;

        periods.forEach(d => {
            d.start_datetime = new Date(d.start_datetime);
            d.end_datetime = new Date(d.end_datetime);
        });

        out_periods.forEach(d => {
            d.start_datetime = new Date(d.start_datetime);
            d.end_datetime = new Date(d.end_datetime);
        });

        var by_kind = d3.nest()
            .key(function(d){return d.kind})
            .entries(transactions);

        window.colorScale = d3.scaleOrdinal()
            .range(d3.schemeCategory20.slice(1,1+15))
            .domain(by_kind.map(function(d){return d.key}));


        var by_route = d3.nest()
            .key(function(d){return d.route})
            .sortKeys(d3.ascending)
            .entries(transactions);


        var periods_by_vehicle = d3.nest()
            .key(d => d.vehicle)
            .map(periods);

        var out_periods_map = d3.nest()
            .key(d => d.route + '-' + d.vehicle)
            .map(out_periods);

        var pills = d3.select("#route-pills")
            .selectAll("li")
            .data(by_route)
            .enter()
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
                window.route_d = d;
                renderRoute(d);
                d3.event.preventDefault();
            });

        d3.select("#change-chart").datum({state: "bar"}).on("click",function(d){
            console.log(d.state);
            d.state = d.state=='bar' ? 'marey' : 'bar';

            d3.select(".marey-container").classed('hidden', d.state != 'marey');
            d3.select(".bars-container").classed('hidden', d.state != 'bar');

            d3.select(this).text(d.state == 'bar' ? 'Натисніть щоб досліджувати рух по зупинках' : 'Натисніть щоб дивитись статистику по машинах')

            renderRoute(route_d)
        });

        d3.select("#route-pills")
            .select("li.nav-item a.nav-link")
            .each(function(d){
                pills.classed("active", false);
                d3.select(this).classed('active', true);
                console.log(d);
                window.route_d = d;
                renderRoute(d);
            });


        data = data.filter(d => d.direction == '0');
        data.forEach(r => {
            r.direction = +r.direction;
            r.transactions = +r.transactions;
            r.chunk = +r.chunk;
            r.fraction = +r.fraction;
            r.start_datetime = new Date(r.start_datetime);
            r.end_datetime = new Date(r.end_datetime);
        });

        stops.forEach(r => {
            r.id = +r.id;
            r.direction = +r.direction;
            r.fraction = +r.fraction;
            r.priority = +r.priority;
        });

        stops = stops.filter(r => r.direction == 0);

        var stops_map = d3.nest()
            .key(d => d.route)
            .map(stops);

        var route_data = d3.nest()
            .key(row => row.route)
            .map(data);





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
            total_container.selectAll("*").remove()
            renderVehicle(total_container, total);

            total_container
                .append("div")
                .datum(total)
                .attr("class", "col-9")
                .append("svg")
                .attr("width", "100%")
                .attr("data-min-height", "65")
                // .attr("data-aspect-ratio", "0.5")
                .each(function(d){
                    var chart = barchart().data(total).maxY(200);
                    d3.select(this).call(chart);
                });


            var small_multiples_container = d3.select("#small-multiples");
            small_multiples_container.selectAll('*').remove();

            if (d3.select("#change-chart").datum().state == 'marey') {
                showMarey(route_d.key);
                return;
            }


            var vehicle_container = small_multiples_container.selectAll('div.swarm-svg-container')
                .data(nested, function(d){return d.key})
                .enter()
                .append("div")
                .attr("class", "swarm-svg-container col-12")
                .append("div")
                .attr("class", "row");

            var stats_container = vehicle_container.append("div").attr("class", "col-3");

            stats_container.append("span").text("№ ");
            stats_container.append("span").attr("class", "tracker").text(function(d){return d.key});

            stats_container.append("span").text("; Транзакцій: ");
            stats_container.append("span").attr("class", "transactions").text(function(d){return d.values.length})//.append("br");

            stats_container.append("span").text("; Готівкою: ");
            stats_container.append("span").attr("class", "cash").text(function(d){return inpc(d.summary.cash/d.summary.total)});

            stats_container.append("span").text("; Проїзний: ");
            stats_container.append("span").attr("class", "pro").text(function(d){return inpc(d.summary.pro/d.summary.total)});

            stats_container.append("span").text("; Карткою: ");
            stats_container.append("span").attr("class", "bank").text(function(d){return inpc(d.summary.bank/d.summary.total)});


            vehicle_container
                .append("div")
                .attr("class", "col-9")
                .append("svg")
                .attr("width", "100%")
                .attr("data-min-height", "65")
                // .attr("data-aspect-ratio", "0.5")
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



        }


        function calcSummary(transactions) {
            var summary = {};
            summary.total = transactions.length;
            summary.cash = transactions.filter(function(dd){return dd.kind=="14"}).length;
            summary.bank = transactions.filter(function(dd){return dd.kind=="32"}).length;
            summary.pro = transactions.filter(function(dd){return ['16', '17'].indexOf(dd.kind) >= 0}).length;

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
                .data(route_data.get(route).filter(d=>d.direction == 0))
                .stops_data(stops_map.get(route));

            svg.call(marey_chart);



        }
    });
