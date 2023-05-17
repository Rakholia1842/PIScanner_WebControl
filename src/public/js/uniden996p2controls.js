$(document).ready(function() {
    var display = document.getElementById("display"),
        long_press = false,
        volume_level = 0,
        sql_level = 0,
        statusPoll = true,
        serialConnection = false;
    
    init();
    
    function init() {
        $.post("/serial_status")
        .done(serialStatusCB);
        if (serialConnection) {
            init_volsql();
            updateStatus();
        }
    }
    
    function init_volsql() {
        $.post("/command", {"cmd" : "VOL"})
        .done(volValCB);

        $.post("/command", {"cmd" : "SQL"})
        .done(sqlValCB);
    }


    //TODO: handle case when serial error occurs
    function updateStatus() {
        if(/*statusPoll &&*/ serialConnection) {
            $.post("/command", {"cmd" : "get_status"})
            .done(function(rtn) {
                if (rtn == 'Error - serial not connected') {
                    serialConnection = false;
                    $("#display").html('Scanner disconnected');
                    statusPoll = false;
                    $("#button_display_refresh").html("Enable Display Refresh");
                } else {
                    $("#display").html(rtn);
                    if(statusPoll) {
                        setTimeout(updateStatus, 300);
                    }
                }
            });
        }
    }

    function serialStatusCB (rtn) {
        if (rtn == 'CONNECTED') {
            $("#span_serial_status").html("Connected to scanner");
            serialConnection = true;
        } else {
            $("#span_serial_status").html("Not connected to scanner");
            serialConnection = false;
        }
    }

    $("#button_refresh_serial_status").click(function (e) {
        $.post("/serial_status")
        .done(serialStatusCB)
    });
    
    $("#button_connect_serial").click(function (e) {
        if (serialConnection == true) {
            window.alert("Already connected to scanner");
            return;
        }
        $.post("/open_serial_connection")
        .done(function (rtn) {
            if (rtn == "OK") {
                $("#span_serial_status").html("Connected to scanner");
                serialConnection = true;
                init_volsql();
                updateStatus();
            } else {
                window.alert("Error connecting to scanner via serial connection");                
            }
        });
    });
    
    $("#button_disconnect_serial").click(function (e) {
        if (serialConnection == false ) {
            window.alert("Already disconnected from scanner");
            return ;
        }
        serialConnection = false;
        $.post("/close_serial_connection")
        .done(function (rtn) {
            if (rtn == "OK") {
                $("#span_serial_status").html("Not connected to scanner");
                $("#display").html("Not connected");
                volume_level = 0;
                $("#display_volume").html('Volume ' + volume_level); 
                sql_level = 0;
                $("#display_squelch").html('Squelch ' + sql_level); 
                $("")
            } else {
                window.alert("Error disconnecting from scanner via serial connection");                
            }
        });
    });

    //test
    //used to handle return from VOL when expecting a value eg
    // "VOL,12"
    function volValCB(rtn) {
        if (rtn.slice(0,4) === "VOL,") {
            volume_level = parseInt(rtn.slice(4));
            $("#display_volume").html('Volume ' + volume_level); 
        } else {
            window.alert("Expected VOL,... from scanner got:" + rtn);
        }
    }
    
    function volOkCB(rtn) {
        if (rtn == "VOL,OK\r") {
            $("#display_volume").html('Volume ' + volume_level); 
            beep();
        } else {
            $.post("/command", {"cmd" : "VOL"})
            .done(volValCB);
        }
    }

    function sqlValCB(rtn) {
        if (rtn.slice(0,4) === "SQL,") {
            sql_level = parseInt(rtn.slice(4));
            $("#display_squelch").html('Squelch ' + sql_level);
        } else {
            window.alert("Expected SQL,... from scanner got:" + rtn);
        }
    }
    
    function sqlOkCB(rtn) {
        if (rtn === "SQL,OK\r") {
            $("#display_squelch").html('Squelch ' + sql_level);
            beep();
        } else {
            $.post("/command", {"cmd" : "SQL"})
            .done(sqlValCB);
        }
    }

    function genericButtonCB(rtn) {
        if (rtn == "KEY,OK\r") {
           beep(); 
        } else {
            window.alert("Button error: " + rtn);
        }
    }
    
    $("#button_vol_up").click(function(e) {
        if (volume_level === 29) {
           window.alert("already max vol"); 
        } else {
            volume_level += 1;
            cmd = "VOL," + volume_level.toString();
            $.post("/command", {"cmd" : cmd})
            .done(volOkCB);
        }
    });

    $("#button_vol_down").click(function(e) {
        if (volume_level === 0) {
            window.alert("already min vol"); 
        } else {
            volume_level -=1;
            cmd = "VOL," + volume_level.toString();
            $.post("/command", {"cmd" : cmd})
            .done(volOkCB);
        }
    });

    $("#button_squelch_up").click(function(e) {
        if (sql_level === 19) {
           window.alert("already max, squelch closed"); 
        } else {
            sql_level += 1;
            cmd = "SQL," + sql_level.toString();
            $.post("/command", {"cmd" : cmd})
            .done(sqlOkCB);
        }
    });

    $("#button_squelch_down").click(function(e) {
        if (sql_level === 0) {
            window.alert("already min sql"); 
        } else {
            sql_level -=1;
            cmd = "SQL," + sql_level.toString();
            $.post("/command", {"cmd" : cmd})
            .done(sqlOkCB);
        }
    });

    $("#button_display_refresh").click(function(e) {
        if (statusPoll) {
            statusPoll = false;
            $("#button_display_refresh").html("Enable Display Refresh");
        } else {
            statusPoll = true;
             $("#button_display_refresh").html("Disable Display Refresh");    
             updateStatus();
        }
    });
        
    $("#key_longpress").click(function(e) {
        if (long_press) {
            long_press = false;
            $("#key_longpress").html("Short Press");
        } else {
            long_press = true;
            $("#key_longpress").html("Long Press");
        }
    });
    
    $("#key_PRI").click(function(e) {
        $.post("/command", {"cmd" : "KEY,P,P"})
        .done(genericButtonCB);
    });
    
    $("#key_WX").click(function(e) {
        if (long_press) {
            cmd = "KEY,W,L";
        } else {
            cmd = "KEY,W,P";
        }
        $.post("/command", {"cmd" : cmd})
        .done(genericButtonCB);
    });
    
    $("#key_GPS").click(function(e) {
        $.post("/command", {"cmd" : "KEY,G,P"})
        .done(genericButtonCB);
    });
        
    $("#key_MENU").click(function(e) {
        $.post("/command", {"cmd" : "KEY,M,P"})
        .done(genericButtonCB);
    });
    
    $("#key_LO").click(function(e) {
        if (long_press) {
            cmd = "KEY,L,L";
        } else {
            cmd = "KEY,L,P";
        }
        $.post("/command", {"cmd" : cmd})
        .done(genericButtonCB);
    });
    
    $("#key_1").click(function(e) {
        $.post("/command", {"cmd" : "KEY,1,P"})
        .done(genericButtonCB);
    });
    
    $("#key_2").click(function(e) {
        $.post("/command", {"cmd" : "KEY,2,P"})
        .done(genericButtonCB);
    });
    
    $("#key_3").click(function(e) {
        $.post("/command", {"cmd" : "KEY,3,P"})
        .done(genericButtonCB);
    });
    
    $("#key_4").click(function(e) {
        $.post("/command", {"cmd" : "KEY,4,P"})
        .done(genericButtonCB);
    });
    
    $("#key_5").click(function(e) {
        $.post("/command", {"cmd" : "KEY,5,P"})
        .done(genericButtonCB);
    });
    
    $("#key_6").click(function(e) {
        $.post("/command", {"cmd" : "KEY,6,P"})
        .done(genericButtonCB);
    });
    
    $("#key_7").click(function(e) {
        $.post("/command", {"cmd" : "KEY,7,P"})
        .done(genericButtonCB);
    });
    
    $("#key_8").click(function(e) {
        $.post("/command", {"cmd" : "KEY,8,P"})
        .done(genericButtonCB);
    });
    
    $("#key_9").click(function(e) {
        $.post("/command", {"cmd" : "KEY,9,P"})
        .done(genericButtonCB);
    });
    
    $("#key_0").click(function(e) {
        $.post("/command", {"cmd" : "KEY,0,P"})
        .done(genericButtonCB);
    });
    
    $("#key_dot").click(function(e) {
        $.post("/command", {"cmd" : "KEY,.,P"})
        .done(genericButtonCB);
    });
    
    $("#key_E").click(function(e) {
        $.post("/command", {"cmd" : "KEY,E,P"})
        .done(genericButtonCB);
    })
    
    $("#key_SQ_press").click(function(e) {
        if (long_press) {
            cmd = "KEY,Q,L";
        } else {
            cmd = "KEY,Q,P";
        }
        $.post("/command", {"cmd" : cmd})
        .done(genericButtonCB)
    });
    
    $("#key_vol_press").click(function(e) {
        $.post("/command", {"cmd" : "KEY,V,P"})
        .done(genericButtonCB);
    })
    
    $("#key_SCAN").click(function(e) {
        $.post("/command", {"cmd" : "KEY,S,P"})
        .done(genericButtonCB);
    })
    
    $("#key_HOLD").click(function(e) {
        if (long_press) {
            cmd = "KEY,H,L";
        } else {
            cmd = "KEY,H,P";
        }
        $.post("/command", {"cmd" : cmd})
        .done(genericButtonCB)
    });

    $("#key_function").click(function(e) {
        if (long_press) {
            cmd = "KEY,F,L";
        } else {
            cmd = "KEY,F,P";
        }
        $.post("/command", {"cmd" : cmd})
        .done(genericButtonCB)
    });

    $("#key_VFO_RIGHT").click(function(e) {
        cmd = "KEY,>,P";
        $.post("/command", {"cmd" : cmd})
        .done(genericButtonCB)
    });
    
    $("#key_VFO_LEFT").click(function(e) {
        cmd = "KEY,<,P";
        $.post("/command", {"cmd" : cmd})
        .done(genericButtonCB)
    });
    

    //http://stackoverflow.com/a/23395136
    function beep() {
   var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
            snd.play();
    }
});

