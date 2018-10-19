
var inpc = d3.format(".0%");

d3.queue()
    .defer(d3.csv, "data/transactions_geo/2018-08-06.csv")
    .defer(d3.json, "data/routes_lines.geojson")
    .await(function(err, transactions, routes){
        if (err) throw err;

        transactions.forEach(function(d){d.DATE = new Date(d.DATE)});

        var nested = d3.nest()
            .key(function (d) {
                return d.VEHICLE
            })
            .entries(transactions);

        console.log(transactions)
        window.transactions = transactions;
        window.routes = routes;

        var by_kind = d3.nest()
            .key(function(d){return d.KIND})
            .entries(transactions);

        window.colorScale = d3.scaleOrdinal()
            .range(d3.schemeCategory20.slice(1,1+15))
            .domain(by_kind.map(function(d){return d.key}));


        var by_route = d3.nest()
            .key(function(d){return d.ROUTE})
            .sortKeys(d3.ascending)
            .entries(transactions);


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
                console.log(d)
                renderRoute(d)
            });

        d3.select("#route-pills")
            .select("li.nav-item a.nav-link")
            .each(function(d){
                pills.classed("active", false);
                d3.select(this).classed('active', true);
                console.log(d)
                renderRoute(d)
            });

        function renderRoute(route_data) {
            var nested = d3.nest()
                .key(function (d) {
                    return d.VEHICLE
                })
                .entries(route_data.values);

            nested.sort(function(a,b){return b.values.length - a.values.length});

            nested.forEach(function(d){
                d.total = d.values.length;
                d.cash = d.values.filter(function(dd){return dd.KIND=="14"}).length;
                d.bank = d.values.filter(function(dd){return dd.KIND=="32"}).length;
                d.pro = d.values.filter(function(dd){return ['16', '17'].indexOf(dd.KIND) >= 0}).length;
            });


            var small_multiples_container = d3.select("#small-multiples")
            small_multiples_container.selectAll('*').remove();

            var swarm_container = small_multiples_container.selectAll('div.swarm-svg-container')
                .data(nested, function(d){return d.key})
                .enter()
                .append("div")
                .attr("class", "swarm-svg-container col-12");

            swarm_container.append("span").text("Трекер: ");
            swarm_container.append("span").attr("class", "tracker").text(function(d){return d.key});

            swarm_container.append("span").text("; Транзакцій: ");
            swarm_container.append("span").attr("class", "transactions").text(function(d){return d.values.length});

            swarm_container.append("span").text("; Готівкою: ");
            swarm_container.append("span").attr("class", "cash").text(function(d){return inpc(d.cash/d.total)});

            swarm_container.append("span").text("; Проїзний: ");
            swarm_container.append("span").attr("class", "pro").text(function(d){return inpc(d.pro/d.total)});

            swarm_container.append("span").text("; Карткою: ");
            swarm_container.append("span").attr("class", "bank").text(function(d){return inpc(d.bank/d.total)});


            swarm_container.append("svg")
                .attr("width", "100%")
                .attr("data-min-height", "100")
                // .attr("data-aspect-ratio", "0.5")
                .each(function(d){
                    var chart = beechart().data(d);
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
    });
