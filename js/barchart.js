function barchart() {

    var data = []
        , dateFormat = d3.timeFormat("%H:%M")
        , maxY = 40
        , periods
        , out_periods
        , date_extent = ["2018-08-06T00:00:00", "2018-08-07T00:00:00"]
        , brush_enabled
        , brush
        , brush_extent
        , interactive_summary_container
        , on_change_counter = 0
        , dispatcher = d3.dispatch("change")
    // , xFormat = d3.format("0.2f")
        ;

    function my(selection) {
        selection.each(function(d) {

            var svg = d3.select(this);
            var w = svg.node().getBoundingClientRect().width;
            var mh = +svg.attr("data-min-height");
            var h = Math.max(mh, w * (+svg.attr("data-aspect-ratio")));

            var margin = {top: 5, right: 5, bottom: 15, left: 25}
                , width = w - margin.left - margin.right
                , height = h - margin.top - margin.bottom
                , g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                ;
            svg.attr("height", h);

            var x = d3.scaleTime()
                .range([0, width]);

            var y = d3.scaleLinear()
                .range([height, 0])                .nice();

            x.domain(date_extent.map(d => new Date(d)));
            y.domain([0, maxY]);

            var xAxis = d3.axisBottom(x)
                .tickSizeOuter(0)
                .tickSizeInner(-height)
                .tickPadding(15)
                .tickFormat(dateFormat);

            var yAxis = d3.axisLeft(y)
                .tickSizeOuter(15)
                .tickSizeInner(15)
                .tickPadding(5)
                .ticks(1)
                .tickFormat(d3.format(".0f"));

            if (periods) {
                g.append("g")
                    .selectAll("rect.period")
                    .data(periods)
                    .enter()
                    .append("rect")
                    .attr("class", "period")
                    .attr("x", d => x(d.start_datetime))
                    .attr("y", d => y(0))
                    .attr("width", d => x(d.end_datetime) - x(d.start_datetime))
                    .attr("height", y(0) - y(5))
            }

            if (out_periods) {
                g.append("g")
                    .selectAll("rect.out-period")
                    .data(out_periods)
                    .enter()
                    .append("rect")
                    .attr("class", "out-period")
                    .attr("x", d => x(d.start_datetime))
                    .attr("y", d => y(-5))
                    .attr("width", d => x(d.end_datetime) - x(d.start_datetime))
                    .attr("height", y(0) - y(5))
            }

            g.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            g.append("g")
                .attr("class", "axis axis--y")
                .attr("transform", "translate(0, 0)")
                .call(yAxis);

            g.selectAll("rect.bar")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.date_f))
                .attr("y", d => y(d.value))
                .attr("width", 4)
                .attr("height", d => y(0) - y(d.value));

            if (brush_enabled) {
                var brush = d3.brushX()
                    .extent([[0, 0], [width, height]])
                    .on("brush", brushmoved);

                var gBrush = g.append("g")
                    .attr("class", "brush")
                    .call(brush);

                var handle = gBrush.selectAll(".handle--custom")
                    .data([{type: "w"}, {type: "e"}])
                    .enter()
                    .append("path")
                    .attr("class", "handle--custom")
                    .attr("d", d3.arc()
                        .innerRadius(0)
                        .outerRadius(height / 2)
                        .startAngle(0)
                        .endAngle(function(d, i) { return i ? Math.PI : -Math.PI; }));

                if (!brush_extent) brush_extent = date_extent;
                gBrush.call(brush.move, brush_extent.map(x));

                function brushmoved() {
                    var s = d3.event.selection;

                    if (s == null) {
                        handle.attr("display", "none");
                    } else {
                        var sx = s.map(x.invert);
                        handle
                            .attr("display", null)
                            .attr("transform", (d, i) => "translate(" + s[i] + "," + height / 2 + ")");

                        dispatcher.call("change", this, sx);
                    }
                }
            }

            return my;

        });
    }

    my.data = function(value) {
        if (!arguments.length) return data;
        data = value;
        return my;
    };

    my.periods = function(value) {
        if (!arguments.length) return periods;
        periods = value;
        return my;
    };

    my.out_periods = function(value) {
        if (!arguments.length) return out_periods;
        out_periods = value;
        return my;
    };


    my.maxY = function(value) {
        if (!arguments.length) return maxY;
        maxY = value;
        return my;
    };

    my.date_extent = function(value) {
        if (!arguments.length) return date_extent;
        date_extent = value;
        return my;
    };

    my.brush_enabled = function(value) {
        if (!arguments.length) return brush_enabled;
        brush_enabled = value;
        return my;
    };

    my.onBrushChange = function(value) {
        if (!arguments.length) return;
        dispatcher.on("change." + ++on_change_counter, value);
        return my;
    };

    my.brush_extent = function(value) {
        if (!arguments.length) return brush_extent;
        brush_extent = value;
        return my;
    };
    
    // my.interactive_summary_container = function(value) {
    //     if (!arguments.length) return interactive_summary_container;
    //     interactive_summary_container = value;
    //     return my;
    // };

    function time_floor(date) {
        const band = 10;

        date = moment(date);
        return date.minute(Math.floor(date.minute() / band) * band).second(0).toDate();
    }

    return my;
}
