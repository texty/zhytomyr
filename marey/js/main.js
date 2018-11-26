

d3.queue()
    // .defer(d3.csv, "data/transactions_geo/2018-08-06.csv")
    // .defer(d3.json, "data/routes_lines.geojson")
    .defer(d3.csv, "data/sample.csv")
    .defer(d3.csv, "data/stops.csv")
    .await(function(err, data, stops){
        if (err) throw err;

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

        // console.log(data);
        // console.log(route_data);
        // console.log(stops);

        var marey_chart = marey()
            .data(route_data.get('7A').filter(d=>d.direction == 0))
            .stops_data(stops_map.get('7A'));
        
        
        d3.select("#marey-svg").call(marey_chart);





    });

