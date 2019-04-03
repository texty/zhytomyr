function calendar() {

    var heatdata = []
        , date_extent = ['2018-11-26 00:00', '2019-01-31 00:00']
        , selected_date
        , on_change_counter = 0
        , dispatcher = d3.dispatch("change")
        , current_month_number = -10
        ;

    // var month_str = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень'
    //     , 'вересень', 'жовтень', 'листопад', 'грудень'];

    var date_format = d3.timeFormat("%Y-%m-%d");
    var month_caption_format = d3.timeFormat("%B %Y");

    function my(selection) {
        selection.each(function(d) {
            var container = d3.select(this);

            var all_days = [];

            var start_date = firstDayOfMonth(new Date(date_extent[0]));
            var end_date = lastDayOfMonth(new Date(date_extent[1]));

            var cur_date = new Date(start_date);
            
            var min_active = new Date(date_extent[0]);
            var max_active = new Date(date_extent[1]);

            while (cur_date <= end_date) {
                all_days.push({
                    date: new Date(cur_date),
                    visible: true,
                    active: cur_date >= min_active && cur_date <= max_active
                });
                addOneDay(cur_date);
            }

            console.log(all_days)

            var months = d3.nest()
                .key(d => moment(d.date).format('YYYY-MM-01'))
                .entries(all_days);

            console.log(months)

            months.forEach(m => m.month_str = month_caption_format(new Date(m.key)));

            months.forEach(function(m){
                m.first_date = new Date(m.values[0].date);

                var weekday = moment(m.first_date).isoWeekday();

                var new_values = [];
                var invisibleObj = {visible: false};

                for (var i = 0; i < weekday - 1; i++) {
                    new_values.push(invisibleObj);
                }

                Array.prototype.push.apply(new_values, m.values);
                m.values = new_values;
            });

            var colorScale = d3.scaleSequential(d3.interpolatePurples)
                .domain([0, d3.max(heatdata.values())]);


            my.selected_date = function(date_str) {
                if (!arguments.length) return selected_date;

                if (date_str != selected_date) {
                    selected_date = date_str;

                    var active_boxes = container
                        .select(".month-grid .days")
                        .selectAll("div.box.active");

                    active_boxes.classed("selected", d => d.active && date_format(d.date) == selected_date);
                    dispatcher.call("change", this, selected_date);
                }

                return my;
            };

            my.current_month_number = function(val) {
                if (!arguments.length) return current_month_number;

                if (val != current_month_number) {
                    current_month_number = val;

                    console.log(curdata);
                    var curdata = months[current_month_number];

                    container.select(".month-title").text(curdata.month_str);

                    container
                        .select(".month-grid .days")
                        .selectAll("div.box")
                        .remove()

                    var box_join = container
                        .select(".month-grid .days")
                        .selectAll("div.box")
                        .data(curdata.values);

                    var box_enter = box_join
                        .enter()
                        .append("div")
                        .attr("class", "box")
                        .classed("active", d => d.active)
                        .text(d => d.visible ? d.date.getDate() : '');

                    var active_boxes = container
                        .select(".month-grid .days")
                        .selectAll("div.box.active");

                    active_boxes.on("click", function(d) {
                        d3.event.preventDefault();
                        my.selected_date(date_format(d.date));
                    });

                    active_boxes
                        .style('background-color', d => colorScale(heatdata.get(date_format(d.date))));

                    active_boxes
                        .filter((d, i) => i == 0)
                        .each(function(d) {
                            my.selected_date(date_format(d.date));
                        });

                    // var colorScale = d3.scaleLinear()
                    //     .interpolate(d3.interpolateHcl)
                    //     // .range([d3.rgb("#F0EEF2"), d3.rgb('#4a2366')]);
                    //     .range([d3.rgb("#F4DEED"), d3.rgb('#4a2366')]);

                    // #4a2366

                }

                return my;
            };

            my.current_month_number(1);


            container.select(".btn-month-prev").on("click", function() {
                my.current_month_number(Math.max(current_month_number - 1, 0));
            });

            container.select(".btn-month-next").on("click", function() {
                my.current_month_number(Math.min(current_month_number + 1, months.length - 1));
            });

            return my;
        });
    }

    my.heatdata = function(value) {
        if (!arguments.length) return heatdata;
        heatdata = value;
        return my;
    };

    my.date_extent = function(value) {
        if (!arguments.length) return date_extent;
        date_extent = value;
        return my;
    };

    my.onDateChange = function(value) {
        if (!arguments.length) return;
        dispatcher.on("change." + ++on_change_counter, value);
        return my;
    };

    function addOneDay(date) {
        date.setDate(date.getDate() + 1);
        return date;
    }

    function firstDayOfMonth(date) {
        return moment(date).startOf('month').toDate();
    }

    function lastDayOfMonth(date) {
        return moment(date).endOf("month").startOf("day").toDate()
    }

    return my;
}
