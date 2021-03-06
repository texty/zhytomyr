function route_picker() {

    var data = []
        , heatdata
        , on_change_counter = 0
        , dispatcher = d3.dispatch("change")
        , route_key
        ;
    
    function my(selection) {
        selection.each(function(d) {
            var container = d3.select(this);
            
            var groups = container
                .selectAll("div.transport-group")
                .data(data)
                .enter()
                .append("div")
                .attr("class", "transport-group");

            groups
                .append("h4")
                .text(d => d.name);

            var pills = groups
                .append("ul")
                .attr("class", "nav nav-pills justify-content-left")
                .selectAll("li")
                .data(d => d.routes)
                .enter()
                .append("li")
                .attr("class", "nav-item")
                .append("a")
                .attr("class", "nav-link")
                .attr("href", "#")
                .text(d => d.picker_name || d.key)
                .on("click", function(d) {
                    my.route(d.key);
                    d3.event.preventDefault();
                });

            my.route = function(route, no_change) {
                if (!arguments.length) return route;

                if (route != route_key) {
                    route_key = route;
                    pills.classed("active", d => d.key == route_key);
                 
                    if (!no_change) dispatcher.call("change", this, route_key);
                }

                return my;
            };

            my.heatdata = function(value) {
                if (!arguments.length) return heatdata;
                heatdata = value;

                var colorScale = d3.scaleSequential(d3.interpolatePurples)
                    .domain([-20, d3.max(heatdata.values())]);

                var threshold = colorScale.domain()[1] / 3;

                pills.style('background-color', d => colorScale(heatdata.get(d.key) | 0));
                pills.classed('light', d => (heatdata.get(d.key) | 0) < threshold);

                return my;
            };
            
            return my;
        });
    }

    my.data = function(value) {
        if (!arguments.length) return data;
        data = value;
        return my;
    };

    my.onChange = function(value) {
        if (!arguments.length) return;
        dispatcher.on("change." + ++on_change_counter, value);
        return my;
    };

    return my;
}
