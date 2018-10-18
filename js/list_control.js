function list_control() {

    var container
        , context = {
            placeholder: "",
            items: [],
            show_badges: false,
            id: null,
            order: true,
            max_selected: null,
            lazy_load: null
        }
        , badgeFormat
        , ps
        , filter_term = "" //todo only internal
        , item_enter
        , dispatcher = d3.dispatch("change")
        , on_change_counter = 0
        // , ul_container
        ;

    function my(selection) {
        selection.each(function(d) {
            var container = d3.select(this)
                .append("div")
                .attr("class", "list-control");


            var searchbox = container
                .append("input")
                .attr("type", "text")
                .attr("name", "search")
                .attr("class", "searchbox")
                .attr("placeholder", context.placeholder);

            var ul_container = container
                .append("div")
                .attr("class", "ul-container always-visible");

            var ul = ul_container
                .append("ul")
                .attr("class", "list-group form-check");

            var ps = new PerfectScrollbar(ul_container.node(), {
                suppressScrollX: true,
                minScrollbarLength: 20
            });

            ul_container.on('ps-y-reach-end', function(){

            });

            searchbox.on("change input", function(){
                var term = normalize(this.value);
                ul.selectAll("li.list-group-item").classed("hidden", function(d) {return normalize(d.label).indexOf(term) < 0});
                ps.update();
            });

            my.update = update;
            update();

            my.uncheck = function(value) {
                ul.selectAll("li.list-group-item")
                    .select("input")
                    .filter(function(d){return d.id === value})
                    .node().click();
            };

            function update() {
                if (context.lazy_load) context.visible_items = context.items.slice(0, context.lazy_load);
                else context.visible_items = context.items;

                var item_join_selection = ul
                    .selectAll("li.list-group-item")
                    .data(context.visible_items, function(d) {return d.id;});

                // UPDATE
                // зараз це не треба, але може буде колись
                // item_join_selection
                //     .selectAll("label.form-check-label")

                // EXIT
                item_join_selection.exit().remove();
                
                item_enter = item_join_selection.enter() //
                    .append("li")
                    .attr("class", "list-group-item d-flex justify-content-between align-items-center")
                    .on("change", function(d){
                        if (context.max_selected && d3.event.target.checked && my.selected().length >= context.max_selected) {
                            d3.event.target.checked = false;
                            return;
                        }

                        d.checked = d3.event.target.checked;
                        dispatcher.call("change", this, {change: d, all: context.items});
                    });

                var label = item_enter
                    .append("label")
                    .attr("class", "form-check-label d-flex justify-content-between align-items-center");

                var checkbox = label
                    .append("input")
                    .attr("type", "checkbox")
                    .attr("class", "form-check-input")
                    .attr("value", "");

                var check_text = label
                    .append("span")
                    .attr("class", "check-text")
                    .text(function(d){return d.label});

                // ENTER + UPDATE
                var item_merged_selection = item_enter.merge(item_join_selection);

                item_merged_selection
                    .select("input")
                    .each(function(d){
                       d.checked = this.checked;
                    });

                if (context.show_badges) {
                    item_enter
                        .select("label.form-check-label")
                        .append("span")
                        .attr("class", "badge badge-primary badge-pill");

                    item_merged_selection
                        .select("span.badge")
                        .text(function(d){
                            return d.badge
                        });
                }

                if (context.order) item_merged_selection.order();
                
                setTimeout(function(){ps.update()}, 10);

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

    my.show_badges = function(value) {
        if (!arguments.length) return context.show_badges;
        context.show_badges = value;
        return my;
    };

    my.id = function(value) {
        if (!arguments.length) return context.id;
        context.id = value;
        return my;
    };

    my.order = function(value) {
        if (!arguments.length) return context.order;
        context.order = value;
        return my;
    };

    my.onChange = function(value) {
        if (!arguments.length) return;
        dispatcher.on("change." + ++on_change_counter, value);
        return my;
    };

    my.selected = function() {
        return context.visible_items
            .filter(function(d){return d.checked})
            .map(function(d){return d.id})
    };

    my.max_selected = function(value) {
        if (!arguments.length) return context.max_selected;
        context.max_selected = value;
        return my;
    };

    my.lazy_load = function(value) {
        if (!arguments.length) return context.lazy_load;
        context.lazy_load = value;
        return my;
    };

    function normalize(str) {
        if (!str) return "";
        return str.trim().toUpperCase().replace(/\s+/g, " ");
    }

    my.isInDefaultState = function() {
        return my.selected().length == 0;
    };
    
    my.type = function() {return "list"};
    
    function noop(){}

    return my;
}
