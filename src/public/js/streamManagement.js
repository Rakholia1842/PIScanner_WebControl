//Handles buttons and setup for getting 
//and displaying stream address
$(document).ready(function() {


    get_init_stream_state();
    
    function get_init_stream_state () {
        $.post("/stream_status")
        .done(streamUrlCB);
    }
    
    function streamUrlCB (rtn) {
        $("#active_stream_url").html(rtn);
    }
    
    $("#button_stream_here").click(function (e) {
        $.post("/setup_stream", {"host" : "this_client"})
        .done(streamUrlCB);
    });
    
    $("#button_stream_to_input").click(function (e) {
        $.post("/setup_stream", {"host" : $("#stream_url_address_input").val()})
        .done(streamUrlCB);
    });
    
    $("#button_refresh_stream_status").click(function (e) {
        $.post("/stream_status")
        .done(streamUrlCB)
    });
    
    $("#button_disconnect_stream").click(function (e) {
        $.post("/disconnect_stream")
        .done(function (rtn) {
            if (rtn == "OK") {
                $("#active_stream_url").html("No Stream Active");
            } else {
                window.alert("Error disconnecting stream");                
            }
        });
    });
});
