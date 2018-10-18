function add_filter_control() {

    var container
        , context = {
            placeholder: "",
            items: []
        }

        , item_enter
        , dispatcher = d3.dispatch("filter-selected")
        , on_change_counter = 0
        ;

    function my(selection) {
        selection.each(function(d) {

            var container = d3.select(this)
                .append("div")
                .attr("class", "plus-button d-flex h-100 justify-content-center");

            var add_section = container
                .append("div")
                .attr("class", "add-section");

            var select_section = container
                .append("div")
                .attr("class", "select-section hidden");

            add_section
                .append("i")
                .attr("class", "far fa-plus-square align-self-center")
                .attr("title", "Додати фільтр")
                .on("click", function() {
                    console.log("ADD button clicked;");

                    add_section.classed("hidden", true);
                    select_section.classed("hidden", false);
                });

            var header = select_section
                .append("span")
                .attr("class", "placeholder")
                .text(context.placeholder);


            var ul_container = select_section
                .append("div")
                .attr("class", "ul-container");

            var ul = ul_container
                .append("ul")
                .attr("class", "list-group");

            my.update = update;
            update();

            function update() {
                var item_join_selection = ul
                    .selectAll("li.list-group-item")
                    .data(context.items, function(d) {return d.id;});

                // EXIT
                item_join_selection.exit().remove();

                item_enter = item_join_selection.enter() //
                    .append("li")
                    .attr("class", "list-group-item d-flex justify-content-between align-items-center")
                    .text(function(d) {return d.label})
                    .on("click", function(d) {
                        console.log(d + " selected");
                        add_section.classed("hidden", false);
                        select_section.classed("hidden", true);
                        dispatcher.call("filter-selected", this, d);
                    });

                return my;
            }
        });

    }

    my.items = function(value) {
        if (!arguments.length) return context.items;
        context.items = value;
        return my;
    };

    my.placeholder = function(value) {
        if (!arguments.length) return context.placeholder;
        context.placeholder = value;
        return my;
    };

    my.onFilterSelected = function(value) {
        if (!arguments.length) return my;
        dispatcher.on("filter-selected." + ++on_change_counter, value);
        return my;
    };

    my.type = function() {return "add-filter"};
    
    function noop(){}

    return my;
}
