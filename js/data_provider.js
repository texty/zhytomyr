var data_provider = (function() {
    var module = {};
    

    module.getGpsPeriods = function(date_str, cb) {
        return module.cache_xhr(d3.csv, 'data/' + date_str + "/gps_periods.csv", function(gps_periods){
            gps_periods.forEach(d => {
                d.start_datetime = new Date(d.start_datetime);
                d.end_datetime = new Date(d.end_datetime);
            });

            return d3.nest()
                .key(d => d.vehicle)
                .map(gps_periods);

        }, cb);
    };


    module.getOutPeriods = function(date_str, cb) {
        return module.cache_xhr(d3.csv, 'data/' + date_str + "/out_periods.csv", function(out_periods){
            out_periods.forEach(d => {
                d.start_datetime = new Date(d.start_datetime);
                d.end_datetime = new Date(d.end_datetime);
            });

            return d3.nest()
                .key(d => d.route + '-' + d.vehicle)
                .map(out_periods);

        }, cb);
    };

    module.getTransactions = function(date_str, route_str, cb) {
        return module.cache_xhr(d3.csv, 'data/' + date_str + "/routes/" +
                                route_str + "/transactions.csv", function(transactions){

            transactions.forEach(d => d.datetime = new Date(d.datetime))

            var result = {
                total: {
                    values: transactions,
                    bar_data: toBarData(transactions, time_floor),
                    summary: calcSummary(transactions)
                }
            };

            var by_vehicles = d3.nest()
                .key(function(d){return d.vehicle})
                .entries(transactions);

            by_vehicles.sort((a,b) => b.values.length - a.values.length);
            by_vehicles.forEach(function(d){ 
                d.summary = calcSummary(d.values);
                d.bar_data = toBarData(d.values, time_floor);
            });
            
            result.by_vehicles = by_vehicles;

            return result;
        }, cb);
        
        
        function toBarData(values, time_aggr_fun) {
            values.forEach(function(d){
                d.date_f = time_aggr_fun(new Date(d.datetime));
            });

            var bar_data = d3.nest()
                .key(d => d.date_f)
                .rollup(leaves => leaves.length)
                .entries(values);

            bar_data.forEach(d => d.date_f = new Date(d.key));

            return bar_data;
        }

        function time_floor(date) {
            const band = 10;

            date = moment(date);
            return date.minute(Math.floor(date.minute() / band) * band).second(0).toDate();
        }
    };


    module.getSegments = function(date_str, route_str, cb) {
        return module.cache_xhr(d3.csv, 'data/' + date_str + "/routes/" +
            route_str + "/segments.csv", function(segments){

            segments.forEach(r => {
                r.direction = +r.direction;
                r.transactions = +r.transactions;
                r.chunk = +r.chunk;
                r.fraction = +r.fraction;
                r.start_datetime = new Date(r.start_datetime);
                r.end_datetime = new Date(r.end_datetime);
            });

            return d3.nest()
                .key(d => d.direction)
                .map(segments);

        }, cb);
    };


    module.getStops = function(cb) {
        return module.cache_xhr(d3.csv, 'data/stops.csv', function(stops){

            stops.forEach(r => {
                r.id = +r.id;
                r.direction = +r.direction;
                r.fraction = +r.fraction;
                r.priority = +r.priority;
            });

            return {
                by_route_dir: d3.nest()
                    .key(d => d.route)
                    .key(d => d.direction)
                    .map(stops),

                by_id: d3.nest()
                    .key(d => d.id)
                    .map(stops)
            }
        }, cb);
    };
    

    module.getRouteLines = function(cb) {
        return module.cache_xhr(d3.json, 'data/route_lines.geojson', function(feature_collection){

            return d3.nest()
                .key(d => d.properties.route)
                .map(feature_collection.features);
        }, cb);
    };


    module.getHeatmap = function(cb) {
        return module.cache_xhr(d3.csv, 'data/heatmap.csv', function(heatmap){

            heatmap.forEach(function(row){
                row.n = +row.n;
            });

            var by_date = d3.nest()
                .key(d => d.date)
                .rollup(v => d3.sum(v, d => d.n))
                .map(heatmap);

            var by_date_route = d3.nest()
                .key(d => d.date)
                .key(d => d.route)
                .rollup(v => d3.sum(v, d => d.n))
                .map(heatmap);

            return {
                by_date: by_date,
                by_date_route: by_date_route
            }
        }, cb);
    };

    
    module.getDailySegments = function(cb) {
        return module.cache_xhr(d3.csv, 'data/daily_segments.csv', function(segments){

            segments = segments.map(function(s){
                return {
                    type: "Feature",
                    geometry: JSON.parse(s.geometry),
                    properties: {
                        route: s.route,
                        date: s.date,
                        stop_id: s.stop_id,
                        direction: s.direction,
                        transactions: s.transactions
                    }
                };
            });

            return d3.nest()
                .key(d => d.properties.date)
                .key(d => d.properties.route)
                .map(segments);
        }, cb);
    };


    module.getSegmentGeometries = function(cb) {
        return module.cache_xhr(d3.csv, 'data/segments_geo.csv', function(segments){

            segments = segments.map(function(s){
                return {
                    type: "Feature",
                    geometry: JSON.parse(s.geometry),
                    properties: {
                        route: s.route,
                        stop_id: s.stop_id,
                        direction: s.direction
                    }
                };
            });

            return d3.nest()
                .key(d => d.properties.route)
                .key(d => d.properties.stop_id)
                .map(segments);
        }, cb);
    };

    var xhr_cache = {};
    module.cache_xhr = function(method, param1, postprocess, cb) {
        if (xhr_cache[param1]) return cb(null, xhr_cache[param1]);

        return method(param1, function(err, data) {
            if (err) throw err;

            var processed = postprocess ? postprocess(data) : data;

            xhr_cache[param1] = processed;
            return cb(err, processed);
        })
    };
    
    return module;
})();



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