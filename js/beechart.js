function beechart() {

    var data = []
        , x
        , dateFormat = d3.timeFormat("%H")
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

            x = d3.scaleTime()
                .range([0, width]);

            var y = d3.scaleLinear()
                .range([0,height])
                .domain([-height/2, height/2]);

            // x.domain(d3.extent(data.values, function(d) {return d.DATE}));
            x.domain(["2018-08-06T00:00:00", "2018-08-07T00:00:00"].map(function(d){return new Date(d)}));

            var xAxis = d3.axisBottom(x)
                .tickSizeOuter(0)
                .tickSizeInner(-height)
                .tickPadding(5)
                .tickFormat(dateFormat);

            // var yAxis = d3.axisLeft(y)
            //     .ticks(3)
            //     .tickSizeOuter(0)
            //     .tickSizeInner(-width)
            //     .tickPadding(5);

            // if (yFormat) yAxis.tickFormat(yFormat);
            // if (yTickValues) yAxis.tickValues(yTickValues);
            // if (yTicks) yAxis.ticks(yTicks);
            // if (xTicks) xAxis.ticks(xTicks);
            //
            g.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            // g.append("g")
            //     .attr("class", "axis axis--y")
            //     .call(yAxis);

            var swarm = d3.beeswarm()
                .data(data.values) // set the data to arrange
                .distributeOn(function(d) {
                    // set the value accessor to distribute on
                    return x(d.DATE); // evaluated once on each element of data
                }) // when starting the arrangement
                .radius(1) // set the radius for overlapping detection
                .orientation('horizontal') // set the orientation of the arrangement
                // could also be 'vertical'
                .side('symetric') // set the side(s) available for accumulation
                // could also be 'positive' or 'negative'
                .arrange(); // launch arrangement computation;
            // return an array of {datum: , x: , y: }
            // where datum refers to an element of data
            // each element of data remains unchanged

            var routes = d3.nest()
                .key(function(d){return d.ROUTE})
                .entries(data.values)
                .map(function(d){return d.key});

            colorScale.domain(routes);

            g
                .selectAll('circle')
                .data(swarm)
                .enter()
                .append('circle')
                .attr('cx', function(bee) {
                    return bee.x;
                })
                .attr('cy', function(bee) {
                    return bee.y + h/2;
                })
                .attr('r', 1)
                .style('fill', function(bee) {
                    // return "#f95d20"
                    return window.colorScale(bee.datum.KIND)
                });
            
            return my;



            function update() {

            }

            my.update = update;
        });
    }

    my.data = function(value) {
        if (!arguments.length) return data;
        data = value;
        return my;
    };

    return my;
}
