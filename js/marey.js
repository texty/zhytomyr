function marey() {

    var data = []
        , stops_data = []
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

            var margin = {top: 5, right: 45, bottom: 5, left: 90}
                , width = w - margin.left - margin.right
                , height = h - margin.top - margin.bottom
                , g = svg
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                ;

            var zoom = d3.zoom()
                .scaleExtent([1, 10])
                .translateExtent([[-width*2, 0], [width*2, 0]])
                .on("zoom", zoomed);

            svg.attr("height", h);

            var clipPath = svg.append("defs")
                .append("clipPath")
                .attr("id", "clipPath");

            var trip_data = d3.nest()
                .key(row => row.group)
                .entries(data);
            
            var x = d3.scaleTime()
                .range([0, width]);

            var y = d3.scaleLinear()
                .range([0, height])
                .domain(d3.extent(stops_data, (d) => d.fraction));

            var radiusScale = d3.scaleSqrt()
                .range([0, 10])
                .domain([0, 25]);

            // x.domain(["2018-08-06 00:00:00", "2018-08-07 00:00:00"]
            //     .map(function(d){return new Date(d)}));

            x.domain(d3.extent(data, d => d.start_datetime));

            var yAxis = d3.axisLeft(y)
                .tickSizeOuter(0)
                .tickSizeInner(5)
                .tickPadding(0)
                .tickValues(stops_data.map(r => r.fraction))
                .tickFormat((fr, i) => stops_data[i].name);

            var xAxis1 = d3.axisTop(x)
                .tickSizeInner(5)
                .tickSizeOuter(0)
                .tickFormat(dateFormat);

            var xAxis2 = d3.axisBottom(x)
                .tickSizeInner(5)
                .tickSizeOuter(0)
                .tickFormat(dateFormat);

            clipPath.append("rect")
                .attr("x", -15)
                .attr("y", -15)
                .attr("width", width + 30)
                .attr("height", height + 30);

            var gY = g.append("g")
                .attr("class", "axis axis--y")
                // .attr("transform", "translate(0," + height + ")")
                .call(yAxis);

            gY
                .selectAll("text")
                .attr("x", -85);

            var gX1 = g.append("g")
                .attr("class", "axis axis--x axis--x-1")
                .call(xAxis1)
                .attr("transform", "translate(0, -25)");

            var gX2 = g.append("g")
                .attr("class", "axis axis--x axis--x-2")
                .attr("transform", "translate(0, " + (height + 25) + ")")
                .call(xAxis2);

            var pathGen = d3.line()
                .y((d) => y(d.fraction))
                .x((d) => x(d.start_datetime));

            var zoom_pane = g.append("g");

            var pp = zoom_pane.append("g")
                .style("clip-path", "url(#clipPath)")
                .selectAll("path")
                .data(trip_data)
                .enter()
                .append("path")
                .attr("d", d => pathGen(d.values));

            var circle = zoom_pane.append("g")
                .style("clip-path", "url(#clipPath)")
                .selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr('cy', function(d) {return y(d.fraction); })
                .attr('cx', function(d) {return x(d.start_datetime)})
                .attr('r', d => radiusScale(d.transactions));

            // pp
            //     .on('mouseover', function(d){
            //         pp.style('stroke-opacity', dd => d.values[0].vehicle == dd.values[0].vehicle ? 1 : 0.2)
            //         circle.style('opacity', dd => dd.vehicle == d.values[0].vehicle ? 1 : 0.2)
            //     });

            svg.call(zoom);

            function zoomed() {
                var xt = d3.event.transform.rescaleX(x);
                console.log(d3.event.transform);
                gX1.call(xAxis1.scale(xt));

                pathGen.x(d => xt(d.start_datetime));

                pp.attr("d", d => pathGen(d.values));
                circle.attr("cx", d => xt(d.start_datetime));
            }

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
