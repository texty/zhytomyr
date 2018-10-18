var filter_chain = (function() {
    var module = {}
        , filters = []
        , query = []

        , on_change_counter = 0
        , dispatcher = d3.dispatch("timeseries-change")
        ;



    function onChange(filter_position) {
        console.log("Filter " + filter_position + " changed!!!!!!!!!");

        // Fetch new data for all subsequent filters (excluding current)
        fetchNewDataAfterIndex(filter_position);

        query = generateQueryForAllFilters();
        
        //call timeseries change
        dispatcher.call("timeseries-change", this, query);
    }

    function fetchNewDataAfterIndex(filter_position) {
        filters.forEach(function(filter_object, index) {
            if (index <= filter_position) return;

            var filters_for_query = filters.slice(0, index);
            filter_object.query = generateQuery(filters_for_query);
            filter_object.fetchNewData(filter_object.query);
        });
    }

    function fetchNewDataBetweenIndexes(start, end) {
        filters.forEach(function(filter_object, index) {
            if (index < start || index > end) return;

            var filters_for_query = filters.slice(0, index);
            filter_object.query = generateQuery(filters_for_query);
            filter_object.fetchNewData(filter_object.query);
        });
    }

    module.addFilter = function(filter_object) {
        if (!arguments.length) return;
        
        filters.push(filter_object);
        filter_object.position = filters.length - 1;

        filter_object.component.onChange(function(){
            var current_position = filter_object.position;
            return onChange(current_position)
        });

        return module;
    };

    module.removeFilter = function(idx) {
        if (!arguments.length) return;
        
        var this_filter = filters[idx];
        
        filters.splice(idx, 1);
        filters.forEach(function(filter_object, index) {
            filter_object.position = index;
        });
        
        if (!this_filter.component.isInDefaultState()) {
            fetchNewDataAfterIndex(idx - 1);
            query = generateQueryForAllFilters();
            //call timeseries change
            dispatcher.call("timeseries-change", this, query);
        }

        return module;
    };

    module.reorder = function(old_index, new_index) {
        if (!arguments.length) return;
        if (old_index == new_index) return;

        // perform a move
        var old = filters[old_index];

        var iterate_change = old_index < new_index ? +1 : -1;
        for (var i = old_index; i !== new_index; i += iterate_change) {
            filters[i] = filters[i + iterate_change];
        }
        filters[new_index] = old;

        // also update position field
        filters.forEach(function(filter_object, index) {filter_object.position = index});

        // trigger filter data update (only for filter between old and new index)
        var start, end;
        if (old_index < new_index) {
            start = old_index;
            end = new_index;
        } else {
            start = new_index;
            end = old_index;
        }

        fetchNewDataBetweenIndexes(start, end);
        return module;
    };


    module.onTimeseriesChange = function(value) {
        if (!arguments.length) return module;
        dispatcher.on("timeseries-change." + ++on_change_counter, value);
        return module;
    };
    
    module.triggerChange = function(index) {
        onChange(index);
        return module;  
    };
    
    module.filterCount = function(){
        return filters.length;
    };

    module.getCurrentQuery = function() {
        return generateQueryForAllFilters();
    };

    function generateQueryForAllFilters() {
        return generateQuery(filters)
    }

    function generateQuery(filters_array) {
        var query = [];

        filters_array.forEach(function(filter_object) {
            var filter_query = generateFilterQuery(filter_object);

            if (filter_query) query.push(filter_query);
        });

        return query;
    }

    function generateFilterQuery(filter_object) {
        if (filter_object.type === "simple") {
            if (filter_object.verb === "in") {
                var data = filter_object.component.selected();

                if (!data.length) return null;

                return {
                    type: "simple",
                    verb: "in",
                    field: filter_object.field,
                    values: data
                }
            } else if (filter_object.verb === "between") {
                var extent = filter_object.component.selectedExtent();
                var show_empty = filter_object.component.show_empty();

                if (!extent.length && show_empty) return null;

                return {
                    type: "simple",
                    verb: "between",
                    field: filter_object.field,
                    values: {extent: extent, show_empty: show_empty}
                }

            } else throw "filter verb is unknown";

        } else if (filter_object.type === "combined") {
            return {
                type: "combined",
                filters: filter_object.component.getCombinedFilters()
            }
        } else throw "Filter type is unknown";
    }

    return module;
})();