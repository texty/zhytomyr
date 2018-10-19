function small_multiples() {

    var items
        , create_item = noop
        , update_item = noop
        , item_object_generator = noop
        , charts = []
        , parent_container
        ;

    function my(selection) {
        selection.each(function() {

            parent_container = d3.select(this);
            var item_containers = parent_container
                .selectAll("div.small_multiples_item")
                .data(items, function(d){return d.region.code})
                .enter()
                .append("div")
                .attr("class", "small_multiples_item col-6 col-md-4");

            item_containers
                .append("h3")
                .text(function(d){return d.region.short_name});

            var svgs = item_containers
                .append("svg")
                .attr("class", "smallchart")
                .attr("width", "100%")
                .attr("data-aspect-ratio", "0.05")
                .attr("data-min-height", "50");

            item_containers
                .each(function(d, i) {
                    this.__chart__ = smallchart()
                        .data(d.timeseries)
                        .varName("n")
                        .xTicks(8)
                        .yTicks(2);

                    d3.select(this).select("svg").call(this.__chart__);
                });

            function update() {
                var join_selection = parent_container
                    .selectAll("div.small_multiples_item")
                    .data(items, function(d){return d.region.code})
                    .each(function(d, i){
                        this.__chart__
                            .data(d.timeseries)
                            .update();
                    })
                    .order();

                return my;
            }

            my.update = update;

            my.filterRegions = function(regions) {
                if (!regions || !regions.length) return item_containers.classed("hidden", false);

                item_containers
                    .filter(function(d) {return regions.indexOf(d.region.code) >= 0})
                    .classed("hidden", false);

                item_containers
                    .filter(function(d) {return regions.indexOf(d.region.code) < 0})
                    .classed("hidden", true);
            }
        });
    }

    my.items = function(value) {
        if (!arguments.length) return items;
        items = value;
        return my;
    };
    

    function noop() {}

    return my;
}
