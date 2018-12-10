function route_picker() {

    var data = []
        , heatdata
        , on_change_counter = 0
        , dispatcher = d3.dispatch("change")
        , active_route
        ;
    
    function my(selection) {
        selection.each(function(d) {
            var container = d3.select(this);
            
            var pills = container
                .selectAll("li")
                .data(data)
                .enter()
                .append("li")
                .attr("class", "nav-item")
                .append("a")
                .attr("class", "nav-link")
                .attr("href", "#")
                .text(d => d)
                .on("click", function(d) {
                    my.route(d);
                    d3.event.preventDefault();
                });

            my.route = function(route, no_change) {
                if (!arguments.length) return route;

                if (route != active_route) {
                    active_route = route;
                    pills.classed("active", d => d == active_route);
                 
                    if (!no_change) dispatcher.call("change", this, active_route);
                }

                return my;
            };

            my.heatdata = function(value) {
                if (!arguments.length) return heatdata;
                heatdata = value;

                var colorScale = d3.scaleSequential(d3.interpolatePurples)
                    .domain([-20, d3.max(heatdata.values())]);

                var threshold = colorScale.domain()[1] / 3;

                pills.style('background-color', d => colorScale(heatdata.get(d)));
                pills.classed('light', d => heatdata.get(d) < threshold);

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
