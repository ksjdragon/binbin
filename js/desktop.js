var data, // Stores data from PHP.
	drives,
	navi = {'real': [], 'virtual': []},
	navSelect,
	vis,
	section = 0,
	clickable = true,
	selectName, // Stores name of folder in selected div
	selectDiv, // Stores actual selected div.
	currDir = "",
	spectrum = false; // Stores enable spectrum option.

var sort = {
    "name": -1,
    "date": 1,
    "size": 1,
};

var faIcons = {
    "fol": "folder",
    "mp3": "music",
    "ogg": "music",
    "mp4": "video-camera",
    "zip": "file-zip-o",
    "other": "file-o" 
}

var audioSettings = {
    speed: 1,
    volume: 1,
    mute: false
};

var themeColors = { // For reference and for quick changing if need-be.
	"main": "#3e505a",
	"sidebar": "#2a2e31",
	"highlight": "#fff"
};

/*
var navi = [ // Necessary arguments: id, alias, fa | Optional arguments: subnav. 
	{
		"id": "myFiles",
		"alias": "My Files",
		"fa": "home"
	},
];
*/

function getDrives() {
	$.get('./mydrives').done(function(d) {
		drives = d;
		navSelect = drives['real'][0]['_id']
		types = ['real', 'virtual']
		for(var i = 0; i < types.length; i++) {
			for(var j = 0; j < drives[types[i]].length; j++) {
				item = {
					'id': drives[types[i]][j]['_id'],
					'alias': drives[types[i]][j]['name'],
					'fa': 'home'
				}
				navi[types[i]].push(item)
			}	
		}
		navLayout();
		updateNav(navSelect);
		listDir(currDir, 0);
	});
}

function listDir(dir, sec) { // Directory is the sub-directory, sec is the section of data, if files need to be split up into sections.
    $.post('./files', {'drive_id': navSelect, 'path': currDir}).done(function(d) {
    	data = d;
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
        if(curr.size === undefined) {
        	var size = document.createTextNode("----");
        } else {
        	var size = document.createTextNode(curr.size);
        }
        

        item.childNodes[0].appendChild(name);
        item.childNodes[1].appendChild(modified);
        item.childNodes[2].appendChild(size); 

        var ext = document.createAttribute("ext");

        if(curr.folder) {
            ext.value = "fol";
        } else {
            ext.value = curr.name.substring(curr.name.lastIndexOf(".")+1,curr.name.length).toLowerCase();
            url = "";
            var f = document.createElement("i");
            var a = document.createElement("div");
            a.setAttribute("url", url);
            f.className = "fa fa-files-o transition";
            a.appendChild(f);
            a.onclick = function() {
            	document.getElementById("copy").value = this.getAttribute("url");
			    document.getElementById("copy").select();
			    document.execCommand("copy");
            }
            item.appendChild(a);
        }
        item.setAttributeNode(ext);

        var ico = document.createElement("div");
        ico.className = "fileIcon";
        var faico = document.createElement("i");
        faico.className = "fa fa-" + (faIcons[item.getAttribute("ext")] || faIcons["other"]);
        ico.appendChild(faico);
        item.appendChild(ico);

        item.onclick = function() {
            if(clickable == true) {
                var name = this.childNodes[0].innerText;
                //url = getURI(name);
                attr = this.getAttribute("ext");
                /*if(attr == "fol") {
                	document.querySelectorAll("#info a")[0].href = "";
                } else {
                	document.querySelectorAll("#info a")[0].href = url;
                }*/
                if(selectName == name) {
                    clickable = false;
                    if(attr == "fol") {
                        clearTbl();
                        setTimeout(function() {
                            currDir += "/"+name;
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
    overlay.className = "overlay transition";
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.minHeight = "100%";
    overlay.style.minWidth = "100%";
    overlay.style.background = 'rgba(0,0,0,0.8)';
    overlay.style.zIndex = "50";
    overlay.style.display = "grid";
    overlay.style.gridTemplateColumns = "1fr";
    overlay.style.gridTemplateRows = "1fr";
    overlay.style.opacity = "0";

    return overlay;
}

function getClose() {
    var close = document.createElement("i");
    close.className = "fa fa-times transition";
    var attr = document.createAttribute("aria-hidden");
    attr.value = "true";
    close.setAttributeNode(attr);

    close.onclick = function() {
        this.style.color = "#f13838";
        that = this;
        document.getElementsByClassName("overlay")[0].opacity = "0";
        setTimeout(function() {
            that.style.color = "white";
            document.getElementsByTagName("body")[0].removeChild(document.getElementsByClassName("overlay")[0]);
            clickable = true;
        }, 300);
    };

    return close;
}

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

function updateLocation() {
    var loc = document.getElementById("directoryLocation");
    while(loc.firstChild) loc.removeChild(loc.firstChild);
    loc.style.opacity = "1";
    var subdir = currDir.split("/");
    
    for(var i = 0; i < subdir.length; i++) {
        var p = document.createElement("p");
        var ic = document.createElement("i");
        ic.className = "fa fa-angle-right";
        if(i !== 0) loc.appendChild(ic);
        if(i === 0) {
        	driveName = document.getElementById(navSelect).textContent;
            p.appendChild(document.createTextNode(driveName));
        } else {
            p.appendChild(document.createTextNode(subdir[i]));
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

function navLayout() {
	createNavHeader("Real Drives");
	createNav(navi['real']);
	createNavHeader("Virtual Drives");
	createNav(navi['virtual']);
}

function createNavHeader(text) {
	var side = document.getElementById("sidebarItems");
	var div = document.createElement("div");
	div.className = "naviHead transition";
	div.appendChild(document.createTextNode(text));
	side.appendChild(div);
}

function createNav(navi) {
    for (var i = 0; i < navi.length; i++) { // Create navigation tabs.
        var side = document.getElementById("sidebarItems");
        var div = document.createElement("div");
        div.id = navi[i].id;
        div.className = "navi transition";
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
        		//updateMain(op);
        	}
        	var p2 = document.createElement("p");
        	p2.appendChild(document.createTextNode(subNav[j].alias));
        	eachSubNav.appendChild(p2);
        	subNavCont.appendChild(eachSubNav);
        }
        side.appendChild(subNavCont);
    }
}

function updateNav(op) { // Updates the sidebar navigation (if navigation tabs are ever dynamically implemented).
    var oldNav = document.getElementById(navSelect);
    var newNav = document.getElementById(op);
    oldNav.style.backgroundColor = "rgba(0,0,0,0)";
    oldNav.style.color = "white";
    newNav.style.backgroundColor = themeColors.main;
    newNav.style.color = themeColors.highlight;
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

function clearTbl() {
    selected = undefined;
    selectDiv = undefined;
    document.getElementById("directoryCont").style.opacity = "0";
    document.getElementById("directoryLocation").style.opacity = "0";
}

function checkHash() {
    if(window.location.hash) {
        currDir = window.location.hash.replace(/[_]+/g, " ").replace(/[\*]+/g,"/").replace("#","");
    }
    listDir(currDir,0);
    window.location.hash = "";
}

getDrives();
sortButtons();
audioControls();
