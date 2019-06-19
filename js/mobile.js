var data = [[],[]]		// Stores file directory data.
var navi = {			// Stores data for sidebar navigation.
	'owned': [], 
	'shared': []
};
var navSelect;			// Stores current selected sidebar option.
var clickable = true;	// Prevents actions being run more than once.
var selectDiv; 			// Stores selected file or folder div.
var currDir = "";		// Stores the current directory.

function sortFiles(type, direction) {
	if(type === 'name') data[0] = sortSection(type, direction, data[0]);
	data[1] = sortSection(type, direction, data[1]);

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
		get('#directory').removeChild(get('#directoryCont'));
	} catch(err) {}

	var cont = element('div', {
		id: 'directoryCont',
		class: 'transition',
		style: 'opacity:0'
	});

	if(data[0].length === 0 && data[1].length === 0) {
		cont.appendChild(element('p', {
			text: 'Nothing here!',
			style: 'font-weight: 100'
		}));
	}

	for(var i = 0; i < data.length; i++) {
		for(var j = 0; j < data[i].length; j++) {


			var itemInfo = data[i][j];

			var ext = (itemInfo.folder) ? "fol" : 
					itemInfo.name.substring(
						itemInfo.name.lastIndexOf(".") + 1,
						itemInfo.name.length)
					.toLowerCase();

			var item = element('div', {
				class: 'item transition',
				ext: ext,
				filename: itemInfo.name
			});

			item.appendChild(element('p', {
				class: 'name',
				text: itemInfo.name
			}));

			item.appendChild(element('p', {
				class: 'otherInfo',
				text: (itemInfo.folder) ? "----" :
					itemInfo.date.split(" ")[0] + " | " + itemInfo.size
			}));

			if(!itemInfo.folder) {
				var a = element('div', {
					onclick: function() {
						console.log("generating download link");
						// DO EXPIRY LINKS HERE
						// update link to get('copy') and copy
					}
				});

				a.appendChild(element('i', {
					class: 'fa fa-files-o transition'
				}));

				item.appendChild(a);
			}

			var ico = element('div', {
				class: 'fileIcon',
			});

			ico.appendChild(element('i', {
				class: `fa fa-${(faIcons[ext] || faIcons["other"])}`
			}));

			item.appendChild(ico);

			item.onclick = function() {
				if(!clickable) return;
				// DO WITH SHIFT AND CONTROL LATER.

				if(this.className.search( 'selectedItem') === -1) {
					get('.item').forEach(function(ele) {
						ele.style.backgroundColor = "";
						ele.className = ele.className.replace(' selectedItem', 
							'');
					});
					this.className += ' selectedItem';
					this.style.backgroundColor = "rgba(255,255,255,0.2)";
					return;
				}

				// Below executes only after user has clicked twice.
				var name = this.getAttribute('filename');
				var ext = this.getAttribute('ext');

				clickable = false;
				if(ext == 'fol') {
					clearTbl();
					setTimeout(function() {
						currDir += '/' + name;
						listDir(currDir, 0);
					}, 300);
				} else {
					downloadFile(currDir + "/" + name);
				}
				clickable = true;

			}
			cont.appendChild(item);
		}
	}
	
	get('#directory').appendChild(cont);
	setTimeout(function() {
		get('#directoryCont').style.opacity = "1";
	}, 100);
};

function updateLocation() {
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


getDrives();
sortButtons();