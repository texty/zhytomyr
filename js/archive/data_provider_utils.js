function fillDates(sorted, extent) {
    if (sorted.length < 0) return sorted;

    if (!extent) extent = d3.extent(sorted, function(d){return d.month});
    var sequence = monthsInRange(extent[0], extent[1]);
    var idx = 0;
    return sequence.map(function(date_str){
        if (!sorted[idx] || date_str !== sorted[idx].month) return {month: date_str, n:0};
        return sorted[idx++];
    });
}

function addDays(date_str, n) {
    var date = moment.utc(date_str);
    date.add(n, 'days');
    return date.toISOString().substr(0, 10);
}

function addMonths(date_str, n) {
    var date = moment.utc(date_str);
    date.add(n, 'months');
    return date.toISOString().substr(0, 10);
}

function monthsInRange(min_str, max_str) {
    var date_str = min_str;
    var result = [];

    while (date_str <= max_str) {
        result.push(date_str);
    date_str = addMonths(date_str, 1);
    }

    return result;
}