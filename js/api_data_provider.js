var data_provider = (function() {
    var module = {};
    
    const API_HOST = "http://localhost:5000";
    // const API_HOST = "http://api-x32.texty.org.ua";

    // Повинні бути початком місяця!!!!
    const dates_extent = ['2013-01-01', '2018-07-01'];
    const all_possible_months = monthsInRange(dates_extent[0], dates_extent[1]);
    

    Object.keys(region_utils.REGION_BY_CODE).forEach(function(code) {
        var val = region_utils.REGION_BY_CODE[code];
        val.short_name = val.name.replace(" область", "");
    });


    var getFieldData_xhr = {};
    module.getFieldData = function(field, query, cb) {
        if (getFieldData_xhr[field]) getFieldData_xhr[field].abort();

        var query_str = encodeURI(JSON.stringify(query));

        getFieldData_xhr[field] = cached_fetch_json(API_HOST + "/api/field/" + field + "?json=" + query_str , function(err, data){
            if (err) throw err;

            data.forEach(function(row){
                row.n = +row.n;
                row.id = row[field];
                row.label = row.id;
                row.badge = +row.n;
            });

            return cb(err, data);
        });
    };

    var getExtentData_xhr = {};
    module.getExtentData = function(field, query, cb) {
        if (getExtentData_xhr[field]) getExtentData_xhr[field].abort();

        var query_str = encodeURI(JSON.stringify(query));

        getExtentData_xhr[field] = cached_fetch_json(API_HOST + "/api/extent/" + field + "?json=" + query_str , function(err, data){
            if (err) throw err;
            
            var result = data[0];
            result.empty = result.total - result.nonempty;
            
            return cb(err, result);
        });
    };

    var getRegionsData_xhr;
    module.getRegionsData = function(field, query, cb) {
        //todo ignoring field parameter. We need it only for shared interface
        if (getRegionsData_xhr) getRegionsData_xhr.abort();

        var query_str = encodeURI(JSON.stringify(query));
        
        getRegionsData_xhr = cached_fetch_json(API_HOST + "/api/regions?json=" + query_str , function(err, data){
            if (err) throw err;

            data.forEach(function(row){
                row.n = +row.n;
                row.id = row.code;
                row.label = row.short_name;
                row.badge = +row.n;
                delete row.code;
            });

            return cb(err, data);
        });
    };
    

    var getTimeSeriesByQueryByRegion_xhr;
    module.getTimeSeriesByQueryByRegion = function(query, cb) {
        if (getTimeSeriesByQueryByRegion_xhr) getTimeSeriesByQueryByRegion_xhr.abort();

        var query_str = encodeURI(JSON.stringify(query));

        getTimeSeriesByQueryByRegion_xhr = cached_fetch_json(API_HOST +  "/api/timeseries/query?json=" + query_str, function(err, data){
            if (err) throw err;

            data.total = [{key: "total", values: mapTimeseriesToObject(data.total)}];

            Object.keys(data.by_region).forEach(function(region) {
                data.by_region[region] = mapTimeseriesToObject(data.by_region[region]);
            });

            data.by_region = Object.keys(data.by_region).map(function(region) {
                return {
                    region: region_utils.REGION_BY_CODE[region],
                    timeseries: [{key: "total", values: data.by_region[region]}],
                    total: d3.sum(data.by_region[region], function(obj) {return obj.n})
                }
            });

            data.by_region.sort(function(a,b){return b.total - a.total});

            return cb(err, data);
        });

        return;
    };

    var getTimeSeriesByQueryByRegionByBrand_xhr;
    module.getTimeSeriesByQueryByRegionByBrand = function(query, cb) {
        if (getTimeSeriesByQueryByRegionByBrand_xhr) getTimeSeriesByQueryByRegionByBrand_xhr.abort();

        var query_str = encodeURI(JSON.stringify(query));

        getTimeSeriesByQueryByRegionByBrand_xhr = cached_fetch_json(API_HOST +  "/api/timeseries/queries?json=" + query_str, function(err, data){
            if (err) throw err;

            var brands_order = query.filter(function(filter){return filter.field === "brand"})[0].values;

            var total_timeseries = [];
            Object.keys(data.total).forEach(function(brand){
                total_timeseries.push({
                    key: brand,
                    values: mapTimeseriesToObject(data.total[brand])
                });
            });
            total_timeseries.sort(function(a,b){return brands_order.indexOf(a.key) - brands_order.indexOf(b.key)});

            data.total = total_timeseries;

            data.by_region = Object.keys(data.by_region).map(function(region) {
                var region_data = {
                    region: region_utils.REGION_BY_CODE[region],
                    timeseries: [],
                    total: 0
                };

                Object.keys(data.by_region[region]).forEach(function (brand) {
                    region_data.timeseries.push({
                        key: brand,
                        values: mapTimeseriesToObject(data.by_region[region][brand])
                    });
                    region_data.total += d3.sum(data.by_region[region][brand]);

                    region_data.timeseries.sort(function(a,b){return brands_order.indexOf(a.key) - brands_order.indexOf(b.key)});
                });

                return region_data;
            });

            return cb(err, data);
        });

        return;
    };

    module.getDataForExport= function(query, cb) {
        return module.getTimeSeriesByQueryByRegion(query, function(err, data){
            var export_data = [];
            
            data.by_region.forEach(function(region_data){
                var region = region_data.region.short_name;

                var append_chunk = region_data.timeseries[0].values.map(function(row){
                var month_str = row.month.toISOString().substr(0, 10);
                    return {
                        region: region,
                        month: month_str,
                        vehicles_registered: row.n
                    }
                });

                Array.prototype.push.apply(export_data, append_chunk);
            });

            cb(err, export_data);
        });
    };


    module.getDataForExportWithBrand = function(query, cb) {
        return module.getTimeSeriesByQueryByRegionByBrand(query, function(err, data){
            var export_data = [];

            data.by_region.forEach(function(region_data){
                var region = region_data.region.short_name;

                region_data.timeseries.forEach(function(brand_data) {
                    var append_chunk = brand_data.values.map(function(row){
                        var month_str = row.month.toISOString().substr(0, 10);
                        return {
                            region: region,
                            brand: brand_data.key,
                            month: month_str,
                            vehicles_registered: row.n
                        }
                    });

                    Array.prototype.push.apply(export_data, append_chunk);
                });
            });

            cb(err, export_data);
        });
    };




    function calculateTotal(by_region) {
        var array_of_arrays = by_region
            .map(function(region_data){ return region_data.timeseries });

        return sumArrays(array_of_arrays);
    }


    function sumArrays(array_of_arrays) {
        if (!array_of_arrays) return;
        if (array_of_arrays.length < 2) return array_of_arrays[0];

        var first = array_of_arrays[0];
        var rest = array_of_arrays.slice(1);

        return first.map(function(obj, i) {
            return sumFunction(obj, rest.map(function(arr) {return arr[i]}));
        })
    }

    function sumFunction(first, rest) {
        return {
            month: first.month,
            n: first.n + d3.sum(rest, function(d){return d.n})
        }
    }

    function fillRegions(by_region, regions) {
        if (!regions || !regions.length) regions = Object.keys(region_utils.REGION_BY_CODE);

        regions.forEach(function(region){
            var region_data = by_region.filter(function(obj){return region === obj.key})[0];
            if (!region_data) {
                region_data = {
                    key: region,
                    value: fillDates([], dates_extent)
                };

                region_data.value.forEach(function(row){
                    row.month = new Date(row.month);
                });

                by_region.push(region_data);
            }
        });
    }

    function mapTimeseriesToObject(timeseries) {
        return timeseries.map(function(n,i){
            return {
                month: new Date(all_possible_months[i]),
                n: n
            }
        })
    }

    function fillWithZeros(ordered_data, varName, step) {
        var extent = d3.extent(ordered_data, function(d){return d[varName]});

        var repaired = [];
        var idx = 0;

        var val;

        for (val = extent[0]; val <= extent[1]; val += step) {
            if (ordered_data[idx][varName] === val) {
                repaired.push(ordered_data[idx]);
                idx++;
            } else {
                var obj = {n: 0};
                obj[varName] = val;
                repaired.push(obj);
            }
        }

        return repaired;
    }

    var xhr_cache = {};
    function cached_fetch_json(uri, cb) {
        if (xhr_cache[uri]) return cb(null, JSON.parse(JSON.stringify(xhr_cache[uri])));
        
        return d3.json(uri, function(err, data) {
            if (err) throw err;
            
            xhr_cache[uri] = data;
            return cb(err, JSON.parse(JSON.stringify(data)));
        })
    }

    return module;
})();