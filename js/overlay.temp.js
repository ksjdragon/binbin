function videoOverlay(url) {
    var overlay = getDefaultOverlay();

    var video = document.createElement("video");
    video.onclick = function() {event.stopPropagation();}
    video.src = url;
    video.controls = true;
    video.autoplay = true;
    video.type = "video/mp4";

    video.style.margin = "auto";
    video.style.backgroundColor = "black";

    video.onloadedmetadata = function() {
        if((video.videoHeight/video.videoWidth) > (window.innerHeight/window.innerWidth)) {
            video.style.height = (window.innerHeight * 0.9).toString() + "px";
        } else {
            video.style.width = (window.innerWidth * 0.9).toString() + "px";
        }   
    }

    var div = document.createElement("div");
    div.style.margin = "auto";
    div.style.gridRow = "1";
    div.style.gridColumn = "1";
    div.appendChild(video);
    overlay.appendChild(div);

    var close = getClose();
    overlay.appendChild(close);

    document.getElementsByTagName("body")[0].appendChild(overlay);
    setTimeout(function() {
        overlay.style.opacity = "1";
    }, 10);   
}

function audioOverlay(url) {
	var overlay = getDefaultOverlay();
	var audio = document.createElement("audio");
	audio.onclick = function() {event.stopPropagation();}
	audio.src = url;
	audio.controls = true;
	audio.autoplay = true;

	audio.style.margin = "auto";
	audio.style.width = (window.innerWidth * 0.9).toString() + "px";

	var div = document.createElement("div");
    div.style.margin = "auto";
    div.style.gridRow = "1";
    div.style.gridColumn = "1";
    div.appendChild(audio);
    overlay.appendChild(div);

    var close = getClose();
    overlay.appendChild(close);

    document.getElementsByTagName("body")[0].appendChild(overlay);
 	setTimeout(function() {
 		overlay.style.opacity = "1";
 	}, 10);
}


function imageOverlay(url) {
    var overlay = getDefaultOverlay();
    var img = new Image();
    img.src = url;
    img.style.margin = "auto";
    
    var image = document.createElement("img");
    image.src = url;
    img.onload = function() {
        var height = img.height;
        var width = img.width;

        
        if((height/width) > (window.innerHeight/window.innerWidth)) {
            image.style.height = (window.innerHeight * 0.9).toString() + "px";
        } else {
            image.style.width = (window.innerWidth * 0.9).toString() + "px";
        } 
    };

    var div = document.createElement("div");
    div.style.margin = "auto";
    div.style.gridRow = "1";
    div.style.gridColumn = "1";
    div.appendChild(image);
    overlay.appendChild(div);

    var close = getClose();
    overlay.appendChild(close);

    document.getElementsByTagName("body")[0].appendChild(overlay);
    setTimeout(function() {
        overlay.style.opacity = "1";
    }, 10);
}