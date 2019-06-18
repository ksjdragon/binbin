var data = [[],[]], // Stores file directory data.
	drives,
	navi = {'owned': [], 'shared': []},
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
		navSelect = drives['owned'][0]['_id'] // ADD DEFAULT LATER
		types = ['owned', 'shared']
		for(var i = 0; i < types.length; i++) {
			for(var j = 0; j < drives[types[i]].length; j++) {
				item = {
					'id': drives[types[i]][j]['_id'],
					'alias': drives[types[i]][j]['name'],
					'fa': 'home',
					'onclick': function() {
						if(this.id === navSelect) return;
						updateNav(this.id);
						currDir = "";
						listDir(currDir, 0);
					}
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
		data = [[],[]];
		for(var i = 0; i < d.length; i++) {
			if(d[i]['folder']) {
				data[0].push(d[i]);
			} else {
				data[1].push(d[i]);
			}
		}

	  	sortFiles("name", -1);
		clickable = true;
	});
}

function sortFiles(type, direction) {
	function sortSection(type, direction, sec) {
		switch(type) {
			case "name":
				data[sec].sort(function(a, b){ return (a.name < b.name) ? direction*1 : direction*-1;});
				break;
			case "date":
				data[sec].sort(function(a, b){ 
					a = a.date.replace(",","").split(" ");
					b = b.date.replace(",","").split(" ");
					a = Date.parse(a[1] + " " + a[0] + " " + a[2]);
					b = Date.parse(b[1] + " " + b[0] + " " + b[2]);

					return (a < b) ? direction*1 : direction*-1;
				});
				break;
			case "size":
				data[sec].sort(function(a, b){ return (a['real_size'] < b['real_size']) ? direction*1 : direction*-1;});
				break;
		}
	}

	if(direction != "size") sortSection(type, direction, 0);
	sortSection(type, direction, 1);

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
		for(var j = 0; j < data[i].length; j++) {
			item = createRow();

			var curr = data[i][j];
			var name = document.createTextNode(curr.name);
			var modified = document.createTextNode((curr.date || "----"));
			var size = document.createTextNode((curr.size || "----"))

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
							downloadFile(currDir + "/" + name);
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
	createNavHeader("My Drives");
	createNav(navi['owned']);
	createNavHeader("Shared Drives");
	createNav(navi['shared']);
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
		div.onclick = navi[i]['onclick'];
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
	navSelect = op;
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

function downloadFile(path) {
	alertBox("Downloading file...", "msg");
	$.post('./files', {'drive_id': navSelect, 'path': path}).done(function(d) {
		window.location = "./d/" + d;
	});
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
