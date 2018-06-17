var data, // Stores data from PHP.
	section = 0,
	clickable = true,
	selectName, // Stores name of folder in selected div
	selectDiv, // Stores actual selected div.
	currDir = "";

var sort = {
    "name": -1,
    "date": 1,
    "size": 1,
};

var faIcons = {
	"fol": "folder",
	"mp3": "music",
	"wav": "music",
	"ogg": "music",
	"mp4": "video-camera",
	"zip": "file-zip-o",
	"other": "file-o" 
};

var navi = [ // Necessary arguments: id, alias, fa | Optional arguments: subnav. 
	{
		"id": "myFiles",
		"alias": "My Files",
		"fa": "home"
	},
];

var navSelect = "myFiles";

var themeColors = { // For reference and for quick changing if need-be.
	"main": "#3e505a",
	"sidebar": "#2a2e31",
	"highlight": "#fff"
};

function getData() {
    $.when($.ajax({
        type : 'POST',
        url: 'main.php',
        data: {rootdir: 'rootdir'}
    })).done(function(d) {
        rootDir = JSON.parse(d);
        checkHash();
    });
}

function listDir(dir, sec) { // Directory is the sub-directory, sec is the section of data, if files need to be split up into sections.
    var real = rootDir+dir;
    $.when($.ajax({
        type : 'POST',
        url: 'main.php',
        data: {getdir : [real, sec]},
    })).done(function(d) {
        data = JSON.parse(d);
        if(data[0] === null) {
            currDir = "";
            listDir(currDir, 0);
            return;
        }
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
    var p = document.querySelectorAll("#directoryHeader p:nth-child(2)")[0];
    var i = document.querySelectorAll("#directoryHeader i")[0];
    p.style.opacity = "0";
    i.style.opacity = "0";
    setTimeout(function() {
        p.innerText = type[0].toUpperCase() + type.substring(1,type.length);
       	i.className = "fa fa-arrow-" + ((direction < 0) ? "up" : "down") + " transition";
        p.style.opacity = "1";
        i.style.opacity = "1";
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
        var otherInfo = document.createTextNode(curr.date.split(" | ")[0] + " | " + curr.size);

        item.childNodes[0].appendChild(name);
        item.childNodes[1].appendChild(otherInfo);

        var ext = document.createAttribute("ext");

        if(curr.folder == "true") {
            ext.value = "fol";
        } else {
            ext.value = curr.name.substring(curr.name.lastIndexOf(".")+1,curr.name.length).toLowerCase();
            url = getURI(curr.name);
            var f = document.createElement("i");
            var a = document.createElement("div");
            a.setAttribute("url", url);
            f.className = "fa fa-files-o transition";
            a.appendChild(f);
            a.onclick = function() {
            	this.style.backgroundColor = "rgba(0,0,0,0.4)";
            	that = this;
				setTimeout(function() {
					that.style.backgroundColor = "rgba(0,0,0,0)";
				}, 300);
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
                url = getURI(name);
                attr = this.getAttribute("ext");
                var download = document.querySelectorAll("#dotMenu a")[0]
                if(attr == "fol") {
                	download.href = ""
                	download.style.color = "rgba(0,0,0,0.5)";
                } else {
                	download.href = url;
                	download.style.color = "rgba(0,0,0,1)";
                }
                if(selectName == name) {
                    clickable = false;
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
                    	audioOverlay(url);
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

function createRow() {
    var item = document.createElement("div");
    item.className = "item transition";
    var name = document.createElement("p");
    name.className = "name";
    item.appendChild(name);
    var modified = document.createElement("p");
    modified.className = "modified";
    item.appendChild(modified);
    return item;
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

function clearTbl() {
    selected = undefined;
    selectDiv = undefined;
    document.getElementById("directoryCont").style.opacity = "0";
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

function updateNav(op) { // Updates the sidebar navigation (if naviagation tabs are ever dynamically implemented).
    var oldNav = document.querySelectorAll("[option=" + navSelect + "]")[0];
    var newNav = document.querySelectorAll("[option=" + op + "]")[0];
    oldNav.style.backgroundColor = "rgba(0,0,0,0)";
    oldNav.style.color = "white";
    newNav.style.backgroundColor = themeColors.main;
    newNav.style.color = themeColors.highlight;
}

function updateLocation() {
	window.location.hash = currDir.replace(/[\/]+/g,"*").replace(/ /g, "_");
	var i = document.querySelectorAll("#header div:first-child i")[0];
	document.getElementById("location").innerText = (currDir === "") ? "BinBin" : currDir.split("/").slice(-2)[0];
	if(currDir === "" && !i.className.includes("fa-bars")) {
		i.style.opacity = "0";
		setTimeout(function() {
			i.className = "fa fa-bars transition";
			i.style.opacity = "1"
		}, 300);
	} else if(currDir !== "" && !i.className.includes("fa-arrow-left")) {
		i.style.opacity = "0";
		setTimeout(function() {
			i.className = "fa fa-arrow-left transition";
			i.style.opacity = "1";
		}, 300);
	}
}

function checkHash() {
    if(window.location.hash) {
        currDir = window.location.hash.replace(/[_]+/g, " ").replace(/[\*]+/g,"/").replace("#","");
    }
    listDir(currDir,0);
    window.location.hash = "";
}

function closeMenuOverlay() {
	var overlay = document.getElementById("menuOverlay");
	overlay.style.opacity = "0";
	setTimeout(function() {
		overlay.style.display = "none";
	}, 300);
	document.getElementById("optionContainer").style.bottom = "-60%";
}

function sortButtons() {
	document.querySelectorAll("#optionContainer p:first-child")[0].onclick = function() {event.stopPropagation();}
	document.querySelectorAll("#optionContainer p:nth-child(2)")[0].onclick = function() {
		event.stopPropagation();
		closeMenuOverlay();
		sort.name = sort.name * -1;
        sortFiles("name", sort.name);
	}
	document.querySelectorAll("#optionContainer p:nth-child(3)")[0].onclick = function() {
		event.stopPropagation();
		closeMenuOverlay();
		sort.date = sort.date * -1;
        sortFiles("date", sort.date);
	}
	document.querySelectorAll("#optionContainer p:nth-child(4)")[0].onclick = function() {
		event.stopPropagation();
		closeMenuOverlay();
		sort.size = sort.size * -1;
        sortFiles("size", sort.size);
	}
	document.querySelectorAll("#directoryHeader p:nth-child(2)")[0].onclick = function() {
		var type = this.innerText.toLowerCase();
		sort[type] = sort[type] * -1;
		sortFiles(type, sort[type]);
	}
}

document.querySelectorAll("#header div:first-child i")[0].onclick = function() {
	this.parentNode.style.backgroundColor = "rgba(0,0,0,0.4)";
	that = this;
	setTimeout(function() {
		that.parentNode.style.backgroundColor = "rgba(0,0,0,0)";
	}, 300);
	if(currDir === "") {
		setTimeout(function() {
			document.getElementById("sidebar").style.left = "0";	
		}, 10);
		
	} else {
		var arr = currDir.split("/");
		if(arr.length === 2) {
			currDir = "";
		} else {
			currDir = arr.slice(0,arr.length-2).reduce((a,b) => a+"/"+b)+"/";
		}
		listDir(currDir, 0);
	}
}

document.getElementById("sidebar").onclick = function() {
    event.stopPropagation();
}

document.querySelectorAll("#header div:last-child i")[0].onclick = function(event) {
	event.stopPropagation();
	this.parentNode.style.backgroundColor = "rgba(0,0,0,0.4)";
	that = this;
	setTimeout(function() {
		that.parentNode.style.backgroundColor = "rgba(0,0,0,0)";
	}, 300);
	var menu = document.getElementById("dotMenu");
	menu.style.display = "block";
	setTimeout(function() {
		menu.style.opacity = "1";
	}, 10);
}

document.getElementById("openSort").onclick = function() {
	event.stopPropagation();
	this.style.backgroundColor = "rgba(0,0,0,0.2)";
	that = this;
	setTimeout(function() {
		that.style.backgroundColor = "rgba(0,0,0,0)";
	}, 300);
	// Close Menu
	var menu = document.getElementById("dotMenu");
	menu.style.opacity = "0";
	setTimeout(function() {
		menu.style.display = "none";
	}, 300);
	// Open overlay
	var overlay = document.getElementById("menuOverlay");
		overlay.style.display = "block";
		setTimeout(function() {
			overlay.style.opacity = "1";
		}, 10);

	setTimeout(function() {
		var option = document.getElementById("optionContainer");
		option.style.bottom = "0";	
	}, 150);
}

document.getElementById("download").onclick = function() {
	event.stopPropagation();
	this.style.backgroundColor = "rgba(0,0,0,0.2)";
	that = this;
	setTimeout(function() {
		that.style.backgroundColor = "rgba(0,0,0,0)";
	}, 300);
}

document.onclick = function(event) {
	var menu = document.getElementById("dotMenu");
	menu.style.opacity = "0";
	setTimeout(function() {
		menu.style.display = "none";
	}, 300);

	closeMenuOverlay();

	document.getElementById("sidebar").style.left = "-80%";
}

getData();
sortButtons();
createNav();
updateNav(navSelect);