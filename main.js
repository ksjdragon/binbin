var data, // Stores data from PHP.
	vis,
	section = 0,
	clickable = true,
	selectName, // Stores name of folder in selected div
	selectDiv, // Stores actual selected div.
	currDir = "",
	spectrum = false; // Stores enable spectrum option.

var sort = {
    "name": 1,
    "date": 1,
    "size": 1,
};
var audioSettings = {
    speed: 1,
    volume: 1,
    mute: false
};

var themeColors = { // For reference and for quick changing if need-be.
	"main": "#070606",
	"sidebar": "#151313",
	"highlight": "#63d4ff"
};

var navSelect = "myFiles"; // In the future, this can be dynamically updated, but for demonstration purposes, this is set.
var subNavSelect = "";

var navi = [ // Necessary arguments: id, alias, fa | Optional arguments: subnav. 
	{
		"id": "myFiles",
		"alias": "My Files",
		"fa": "home"
	},
];

function getData() {
    $.when($.ajax({
        type : 'POST',
        url: 'main.php',
        data: {rootdir: 'rootdir'}
    })).done(function(d) {
        rootDir = d;
        listDir(currDir,0);
    });
}

function listDir(dir, sec) { // Directory is the sub-directory, sec is the section of data, if files need to be split up into sections.
    var real = rootDir+dir;
    $.when($.ajax({
        type : 'POST',
        url: 'api.floofy.php',
        data: {getdir : [real, sec]},
    })).done(function(d) {
        data = d;
        if(sec == 0) {
            data[0].splice(0,2);
            data[1].splice(0,3);
            data[2].splice(0,3);
            data[3].splice(0,3);
        } else {
            data[1].splice(0,1);
            data[2].splice(0,1);
            data[3].splice(0,1);
        }
        var toObj = [];
        for(var i = 0; i < data[0].length; i++) {
            toObj.push({
                name: data[0][i],
                folder: data[1][i],
                date: data[2][i],
                size: data[3][i]
            });
        }
        data = toObj;
        sortFiles("name", -1);
        clickable = true;
    });
}

function sortFiles(type, direction) {
    switch(type) {
        case "name":
            data.sort(function(a, b){ return (a.name < b.name) ? direction*1 : direction*-1;});
            break;
        case "date":
            data.sort(function(a, b){ 
                a = a.date.replace(",","").split(" ");
                b = b.date.replace(",","").split(" ");
                a = Date.parse(a[1] + " " + a[0] + " " + a[2]);
                b = Date.parse(b[1] + " " + b[0] + " " + b[2]);

                return (a < b) ? direction*1 : direction*-1;
            });
            break;
        case "size":
            data.sort(function(a, b){ return (a.size.replace("B","").substring(0, a.size.length-1) < b.size.replace("B","").substring(0, b.size.length-1)) ? direction*1 : direction*-1;});
    }
    var ico = document.querySelectorAll("#directoryHeader i");
    for(var i = 0; i < ico.length; i++) {
        ico[i].style.opacity = "0";
    }
    setTimeout(function() {
        for(var i = 0; i < ico.length; i++) {
            ico[i].style.display = "none";
        }
        var arrow = document.querySelectorAll("#directoryHeader ."+type+" i.fa-chevron-" + ((direction < 0) ? "up" : "down"))[0];
        arrow.style.display = "block"
        setTimeout(function() {
            arrow.style.opacity = "1";
        }, 1);
    }, 300);
    try {
        clearTbl();
        setTimeout(function() {
            document.getElementById("directory").removeChild(document.getElementById("directoryCont"));
            dispDir();
        }, 300);
    } catch(err) {
        dispDir();
    }   
}

function dispDir() {
    updateLocation();
    try {
        document.getElementById("directory").removeChild(document.getElementById("directoryCont"));
    } catch(err) {}
    var cont = document.createElement("div");
    cont.id = "directoryCont";
    cont.style.opacity = "0";
    cont.className = "transition";

    selectName = "";
    var item;
    if(data.length === 0) {
    	var p = document.createElement("p");
    	p.appendChild(document.createTextNode("Nothing here!"));
    	p.style.fontWeight = "100";
    	cont.appendChild(p);
    }
    for(var i = 0; i < data.length; i++) {
        item = createRow();

        var curr = data[i];
        var name = document.createTextNode(curr.name);
        var modified = document.createTextNode(curr.date);
        var size = document.createTextNode(curr.size);

        item.childNodes[0].appendChild(name);
        item.childNodes[1].appendChild(modified);
        item.childNodes[2].appendChild(size); 

        var ext = document.createAttribute("ext");

        if(curr.folder == "true") {
            ext.value = "fol";
        } else {
            ext.value = curr.name.substring(curr.name.lastIndexOf(".")+1,curr.name.length).toLowerCase();
        }
        item.setAttributeNode(ext);

        item.onclick = function() {
            if(clickable == true) {
                var name = this.childNodes[0].innerText;
                url = getURI(name);
                if(selectName == name) {
                    clickable = false;
                    attr = this.getAttribute("ext");
                    if(attr == "fol") {
                        clearTbl();
                        setTimeout(function() {
                            currDir += name+"/";
                            listDir(currDir,0);
                        }, 300)
                        return;
                    } else if (attr == "mkv" || attr == "mp4") {
                        videoOverlay(url);
                    } else if (attr == "png" || attr == "jpg" || attr == "gif") {
                        imageOverlay(url);
                    } else if (attr == "mp3" || attr == "ogg") {
                    	playFile(url, name);
                        clickable = true;
                    } else {
                        downloadFile(rootDir + currDir + name, 'n');
                        clickable = true;
                    }
                }
                selectName = name;
                selectDiv = this;
                for(var i =0; i < document.getElementsByClassName("item").length;i++){
                    document.getElementsByClassName("item")[i].style.backgroundColor = "";
                }
                this.style.backgroundColor = "rgba(255,255,255,0.2)";
            }
        }
        cont.appendChild(item);
        item = null;
    }
    document.getElementById("directory").appendChild(cont);
    setTimeout(function() {
        document.getElementById("directoryCont").style.opacity = "1";
    }, 100);
}

function createRow() {
    var item = document.createElement("div");
    item.className = "item transition";
    var name = document.createElement("p");
    name.className = "name";
    item.appendChild(name);
    var modified = document.createElement("p");
    modified.className = "modified";
    item.appendChild(modified);
    var size = document.createElement("p");
    size.className = "size";
    item.appendChild(size);
    return item;
}

function getDefaultOverlay() {
    var overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.minHeight = "100%";
    overlay.style.minWidth = "100%";
    overlay.style.background = 'rgba(0,0,0,0.8)';
    overlay.style.zIndex = "50";

    return overlay;
}

function getClose() {
    var close = document.createElement("i");
    close.className = "fa fa-times";
    var attr = document.createAttribute("aria-hidden");
    attr.value = "true";
    close.setAttributeNode(attr);

    close.onclick = function() {
        document.getElementsByTagName("body")[0].removeChild(document.getElementsByClassName("overlay")[0]);
        clickable = true;
    };

    return close;
}

function imageOverlay(url) {

    var img = new Image();
    img.src = url;
    img.onload = function() {
        var height = img.height;
        var width = img.width;

        var overlay = getDefaultOverlay();

        var image = document.createElement("img");
        image.src = url;
        image.style.position = "fixed";
        image.style.top = "50%";
        image.style.left = "50%";


        if (width / height < 16 / 9) {
            image.style.height = (window.innerHeight * 0.85).toString() + "px";
            image.style.width = (image.style.height.replace("px", "") * width / height).toString() + "px";
        } else {
            image.style.width = (window.innerWidth * 0.85).toString() + "px";
            image.style.height = (image.style.width.replace("px", "") * height / width).toString() + "px";
        }

        image.style.marginTop = (image.style.height.replace("px", "") / -2).toString() + "px";
        image.style.marginLeft = (image.style.width.replace("px", "") / -2).toString() + "px";

        overlay.appendChild(image);

        var close = getClose();
        overlay.appendChild(close);

        document.getElementsByTagName("body")[0].appendChild(overlay);
    };
}

function videoOverlay(url) {
    var overlay = getDefaultOverlay();

    var video = document.createElement("video");
    video.src = +url;
    video.controls = true;
    video.autoplay = true;
    video.type = "video/mp4";

    document.addEventListener("keydown", function(event) {
        if ((event || window.event).keyCode === 32) {
            video.paused ? video.play() : video.pause();
        }

        if ((event || window.event).keyCode === 27) {
            document.getElementsByTagName("body")[0].removeChild(document.getElementsByClassName("overlay")[0]);
        }
    });

    video.style.position = "fixed";
    video.style.top = "50%";
    video.style.left = "50%";
    var height = window.innerHeight * 0.4305;
    video.style.marginTop = (height / -2).toString() + "px";
    video.style.marginLeft = (height * -16 / 18).toString() + "px";
    video.style.height = height.toString() + "px";
    video.style.width = (height * 16 / 9).toString() + "px";
    overlay.appendChild(video);

    var close = getClose();
    overlay.appendChild(close);

    document.getElementsByTagName("body")[0].appendChild(overlay);
}

function updateLocation() {
    var loc = document.getElementById("directoryLocation");
    while(loc.firstChild) loc.removeChild(loc.firstChild);
    loc.style.opacity = "1";
    var subdir = currDir.split("/");
    subdir = subdir.slice(0, subdir.length-1);
    for(var i = 0; i < subdir.length+1; i++) {
        var p = document.createElement("p");
        var ic = document.createElement("i");
        ic.className = "fa fa-angle-right";
        if(i !== 0) loc.appendChild(ic);
        if(i === 0) {
            p.appendChild(document.createTextNode("DOJC Mixtapes"));
        } else {
            p.appendChild(document.createTextNode(subdir[i-1]));
        }
        if(i !== subdir.length) {
            p.style.cursor = "pointer";
            p.className = "subdir transition";
            p.onclick = function() {
                clickable = false;
                clearTbl();
                subdirNum = subdir.indexOf(this.innerText);
                if(subdirNum === -1) {
                    currDir = "";
                } else {
                    currDir = subdir.slice(0, subdirNum+1).reduce(function(a,b) { return a+"/"+b; })+"/";
                }
                listDir(currDir, 0);
            }
        }   
        loc.appendChild(p);
    }
}

function getURI(name) {
	var dirs = (rootDir+currDir+name).split("/");
	var uri = window.location.origin;
	for(var i = 1; i < dirs.length; i++) uri+="/"+encodeURIComponent(dirs[i]);
	return uri;
}

function createNav() {
    for (var i = 0; i < navi.length; i++) { // Create navigation tabs.
        var side = document.getElementById("sidebar");
        var div = document.createElement("div");
        div.className = "navi transition";
        div.setAttribute("option", navi[i].id);
        div.onclick = function() {
            var op = this.getAttribute("option");
            if (navSelect === op) return;
            updateMain(op);
        };
        var ic = document.createElement("i");
        ic.className = "fa fa-" + navi[i].fa;
        ic["aria-hidden"] = true;
        var p = document.createElement("p");
        p.appendChild(document.createTextNode(navi[i].alias));
        div.appendChild(ic);
        div.appendChild(p);
        side.appendChild(div);
        var subNav = navi[i].subNav;
        if(!subNav) continue;

        var subNavCont = document.createElement("div");
        subNavCont.className = "naviInner";
        subNavCont.setAttribute("option", navi[i].id);
        for(var j = 0; j < subNav.length; j++) {
        	var eachSubNav = document.createElement("div");
        	eachSubNav.className = "transition";
        	eachSubNav.setAttribute("option", navi[i].id+"&"+subNav[j].id);
        	eachSubNav.onclick = function() {
        		var op = this.getAttribute("option");
        		if(subNavSelect === op) return;
        		updateMain(op);
        	}
        	var p2 = document.createElement("p");
        	p2.appendChild(document.createTextNode(subNav[j].alias));
        	eachSubNav.appendChild(p2);
        	subNavCont.appendChild(eachSubNav);
        }
        side.appendChild(subNavCont);
    }
}

function updateNav(op) { // Updates the sidebar navigation (if naviagation tabs are ever dynamically implemented).
    var oldNav = document.querySelectorAll("[option=" + navSelect + "]")[0];
    var newNav = document.querySelectorAll("[option=" + op + "]")[0];
    oldNav.style.backgroundColor = "rgba(0,0,0,0)";
    oldNav.style.color = "white";
    newNav.style.backgroundColor = themeColors.main;
    newNav.style.color = themeColors.highlight;
}

function updateMain(op) { // Updates the actual page.
    updateNav(op);
    switch(op) { 
    	case "home":
    		window.location = "http://discordonlinejammingcentral.com/";
    		break;
    	case "forums":
    		window.location = "http://discordonlinejammingcentral.com/";
    		break;
    	case "memberList":
    		window.location = "http://discordonlinejammingcentral.com/memberlist.php";
    		break;
    	case "calendar":
    		window.location = "http://discordonlinejammingcentral.com/calendar.php";
    		break;
    	case "help":
    		window.location = "http://discordonlinejammingcentral.com/misc.php?action=help";
    		break;
    	case "songList":
    		// Implement if dynamic
    		break;
    }
    navSelect = op;
}

function sortButtons() {
    document.querySelectorAll("#directoryHeader .name")[0].onclick = function() {
        sort.name = sort.name * -1;
        sortFiles("name", sort.name);
    };
    document.querySelectorAll("#directoryHeader .date")[0].onclick = function() {
        sort.date = sort.date * -1;
        sortFiles("date", sort.date);
    };
    document.querySelectorAll("#directoryHeader .size")[0].onclick = function() {
        sort.size = sort.size * -1;
        sortFiles("size", sort.size);
    };
}

function visualize(url) {
	if(!spectrum) return;
	vis = new Visualizer();
	vis.ini();
	vis._visualize(url, document.getElementById("visualize"), document.getElementsByTagName("audio")[0]);
}

function playFile(url, name) {
    var audio = document.getElementsByTagName("audio")[0];
    document.querySelectorAll("#playback h2")[0].innerText = name;
    document.querySelectorAll("#info a")[0].href = url;
    audio.src = url;
    document.querySelectorAll("#speed i")[0].click();
    audio.play();
    if(vis) {
		(spectrum) ? vis._restart() : vis._stop();
	} else {
		visualize(url);
	}
}

function audioControls() {
    var audio = document.getElementsByTagName("audio")[0];
    document.querySelectorAll("#speed input")[0].oninput = function() {
        audioSettings.speed = (this.value/50) + 0.5; 
        audio.playbackRate = audioSettings.speed;
    };
    document.querySelectorAll("#speed i")[0].onclick = function() {
        audio.playbackRate = 1;
        document.querySelectorAll("#speed input")[0].value = "25";
    };
    document.querySelectorAll("#volume input")[0].oninput = function() {
        audioSettings.volume = this.value/100;
        if(audioSettings.volume >= 2/3) document.querySelectorAll("#volume i")[0].className = "fa fa-volume-up transition";
        if(audioSettings.volume < 2/3 && audioSettings.volume >= 1/3) document.querySelectorAll("#volume i")[0].className = "fa fa-volume-down transition";
        if(audioSettings.volume < 1/3) document.querySelectorAll("#volume i")[0].className = "fa fa-volume-off transition";
        audio.volume = audioSettings.volume;
    };
    document.querySelectorAll("#volume i")[0].onclick = function() {
        audioSettings.mute = !audioSettings.mute;
        audio.volume = (audioSettings.mute) ? 0 : audioSettings.volume;
        (audioSettings.mute) ? this.style.color = "#ff1a1a" : this.style.color = "white";
    };
    document.querySelectorAll("#pause")[0].onclick = function() {
        if(audio.src === "") return;
        if(audio.paused) {
            audio.play();
            this.className = "fa fa-pause-circle transition";
        } else {
            audio.pause();
            this.className ="fa fa-play-circle transition";
        }
    };
    audio.ontimeupdate = function() {
    	if(isNaN(audio.duration)) return;
        var end = Math.floor(audio.duration%60).toString();
        if(end.length === 1) end = "0"+end;
        var played = Math.floor(audio.currentTime%60).toString();
        if(played.length === 1) played = "0"+played;
        document.querySelectorAll("#tracker p")[0].innerText = Math.floor(audio.currentTime/60)+":"+played;
        document.querySelectorAll("#tracker p")[1].innerText = Math.floor(audio.duration/60)+":"+end;
        document.querySelectorAll("#tracker input")[0].value = Math.floor(100000*audio.currentTime/audio.duration);
    };
    document.querySelectorAll("#tracker input")[0].oninput = function() {
        if(audio.src === "") {
            this.value = "0";
            return;
        }
        var curr = audio.duration*this.value/100000;
        var currRead = Math.floor(curr%60);
        if(currRead.length === 1) currRead = "0"+currRead;
        document.querySelectorAll("#tracker p")[0].innerText = Math.floor(curr/60)+":"+currRead;
        audio.currentTime = curr;
    };
    document.querySelectorAll("#spectrum p")[0].onclick = function() {
    	spectrum = !spectrum;
    	if(spectrum) {
    		document.querySelectorAll("#spectrum i")[0].className = "fa fa-check-circle";
    		document.getElementsByTagName("canvas")[0].style.display = "block";
    	} else {
    		document.querySelectorAll("#spectrum i")[0].className = "fa fa-times-circle";
    		document.getElementsByTagName("canvas")[0].style.display = "none";
    	}
    	if(vis) {
    		(spectrum) ? vis._restart() : vis._stop();
    	} else {
    		visualize(url);
    	}
    };
    document.getElementById("prev").onclick = function() {
    	try {
	    	if(selectDiv == undefined) {
	    		return;
	        } else {
	        	newDiv = selectDiv.previousElementSibling;
	        	while(newDiv.getAttribute("ext") === "fol") newDiv = newDiv.previousElementSibling;
	            newDiv.click();
	            newDiv.click();
	        }
	    } catch(err) {}
    };
    document.getElementById("next").onclick = function() {
    	try {
	    	if(selectDiv == undefined) {
	    		newDiv = document.getElementById("directoryCont").childNodes[0];
	        } else {
	            newDiv = selectDiv.nextElementSibling;
	        }
	        while(newDiv.getAttribute("ext") === "fol") newDiv = newDiv.nextElementSibling;
    		newDiv.click();
    		newDiv.click();
	    } catch(err) {}
    };
}

document.addEventListener("keydown", function(event) {
    try {
        switch((event || window.event).keyCode) {
            case 13:
                selectDiv.click();
                break;
            case 38:
                selectDiv.previousElementSibling.click();
                break;
            case 40:
                if(selectDiv == undefined) {
                    document.getElementById("directoryCont").childNodes[0].click();
                } else {
                    selectDiv.nextElementSibling.click();
                }
                break;
            case 8:
                var subdirs = document.getElementsByClassName("subdir");
                subdirs[subdirs.length-1].click();
                break;
            case 32:
                var audio = document.getElementsByTagName("audio")[0];
                if(audio.paused) {
                    audio.play();
                    document.querySelectorAll("#pause")[0].className = "fa fa-pause-circle transition";
                } else {
                    audio.pause();
                    document.querySelectorAll("#pause")[0].className ="fa fa-play-circle transition";
                }
                break;
        }
    } catch(err) {}
});

function downloadFile(url, u) {
    window.location.assign("http://" + window.location.hostname + ":8080/html/download.php?name=" + url + "&u=" + u);
}

function clearTbl() {
    selected = undefined;
    selectDiv = undefined;
    table = document.getElementsByClassName("items")[0];
    table.style.opacity = "0";
    console.log(table.childNodes.length);
    document.getElementById("permalink").value = "";
}


/*document.getElementById("permalink").onclick = function() {
    this.select();
    document.execCommand("copy");
};*/

getData();
createNav();
updateMain(navSelect);
sortButtons();
audioControls();
