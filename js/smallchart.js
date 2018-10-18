function smallchart() {

    var varName
        , data = [[]]
        , main_path
        , main_area
        
        , minY
        , maxY
        , yFormat = (function() {
            var base = d3.format(".0d");
            return function(v) {return base(v).replace(/,/g, " ")}
        })()
        , yTickValues
        , yTicks
        , xTicks = 10
        , showTips
        , x

        , minValueY
        , maxValueY
        , fixed_y_axis
        , formatMonth = d3.timeFormat("%b")
        , formatYear = d3.timeFormat("%Y")
        ;

    var access = function(d){return d[varName]};

    function my(selection) {
        selection.each(function(d) {

            var svg = d3.select(this);
            var w = svg.node().getBoundingClientRect().width;
            var mh = +svg.attr("data-min-height");
            var h = Math.max(mh, w * (+svg.attr("data-aspect-ratio")));

            // circleRadius = d3.select("body").classed("xs") ? 12 : 5;

            var margin = {top: 5, right: 0, bottom: 15, left: 20}
                , width = w - margin.left - margin.right
                , height = h - margin.top - margin.bottom
                , g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                ;
            svg.attr("height", h);

            x = d3.scaleTime()
                .range([0, width]);

            var y = d3.scaleLinear()
                .range([height, 0]);

            var line = d3.line()
                .x(function(d) { return x(d.month)})
                .y(function(d) { return y(d[varName])})
                .curve(d3.curveStepAfter);

            var area = d3.area()
                .x(function(d) {return x(d.month)})
                .y0(y(0))
                .y1(function(d) {return y(d[varName])})
                .curve(d3.curveStepAfter);
            
            x.domain(d3.extent(data[0].values, function(d) {return d.month}));

            if (!minY) minY = 0;
            if (!maxY) maxY = d3.max(data, function(obj) {return d3.max(obj.values, access)});

            // if (!minValueY) minValueY = minY;
            // if (!maxValueY) maxValueY = maxY;

            y.domain([minY, maxY]);

            var xAxis = d3.axisBottom(x)
                .tickSizeOuter(10)
                .tickSizeInner(-height)
                .tickPadding(5)
                .tickFormat(multiFormat);

            var yAxis = d3.axisLeft(y)
                .ticks(3)
                .tickSizeOuter(0)
                .tickSizeInner(-width)
                .tickPadding(5);

            if (yFormat) yAxis.tickFormat(yFormat);
            if (yTickValues) yAxis.tickValues(yTickValues);
            if (yTicks) yAxis.ticks(yTicks);
            if (xTicks) xAxis.ticks(xTicks);

            g.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            g.append("g")
                .attr("class", "axis axis--y")
                .call(yAxis);
            
            var line_g = g
                .append("g")
                .attr("class", "line-pane order-colored-items");
            
            var area_g = g
                .append("g")
                .attr("class", "area-pane");


            // main_area = g.selectAll("path.area.main")
            //     .data(data)
            //     .enter()
            //     .append("path")
            //     .attr("class", "area main")
            //     .attr("d", function(d) {return area(d)});

            // main_area = g.append("path")
            //     .datum(data[0])

            // main_path = g.selectAll("path.line.main")
            //     .data(data)
            //     .enter()
            //     .append("path")
            //     .attr("class", "line main")
            //     .attr("d", function(d) {return line(d)});

            // main_path = g.append("path")
            //     .datum(data[0])
            //     .attr("class", "line main")
            //     .attr("d", line);
            //
            // var tip_g = g.append("g")
            //     .attr("class", "tip");
            //
            // var tip_rect = tip_g.append("rect")
            //     .attr("x", -22)
            //     .attr("y", -15)
            //     .attr("ry", 3)
            //     .attr("rx", 3)
            //     .attr("width", 25)
            //     .attr("height", 20);

            // var tipText = tip_g.append("text").attr('text-anchor', "end");


            function update() {
                if (!fixed_y_axis) maxY = d3.max(data, function(obj){return d3.max(obj.values, access)});
                y.domain([minY, maxY]);

                g.select("g.axis.axis--y").call(yAxis);

                var line_join = line_g.selectAll("path.line.main")
                    .data(data, function(d){return d.key});

                line_join.exit().remove();

                var line_enter = line_join
                    .enter()
                    .append("path")
                    .attr("class", "line main");

                line_enter
                    .merge(line_join)
                    .transition()
                    .duration(500)
                    .attr("d", function(d) {return line(d.values)});

                var area_join = area_g.selectAll("path.area.main")
                    .data(data);

                area_join.exit().remove();

                var area_enter = area_join
                    .enter()
                    .append("path")
                    .attr("class", "area main");

                area_enter
                    .merge(area_join)
                    .transition()
                    .duration(500)
                    .attr("d", function(d) {return area(d.values)});

                return my;
            }

            my.update = update;

            // function repair_data(idx) {
            //     if (!maxStep) return;
            //
            //     var idx_value = future[idx][varName];
            //     var previous_value, i, value;
            //
            //     previous_value = idx_value;
            //     for (i = idx + 1; i < future.length; i++) {
            //         value = future[i][varName];
            //         if (Math.abs(value - previous_value) <= maxStep) break;
            //
            //         future[i][varName] = value - previous_value > 0 ? previous_value + maxStep : previous_value - maxStep;
            //         previous_value = future[i][varName];
            //     }
            //
            //     previous_value = idx_value;
            //     for (i = idx - 1; i >=0 ; i--) {
            //         value = future[i][varName];
            //         if (Math.abs(value - previous_value) <= maxStep) break;
            //
            //         future[i][varName] = value - previous_value > 0 ? previous_value + maxStep : previous_value - maxStep;
            //         previous_value = future[i][varName];
            //     }
            // }
            //
            // function minmax(v, min, max) {
            //     return Math.min(Math.max(v, min), max);
            // }
        });
    }


    function multiFormat(date) {
        return (d3.timeYear(date) < date ? formatMonth : formatYear)(date);
    }

    my.data = function(value) {
        if (!arguments.length) return data;
        data = value;
        return my;
    };

    my.varName = function(value) {
        if (!arguments.length) return varName;
        varName = value;
        return my;
    };

    my.minY = function(value) {
        if (!arguments.length) return minY;
        minY = value;
        return my;
    };

    my.maxY = function(value) {
        if (!arguments.length) return maxY;
        maxY = value;
        return my;
    };

    my.minValueY = function(value) {
        if (!arguments.length) return minValueY;
        minValueY = value;
        return my;
    };

    my.maxValueY = function(value) {
        if (!arguments.length) return maxValueY;
        maxValueY = value;
        return my;
    };

    my.yFormat = function(value) {
        if (!arguments.length) return yFormat;
        yFormat = value;
        return my;
    };

    my.yTickValues = function(value) {
        if (!arguments.length) return yTickValues;
        yTickValues = value;
        return my;
    };

    my.yTicks = function(value) {
        if (!arguments.length) return yTicks;
        yTicks = value;
        return my;
    };

    my.xTicks = function(value) {
        if (!arguments.length) return xTicks;
        xTicks = value;
        return my;
    };

    my.showTips = function(value) {
        if (!arguments.length) return showTips;
        showTips = value;
        return my;
    };

    return my;
}
