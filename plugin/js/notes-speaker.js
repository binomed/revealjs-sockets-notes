/**
 * Handles opening of and synchronization with the reveal.js
 * notes window.
 */
var RevealSpeakerNotes = (function() {
    
    var conf = null; // parameters comming from conf.json (with port for WebSockets)
    var defaultInterval = 2; // Time in minute of the conference
    var limitAlert = 1; // time before the end where we have to alert the speaker (if defaultInterval is upper limitAlert)
    var totalTime = 0; // Total time ellapsed during the presentation
    var timeStart = false; // true if the time loader is on
    var couldUnlock = false; // true if the client is ready for websocket control

    // Wait for load of document
	window.addEventListener( 'load', function() {
        
        // Plug Fastclick module        
        FastClick.attach(document.body);
        
        // Connection to socket to 
    
        // Read configuration file for getting server port
        $.getJSON('../conf/conf.json', function(data){              
            conf = data;
            //Init the webSocket and time management
            init();
        }).error(function(e){
            console.log("Error during getting config file : "+e);
        });

    }, false );

    // String function for number formating
    function zeroPadInteger( num ) {
        var str = "00" + parseInt( num );
        return str.substring( str.length - 2 );
    }
    
    // WebSocket initialisation and time management initialisation
    function init(){
        
        initSocket();
        timeManagement();
    }
    
    
    // Connect to websocket on host
    function initSocket(){
        var socket = io.connect('http://'+window.location.hostname+':'+conf.port);
        var localUrl = null;
        var indices = null;
        var fragment = 0;
        // Socket IO connect
        socket.on('connect',function(){
            // Send a ping message for getting config
           socket.emit('message', {type:'ping'}); 
        });

        // Get all the html elementsto monitor
        var notes = $('#content-notes' );        
        var curentSlideIndex = $('.curent-slide');
        var nextSlideIndex = $('.next-slide');
        var totalSlideIndex = $('.nb-slides');
        var next = $( '#next' );
        var prev = $( '#prev' );
        var up = $( '#up' );
        var down = $( '#down' );
        var show = $( '#show' );

        // Buttons interaction
        next.on('click', function(){
            socket.emit('message', {type : 'operation', data : 'next'});
        });
        prev.on('click', function(){
            socket.emit('message', {type : 'operation', data : 'prev'});
        });
        up.on('click', function(){
            socket.emit('message', {type : 'operation', data : 'up'});
        });
        down.on('click', function(){
            socket.emit('message', {type : 'operation', data : 'down'});
        });
        show.on('click', function(){
            socket.emit('message', {type : 'operation', data : 'show', index: indices, fragment : fragment});
            socket.emit('message', {type : 'operation', data : 'next'});
        });

        // Message from presentation
        socket.on("message", function(json){
            // Message send when recieving notes
            if (json.type === "notes"){							
                if( json.data.markdown ) {
                    notes.html(marked( json.data.notes ));
                }
                else {
                    notes.html(json.data.notes);
                }
            }else  // Message recieve on each change of slide
                if (json.type === "config"){	
                    // We unlock the presentation if we have a client
                    if (!couldUnlock){
                        $("#show").removeAttr("disabled");
                    }
                    couldUnlock = couldUnlock || true;
                    // If we have to load the speaker slide versions (recieve the url of presentation)
                    if (json.url && !localUrl){
                       localUrl = "http://"+window.location.hostname+":"+conf.port+json.url+"#speakerNotes";
                       var iframe = document.getElementById("next-slide");                                              
                       iframe.src = localUrl;
                       iframe.onload = function(){
                           
                       }                   
                       totalSlideIndex.html(json.nbSlides);
                    }else  // If we recieve the index of presentation
                        if (json.indices){
                            indices = json.indices;
                            fragment = 0;
                            curentSlideIndex.html(indices.h+indices.v);       
                            nextSlideIndex.html(indices.h+indices.v+1);       
                            if (json.controls){
                                if (json.controls.right) next.removeAttr("disabled"); 
                                else next.attr("disabled", true); 
                                if (json.controls.left) prev.removeAttr("disabled"); 
                                else prev.attr("disabled", true); 
                                if (json.controls.up) up.removeAttr("disabled"); 
                                else up.attr("disabled", true); 
                                if (json.controls.down) down.removeAttr("disabled"); 
                                else down.attr("disabled", true); 
                            }
                            
                    }else // If we recieve a fragment modification
                        if (json.fragment){
                            if (json.fragment === '+1'){
                                fragment++;
                            }else{
                                fragment = Math.min(0, fragment++);
                            }
                    }
            }
        });
    }
    
    // Time management
    function timeManagement(){
        // Time Management
        var start = new Date(),
        timeEl = document.querySelector( '#time' ),
        //clockEl = document.getElementById( 'clock' ),
        hoursEl = document.getElementById( 'hours' ),
        minutesEl = document.getElementById( 'minutes' ),
        secondsEl = document.getElementById( 'seconds' );
        
        
        // Show / Hide methods
        $('#config_ellapsed_cancel').on('click',function(){
            $('#configEllapsed').hide();
            $('#ellapsedTime').show();
            $('#timeMenu').show();
            $('#timeTitleMenu').hide();
        });
        $('#config_ellapsed_validate').on('click',function(){
            $('#configEllapsed').hide();
            $('#ellapsedTime').show();
            $('#timeMenu').show();
            $('#timeTitleMenu').hide();
            defaultInterval = $('#config_interval').val();
        });
        $('#timeMenu').on('click',function(){
            $('#ellapsedTime').hide();
            $('#configEllapsed').show();
            $('#timeMenu').hide();
            $('#timeTitleMenu').show();
        });
        
        
        // Actions
        $('#action_time_play').on('click',function(){
            $('#action_time_pause').show();
            $('#action_time_play').hide();
            timeStart = true;
            start  = new Date();
        });
        $('#action_time_pause').on('click',function(){
            $('#action_time_pause').hide();
            $('#action_time_play').show();
            timeStart = false;
            totalTime = totalTime + (new Date().getTime() - start.getTime());
        });
        $('#action_time_stop').on('click',function(){
            $('#action_time_pause').hide();
            $('#action_time_play').show();
            $(".loader-spiner").removeClass("loader-spinner-alert");
            $(".loader-spiner").addClass("loader-spiner");
            timeStart = false;
            totalTime  = 0;
            renderProgress(0);
        });
        
        
        
        // Time interval for management of time
        setInterval( function() {
        
            timeEl.style.opacity = 1;
        
            var diff, hours, minutes, seconds,
                now = new Date();
            if (timeStart){
                diff = now.getTime() - start.getTime();
                defaultInterval = defaultInterval > 0 ? defaultInterval : 60;
                var totalDiff = diff + totalTime;
                var alertTime = (defaultInterval * 60 * 1000) - (limitAlert * 60 * 1000);
                hours = parseInt( totalDiff / ( 1000 * 60 * 60 ) );
                minutes = parseInt( ( totalDiff / ( 1000 * 60 ) ) % 60 );
                seconds = parseInt( ( totalDiff / 1000 ) % 60 );
            
                hoursEl.innerHTML = zeroPadInteger( hours );
                hoursEl.className = hours > 0 ? "" : "mute";
                minutesEl.innerHTML = ":" + zeroPadInteger( minutes );
                minutesEl.className = minutes > 0 ? "" : "mute";
                secondsEl.innerHTML = ":" + zeroPadInteger( seconds );
                
                var diffPercent = (totalDiff / (defaultInterval * 60 * 1000)) * 100;                
                renderProgress(diffPercent % 100);
                
                
                if (totalDiff > alertTime && !$(".loader-spiner").hasClass("loader-spinner-alert")){
                    $(".loader-spiner").addClass("loader-spinner-alert");
                    $(".loader-spiner").removeClass("loader-spiner");
                }
            }
        }, 1000 );
    }
    
    function renderProgress(progress){
        progress = Math.floor(progress);
        if(progress<25){
            var angle = -90 + (progress/100)*360;
            $(".animate-0-25-b").css("transform","rotate("+angle+"deg)");
            $(".animate-25-50-b").css("transform","rotate(-90deg)");
            $(".animate-50-75-b").css("transform","rotate(-90deg)");
            $(".animate-75-100-b").css("transform","rotate(-90deg)");
        }
        else if(progress>=25 && progress<50){
            var angle = -90 + ((progress-25)/100)*360;
            $(".animate-0-25-b").css("transform","rotate(0deg)");
            $(".animate-25-50-b").css("transform","rotate("+angle+"deg)");
            $(".animate-50-75-b").css("transform","rotate(-90deg)");
            $(".animate-75-100-b").css("transform","rotate(-90deg)");
        }
        else if(progress>=50 && progress<75){
            var angle = -90 + ((progress-50)/100)*360;
            $(".animate-25-50-b, .animate-0-25-b").css("transform","rotate(0deg)");
            $(".animate-50-75-b").css("transform","rotate("+angle+"deg)");
            $(".animate-75-100-b").css("transform","rotate(-90deg)");
        }
        else if(progress>=75 && progress<=100){
            var angle = -90 + ((progress-75)/100)*360;
            $(".animate-50-75-b, .animate-25-50-b, .animate-0-25-b")
                                                  .css("transform","rotate(0deg)");
            $(".animate-75-100-b").css("transform","rotate("+angle+"deg)");
        }
    }
    


	return {};
})();
