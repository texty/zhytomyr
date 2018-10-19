var total_chart_legend = (function(){
    var module = {}
        
        , data = []
        
        , on_change_counter = 0
        , dispatcher = d3.dispatch("change")
        , container = d3.select("#total_chart_legend")
        ;
    
    module.data = function(val) {
        if (!arguments.length) return data;
        data = val;
        return module;
    };
    
    module.update = function() {
        container
            .selectAll(".legend-item")
            .remove();
        
        container
            .selectAll(".legend-item")
            .data(data)
            .enter()
            .append("div")
            .attr("class", function(d, i){return  "legend-item " + "line-chart-color-" + (i + 1)})
            .text(function(d){return d});
        
        return module;
    };
    
    return module;
})();

