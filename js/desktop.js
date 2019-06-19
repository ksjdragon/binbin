var data = [[],[]]		// Stores file directory data.
var navi = {			// Stores data for sidebar navigation.
	'owned': [], 
	'shared': []
};
var navSelect;			// Stores current selected sidebar option.
var clickable = true;	// Prevents actions being run more than once.
var selectDiv; 			// Stores selected file or folder div.
var currDir = "";		// Stores the current directory.

// FIX THE DATE
function sortFiles(type, direction) {
	if(type === 'name') data[0] = sortSection(type, direction, data[0]);
	data[1] = sortSection(type, direction, data[1]);

	ico = get('#directoryHeader i')
	ico.forEach(function(ele) {
		ele.style.opacity = '0';
	});

	setTimeout(function() {
		ico.forEach(function(ele) {
			ele.style.display = 'none';
		});

		var arrow = get("#directoryHeader ."+type+" i.fa-chevron-" + 
			((direction < 0) ? "up" : "down"));
		arrow.style.display = "block"
		setTimeout(function() {
			arrow.style.opacity = "1";
		}, 1);
	}, 300);
	try {
		clearTbl();
		setTimeout(function() {
			get('#directory').removeChild(get('#directoryCont'));
			dispDir();
		}, 300);
	} catch(err) {
		dispDir();
	}
};

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
				class: 'modified',
				text: itemInfo.date || "----"
			}));

			item.appendChild(element('p', {
				class: 'size',
				text: itemInfo.size || "----"
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
	var loc = get('#directoryLocation');
	while(loc.firstChild) loc.removeChild(loc.firstChild);
	loc.style.opacity = "1";
	var subdir = currDir.split("/");
	
	for(var i = 0; i < subdir.length; i++) {
		var p = element('p', {
			text: (i === 0) ? document.getElementById(navSelect).textContent : 
				subdir[i],
			class: 'subdir transition',
			style: 'cursor:pointer',
			onclick: function() {
				clickable = false;
				clearTbl();
				subdirNum = subdir.indexOf(this.innerText);
				if(subdirNum === -1) {
					currDir = "";
				} else {
					currDir = subdir.slice(0, subdirNum+1)
					.reduce(function(a,b) { return a + "/" + b; }) + "/";
				}
				listDir(currDir, 0);
			}
		});

		if(i > 0) {
			loc.appendChild(element('i', {
				class: 'fa fa-angle-right'
			}));
		}
		loc.appendChild(p);
	}
};

function sortButtons() {
	get("#directoryHeader .name").onclick = function() {
		sort.name = sort.name * -1;
		sortFiles("name", sort.name);
	};
	get("#directoryHeader .date").onclick = function() {
		sort.date = sort.date * -1;
		sortFiles("date", sort.date);
	};
	get("#directoryHeader .size").onclick = function() {
		sort.size = sort.size * -1;
		sortFiles("size", sort.size);
	};
};

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
		}
	} catch(err) {}
});

getDrives();
sortButtons();
