function barchart() {

    var data = []
        , dateFormat = d3.timeFormat("%H:%M")
        , maxY = 40
        , periods
        , out_periods
        , date_extent = ["2018-08-06T00:00:00", "2018-08-07T00:00:00"]
    // , xFormat = d3.format("0.2f")
        ;

    var colorScale = d3.scaleOrdinal()
        .range(d3.schemeCategory10);

    function my(selection) {
        selection.each(function(d) {

            var svg = d3.select(this);
            var w = svg.node().getBoundingClientRect().width;
            var mh = +svg.attr("data-min-height");
            var h = Math.max(mh, w * (+svg.attr("data-aspect-ratio")));

            var margin = {top: 5, right: 5, bottom: 15, left: 5}
                , width = w - margin.left - margin.right
                , height = h - margin.top - margin.bottom
                , g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                ;
            svg.attr("height", h);

            var x = d3.scaleTime()
                .range([0, width]);

            var y = d3.scaleLinear()
                .range([height, 0]);

            // x.domain(d3.extent(data.values, function(d) {return d.datetime}));
            x.domain(date_extent.map(function(d){return new Date(d)}));

            data.values.forEach(v => v.date_f = time_floor(v.datetime));

            var bar_data = d3.nest()
                .key(d => d.date_f)
                .entries(data.values);

            bar_data.forEach(d => d.date_f = new Date(d.key));

            y.domain([0, maxY]);


            var xAxis = d3.axisBottom(x)
                .tickSizeOuter(0)
                .tickSizeInner(-height)
                .tickPadding(5)
                .tickFormat(dateFormat);

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


            g.selectAll("rect.bar")
                .data(bar_data)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.date_f))
                .attr("y", d => y(d.values.length))
                .attr("width", 2)
                .attr("height", d => y(0) - y(d.values.length));

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


    function time_floor(date) {
        const band = 10;

        date = moment(date);
        return date.minute(Math.floor(date.minute() / band) * band).second(0).toDate();
    }

    return my;
}
