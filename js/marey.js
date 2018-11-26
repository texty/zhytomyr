function marey() {

    var data = []
        , stops_data = []
        , y
        , dateFormat = d3.timeFormat("%H:%M")
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

            var margin = {top: 5, right: 45, bottom: 105, left: 35}
                , width = w - margin.left - margin.right
                , height = h - margin.top - margin.bottom
                , g = svg
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                ;

            svg.attr("height", h);

            var trip_data = d3.nest()
                .key(row => row.group)
                .entries(data);
            
            y = d3.scaleTime()
                .range([0, height]);

            var x = d3.scaleLinear()
                .range([0,width])
                .domain(d3.extent(stops_data, (d) => d.fraction));

            var radiusScale = d3.scaleSqrt()
                .range([0, 10])
                .domain([0, 25]);

            y.domain(["2018-08-06 06:00:00", "2018-08-07 00:00:00"]
                .map(function(d){return new Date(d)}));

            console.log(y.domain());

            var xAxis = d3.axisBottom(x)
                .tickSizeOuter(0)
                .tickSizeInner(5)
                .tickPadding(0)
                .tickValues(stops_data.map(r => r.fraction))
                .tickFormat((fr, i) => stops_data[i].name);

            var yAxis1 = d3.axisLeft(y)
                .tickSizeInner(5)
                .tickSizeOuter(0)
                .tickFormat(dateFormat);

            var yAxis2 = d3.axisRight(y)
                .tickSizeInner(5)
                .tickSizeOuter(0)
                .tickFormat(dateFormat);


            g.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .selectAll("text")
                .attr("y", 0)
                .attr("x", -7)
                .attr("dy", ".35em")
                .attr("transform", "rotate(-90)");

            g.append("g")
                .attr("class", "axis axis--y axis--y-1")
                .call(yAxis1);

            g.append("g")
                .attr("class", "axis axis--y axis--y-2")
                .attr("transform", "translate(" + width + ",0)")
                .call(yAxis2);

            var pathGen = d3.line()
                .x((d) => x(d.fraction))
                .y((d) => y(d.start_datetime));

            var pp = g.append("g")
                .selectAll("path")
                .data(trip_data)
                .enter()
                .append("path")
                .attr("d", function(d){console.log(d.values); return pathGen(d.values)})

            var circle = g.append("g")
                .selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr('cx', function(d) {return x(d.fraction); })
                .attr('cy', function(d) {return y(d.start_datetime)})
                .attr('r', d => radiusScale(d.transactions));

            // pp
            //     .on('mouseover', function(d){
            //         pp.style('stroke-opacity', dd => d.values[0].vehicle == dd.values[0].vehicle ? 1 : 0.2)
            //         circle.style('opacity', dd => dd.vehicle == d.values[0].vehicle ? 1 : 0.2)
            //     });



            return my;

        });
    }

    my.data = function(value) {
        if (!arguments.length) return data;
        data = value;
        return my;
    };

    my.stops_data = function(value) {
        if (!arguments.length) return stops_data;
        stops_data = value;
        return my;
    };

    return my;
}
