function producer_model_list_control() {

    var producer_control
        , model_control
        , dispatcher = d3.dispatch("change")
        , on_change_counter = 0
        ; 


    
    
    function my(selection) {
        selection.each(function(d) {
            
           
            
            
            
            
            
            
            
            
            
        });
    }

    my.producer_control = function(value){
        if (!arguments.length) return;
        producer_control = value;
        return my;
    };

    my.model_control = function(value){
        if (!arguments.length) return;
        model_control = value;
        return my;
    };
    
    my.onChange = function(value) {
        if (!arguments.length) return;
        dispatcher.on("change." + ++on_change_counter, value);
        return my;
    };

    my.getCurrentQuery = function() {

        // prod


    };
    
    return my;
}
