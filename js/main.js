d3.timeFormatDefaultLocale({
    "decimal": ".",
    "thousands": " ",
    "grouping": [3],
    "currency": ["грн", ""],
    "dateTime": "%a %b %e %X %Y",
    "date": "%d.%m.%Y",
    "time": "%H:%M:%S",
    "periods": ["AM", "PM"],
    "days": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    "shortDays": ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    "months": ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    "shortMonths": ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"]
});

var field_names_with_units_dictionary = {
    region: "Область",
    kind: "Тип",
    fuel: "Паливо",
    brand: "Модель",
    make_year: "Рік випуску",
    color: "Колір",
    capacity: "Об'єм (см³)",
    total_weight: "Повна маса (кг)"
};

var filter_names_dictionary = {
    region: "Область",
    kind: "Тип",
    fuel: "Паливо",
    brand: "Модель",
    make_year: "Рік випуску",
    color: "Колір",
    capacity: "Об'єм",
    total_weight: "Повна маса"
};

var total_chart = smallchart()
    .varName("n")
    .xTicks(10);

var small_multiples_chart = small_multiples();

var controls = {};

var all_possible_filters = [
    {id: 'region', generator: function(){return addListControl(filter_chain, "region", "Введіть область", data_provider.getRegionsData)}},
    {id: 'kind', generator: function(){return addListControl(filter_chain, "kind", "Введіть тип", data_provider.getFieldData)}},
    {id: 'fuel', generator: function(){return addListControl(filter_chain, "fuel", "Оберіть тип палива", data_provider.getFieldData)}},
    {id: 'brand', generator: function(){return addListControl(filter_chain, "brand", "Оберіть марку/модель", data_provider.getFieldData).max_selected(7)}},
    {id: 'make_year', generator: function(){return addListControl(filter_chain, "make_year", "Введіть рік випуску", data_provider.getFieldData)}},
    {id: 'capacity', generator: function(){return addRangeControl(filter_chain, "capacity", "Оберіть об'єм двигуна", "см³",  data_provider.getExtentData)}},
    {id: 'total_weight', generator: function(){return addRangeControl(filter_chain, "total_weight", "Повна маса", "кг", data_provider.getExtentData)}},
    {id: 'color', generator: function(){return addListControl(filter_chain, "color", "Оберіть колір", data_provider.getFieldData)}}
];

all_possible_filters.forEach(function(filter){filter.label = filter_names_dictionary[filter.id]});

var plus_button_control = addPlusButtonControl();

['region', 'kind', 'brand'].map(function(id){
    return all_possible_filters.filter(function(f){return f.id === id})[0];
}).forEach(function(filter) {controls[filter.id] = filter.generator()});

var badge_control = badges_control()
    .color_fields(["brand"])
    .display_value_dictionary({region: region_utils.REGION_SHORT_BY_CODE})
    .field_name_dictionary(field_names_with_units_dictionary);
d3.select("#badge_control").call(badge_control);

badge_control.onChange(function(change) {
    controls[change.field].uncheck(change.value);
});

filter_chain.triggerChange(-1);


filter_chain.onTimeseriesChange(function(query) {
    var region_query = query.filter(function(d){return d.field=="region"})[0];
    if (region_query && region_query.values && region_query.values.length)
        small_multiples_chart.filterRegions(region_query.values);
    else
        small_multiples_chart.filterRegions(null);

    badge_control.query(query).update();

    var brand_filter = query.filter(function(d) {return d.field === "brand"})[0];

    if (brand_filter) {
        data_provider.getTimeSeriesByQueryByRegionByBrand(query, function(err, data) {
            if (err) throw err;

            var brands = brand_filter.values;
            total_chart_legend.data(brands).update();

            small_multiples_chart
                .items(data.by_region)
                .update();

            total_chart.data(data.total).update();
        });

    } else {
        data_provider.getTimeSeriesByQueryByRegion(query, function(err, data) {
            if (err) throw err;

            total_chart_legend.data([]).update();

            small_multiples_chart
                .items(data.by_region)
                .update();

            total_chart.data(data.total).update();
        });
    }
});

data_provider.getTimeSeriesByQueryByRegion([], function(err, data ){
    if (err) throw err;

    total_chart
        .data(data.total);
    d3.select('#total_chart').call(total_chart);

    small_multiples_chart
        .items(data.by_region);
    d3.select("#small_multiples").call(small_multiples_chart);

    total_chart.update();
    small_multiples_chart.update();
    
    //
    // All is rendered for first time here

    d3.selectAll("svg.smallchart .axis--x .tick text")
        .filter(function(){return ["2017", "2018"].indexOf(this.innerHTML) >= 0})
        .style("font-weight", "bold");

    var el = document.getElementById("filter_chain");
    var sortable = Sortable.create(el, {
        handle: '.handle',
        animation: 0,
        draggable: '.chain_control',

        onUpdate: function(evt) {
            console.log("update");
            console.log(evt);
            filter_chain.reorder(evt.oldIndex, evt.newIndex);
        }
    });

});


function addListControl(filter_chain, field, placeholder, getFieldData) {

    var container = d3.select("#filter_chain")
        .append("div")
        .attr("class", "col-12 col-sm-6 col-md-4 col-lg-3 chain_control");

    updatePlusButton();

    var handle = container
        .append("i")
        .attr("class", "fas fa-arrows-alt handle")
        .attr("title", "Тягніть щоб змінити порядок фільтрів");

    var remove = container
        .append("i")
        .attr("class", "fas fa-trash-alt remove")
        .attr("title", "Видалити фільтр")
        .on("click", function(){
            var filter_position = $(".chain_control").index(container.node());
            console.log(filter_position);

            filter_chain.removeFilter(filter_position);
            delete controls[field];
            container.remove();
            plus_button_control.items(getVacantFilters()).update();
            updatePlusButton();
            console.log("remove");
        });

    var element = container
        .append("div")
        .attr("id", field);

    var control = list_control()
        .id(field)
        .placeholder(placeholder)
        .show_badges(true);
    
    element.call(control);
    
    filter_chain.addFilter({component: control, verb: "in", type: "simple", field: field,
        fetchNewData: function (query) {
            getFieldData(field, query, function(err, data) {
                if (err) throw err;

                control
                    .items(data)
                    .update();

                // badge_control.query(filter_chain.getCurrentQuery()).update();
            });
        }
    });

    plus_button_control.items(getVacantFilters()).update();

    return control;
}

function addRangeControl(filter_chain, field, placeholder, prefix, getFieldData) {
    var container = d3.select("#filter_chain")
        .append("div")
        .attr("class", "col-12 col-sm-6 col-md-4 col-lg-3 chain_control");

    updatePlusButton();

    var handle = container
        .append("i")
        .attr("class", "fas fa-arrows-alt handle")
        .attr("title", "Тягніть щоб змінити порядок фільтрів");

    var remove = container
        .append("i")
        .attr("class", "fas fa-trash-alt remove")
        .attr("title", "Видалити фільтр")
        .on("click", function(){
            var filter_position = $(".chain_control").index(container.node());
            console.log(filter_position);

            filter_chain.removeFilter(filter_position);
            delete controls[field];
            container.remove();
            plus_button_control.items(getVacantFilters()).update();
            badge_control.query(filter_chain.getCurrentQuery()).update();
            updatePlusButton();
            console.log("remove");
        });

    var element = container
        .append("div")
        .attr("id", field);

    var control = range_control()
        .id(field)
        .placeholder(placeholder)
        .prefix(prefix + " ")
        .step(50);

    element.call(control);

    filter_chain.addFilter({component: control, verb: "between", type: "simple", field: field,
        fetchNewData: function (query) {
            getFieldData(field, query, function(err, data) {
                if (err) throw err;

                control
                    .domain([data.min, data.max])
                    .empty_count(data.empty)
                    .total_count(data.total)
                    .update();

                // badge_control.query(filter_chain.getCurrentQuery()).update();
            });
        }
    });

    plus_button_control.items(getVacantFilters()).update();

    return control;
}

function addPlusButtonControl() {
    var element = d3.select("#filter_chain")
        .append("div")
        .attr("class", "col-12 col-sm-6 col-md-4 col-lg-3 plus-button-container");

    var control = add_filter_control()
        .placeholder("Оберіть тип нового фільтра")
        .items(getVacantFilters());

    control.onFilterSelected(function(filter_selected) {
        console.log(filter_selected);
        var new_filter = all_possible_filters.filter(function(f){return f.id === filter_selected.id})[0];
        controls[new_filter.id] = new_filter.generator();
        filter_chain.triggerChange(filter_chain.filterCount() - 2);
        plus_button_control.items(getVacantFilters()).update();
    });

    element.call(control);

    return control;
}

function getVacantFilters() {
    var visible_filters = Object.keys(controls);

    var vacant = all_possible_filters.filter(function(filter){
        return visible_filters.indexOf(filter.id) < 0
    });

    return vacant;
}

function export_button_click(){
    
    var query = filter_chain.getCurrentQuery();
    var brand_filter = query.filter(function(f){return f.field === "brand"})[0];

    var csvContent = "data:text/csv;charset=utf-8,";

    if (brand_filter) {
        data_provider.getDataForExportWithBrand(query, function(err, export_data) {
            csvContent += "period_start,period_end,region,brand,vehicles_registered\n" +
            export_data.map(function(obj){
                return [obj.period_start, obj.period_end, obj.region, obj.brand, obj.vehicles_registered].join(",");
            }).join("\n");
        });
        downloadCsvString(csvContent, "data.csv");
    } else {
        data_provider.getDataForExport(query, function(err, export_data) {
            csvContent += "period_start,period_end,region,vehicles_registered\n" +
            export_data.map(function(obj){
                return [obj.period_start, obj.period_end, obj.region, obj.vehicles_registered].join(",");
            }).join("\n");
        });
        downloadCsvString(csvContent, "data.csv");
    }
}

function downloadCsvString(csvContent, filename) {
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    link.innerHTML= "Click Here to download";
    document.body.appendChild(link); // Required for FF
    link.style.visibility = 'hidden';
    link.click();
}

function updatePlusButton() {
    var plus_button = d3.select("#filter_chain .plus-button-container");
    plus_button.raise();

    var plus_button_position = $("#filter_chain").find("> div").index(plus_button.node());
    plus_button.classed("hidden", plus_button_position > 7);
}
