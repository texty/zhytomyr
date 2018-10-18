function range_control() {
    
    var container
        , context = {
            placeholder: "",
            id: "",
            varName: "",
            step: 1,
            prefix: "",
            domain: [0, 1000],
            total_count: 0,
            empty_count: 0,
            selectedExtent: [],
            show_empty: true
        }
        , format = (function() {var proto = d3.format(","); return function(value){return proto(value).replace(/,/g, " ")}})()
        , slider
        , dispatcher = d3.dispatch("change")
        , on_change_counter = 0
        , input
        ;

    function my(selection) {
        selection.each(function(d) {
            context.varName = context.id;

            var container = d3.select(this)
                .append("div")
                .attr("class", "range-control");

            var header = container
                .append("span")
                .attr("class", "placeholder")
                .text(context.placeholder);


            input = container
                .append("input")
                .attr("type", "text")
                .attr("name", "input_name")
                .attr("value", "");

            $(input.node()).ionRangeSlider({
                type: "double",
                grid: true,
                min: context.domain[0],
                max: context.domain[1],
                from: context.domain[0],
                to: context.domain[1],
                prefix: context.prefix,
                step: context.step,
                prettify_enabled: true,

                onFinish: function(data) {
                    context.selectedExtent = [data.from, data.to];
                    dispatcher.call("change", this, {extent: context.selectedExtent, show_empty: context.show_empty});
                }
            });

            slider = $(input.node()).data("ionRangeSlider");

            var total = container
                .append("span")
                .attr("class", "total-text")
                .text("Всього: " + format(context.total_count));

            var label = container
                .append("label")
                .attr("class", "form-check-label d-flex justify-content-between align-items-center");

            var empty_checkbox = label
                .append("input")
                .attr("type", "checkbox")
                .attr("class", "form-check-input")
                .attr("value", "")
                .attr("checked", context.show_empty)
                .on("change", function(){
                    context.show_empty = this.checked;
                    dispatcher.call("change", this, {extent: context.selectedExtent, show_empty: context.show_empty});
                });

            var check_text = label
                .append("span")
                .attr("class", "check-text")
                .text(function(d){return "Показувати пусті"});


            my.update = update;

            my.uncheck = function(value) {
                context.selectedExtent = [];
                context.show_empty = true;
                update();
                dispatcher.call("change", this, {extent: context.selectedExtent, show_empty: context.show_empty});
            };

            function update() {
                if (context.selectedExtent.length) {
                    context.selectedExtent[0] = Math.max(context.selectedExtent[0], context.domain[0]);
                    context.selectedExtent[1] = Math.min(context.selectedExtent[1], context.domain[1]);

                    slider.update({
                        min: context.domain[0],
                        max: context.domain[1]
                    });
                } else {
                    slider.update({
                        min: context.domain[0],
                        max: context.domain[1],
                        from: context.domain[0],
                        to: context.domain[1]
                    });
                }
                total.text("Всього: " + format(context.total_count));

                check_text.text("Показувати пусті (" + format(context.empty_count) + ")");
                empty_checkbox.node().checked = context.show_empty;
                return my;
            }
        });

    }

    function prettifyDomain(domain, step) {
        var min = domain[0], max = domain[1];
        // if (max % step == 0) max -= step;
        return [min - min % step, max + (step - max % step)];
    }

    my.placeholder = function(value) {
        if (!arguments.length) return context.placeholder;
        context.placeholder = value;
        return my;
    };

    my.id = function(value) {
        if (!arguments.length) return context.id;
        context.id = value;
        return my;
    };

    my.step = function(value) {
        if (!arguments.length) return context.step;
        context.step = value;
        return my
    };

    my.prefix = function(value) {
        if (!arguments.length) return context.prefix;
        context.prefix = value;
        return my
    };

    my.domain = function(value) {
        if (!arguments.length) return context.domain;
        context.domain = prettifyDomain(value, context.step);
        return my
    };

    my.total_count = function(value) {
        if (!arguments.length) return context.total_count;
        context.total_count = value;
        return my
    };

    my.empty_count = function(value) {
        if (!arguments.length) return context.empty_count;
        context.empty_count = value;
        return my
    };

    my.selectedExtent = function(value) {
        if (!arguments.length) return context.selectedExtent;
        context.selectedExtent = value;

        my.update();
        return my;
    };

    my.show_empty = function(value) {
        if (!arguments.length) return context.show_empty;
        context.show_empty = value;
        return my
    };

    my.onChange = function(value) {
        if (!arguments.length) return;
        dispatcher.on("change." + ++on_change_counter, value);
        return my;
    };
    
    my.isInDefaultState = function() {
        return context.selectedExtent && context.selectedExtent.length ==0 && context.show_empty
    };
    
    my.type = function() {return "range"};

    return my;
}
