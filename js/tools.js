var themeColors = { // For reference and for quick changing if need-be.
	'main': '#3e505a',
	'sidebar': '#2a2e31',
	'highlight': '#fff'
};

var faIcons = {
	'fol': 'fas fa-folder',
	'audio': 'fas fa-file-audio',
	'video': 'fas fa-file-video',
	'image': 'fas fa-file-image',
	'zip': 'fas fa-file-archive',
	'pdf': 'fas fa-file-pdf',
	'other': 'fas fa-file' 
};

var sort = {	// Default sorting directions.
	'name': -1,
	'date': 1,
	'size': 1,
};

/*
var navi = [ // Necessary arguments: id, alias, fa | Optional arguments: subnav. 
	{
		'id': 'myFiles',
		'alias': 'My Files',
		'fa': 'home'
	},
];
*/

function get(name) {
	ele = document.querySelectorAll(name)
	return (ele.length === 1) ? ele[0] : ele;
};

function element(type, dict) {
	ele = document.createElement(type);
	for(var [k,v] of Object.entries(dict)) {
		if(k === 'text') {
			ele.appendChild(document.createTextNode(v));
		} else if(k === 'onclick') {
			ele.onclick = v;
		} else {
			ele.setAttribute(k, v);
		}
	}
	return ele;
};

function getDrives() {
	$.get('./mydrives').done(function(d) {
		navSelect = d['owned'][0]['_id'] // ADD DEFAULT LATER
		types = ['owned', 'shared']
		for(var i = 0; i < types.length; i++) {
			for(var j = 0; j < d[types[i]].length; j++) {
				item = {
					'id': d[types[i]][j]['_id'],
					'alias': d[types[i]][j]['name'],
					'fa': 'home',
					'onclick': function() {
						if(this.id === navSelect) return;
						updateNav(this.id);
						if(version === 'mobile') moveSidebar('close');
						currDir = '';
						listDir(currDir, 0);
					}
				}
				drives[item['id']] = item['alias'];
				navi[types[i]].push(item)
			}	
		}
		navLayout();
		updateNav(navSelect);
		listDir(currDir, 0);
	})
	.fail(function(e) {
		alertBox(e.responseText, 'error');
		console.log(e.responseText);
	});
};

// Directory is the sub-directory, sec is the section of data, 
// if files need to be split up into sections.

function listDir(dir, sec) { 
	$.post('./files/list', {'drive_id': navSelect, 'path': currDir})
	.done(function(d) {
		data = [[],[]];
		for(var i = 0; i < d.length; i++) {
			if(d[i]['folder']) {
				data[0].push(d[i]);
			} else {
				d[i].date = Date.parse(d[i].date);
				data[1].push(d[i]);
			}
		}
	  	sortFiles('name', -1);
		clickable = true;
	})
	.fail(function(e) {
		alertBox(e.responseText, 'error');
		console.log(e.responseText);
	});
};

function downloadFile(type, ext, path) {
	alertBox('Downloading file...', 'msg');
	$.post('./files/download', {'drive_id': navSelect, 'path': path})
	.done(function(d) {
		if(type === 'download') {
			if(ext.includes('pdf')) {
				window.open('./d/' + d);
			} else {
				window.location = './d/' + d;
			}
		} else if(type === 'image') {
			overlay(type, './d/' + d, ext)
		}
		
	})
	.fail(function(e) {
		alertBox(e.responseText, 'error');
		console.log(e.responseText);
	});
};

function streamFile(type, ext, path) {
	alertBox('Getting file...', 'msg');
	$.post('./files/stream', {'drive_id': navSelect, 'path': path})
	.done(function(d) {
		overlay(type, './d/' + d, ext)
	})
	.fail(function(e) {
		alertBox(e.responseText, 'error');
		console.log(e.responseText);
	});
};

function sortSection(type, direc, arr) {
	var sorted = arr;
	switch(type) {
		case 'name':
			sorted.sort(function(a, b) { 
				return (a.name < b.name) ? direc*1 : direc*-1;
			});
			break;
		case 'date':
			sorted.sort(function(a, b){ 
				return (a.date < b.date) ? direc*1 : direc*-1;
			});
			break;
		case 'size':
			sorted.sort(function(a, b) {
				return (a['real_size'] < b['real_size']) ? direc*1 : direc*-1;
			});
			break;
	}
	return sorted;
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

			var ext = (itemInfo.folder) ? 'fol' : itemInfo.filetype

			var item = element('div', {
				class: 'item transition',
				ext: ext,
				filename: itemInfo.name
			});

			item.appendChild(element('p', {
				class: 'name',
				text: itemInfo.name
			}));

			if(version === 'desktop') {
				item.appendChild(element('p', {
					class: 'modified',
					text: (itemInfo.folder) ?  '----' : dateStr(itemInfo.date)
				}));

				item.appendChild(element('p', {
					class: 'size',
					text: itemInfo.size || '----'
				}));
			} else if(version === 'mobile') {
				item.appendChild(element('p', {
					class: 'otherInfo',
					text: (itemInfo.folder) ? '----' :
						dateStr(itemInfo.date, 'date') + ' | ' + itemInfo.size
				}));
			}

			if(!itemInfo.folder) {
				var a = element('div', {
					onclick: function() {
						console.log('generating download link');
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
				class: faIcons[fileType(ext)]
			}));

			item.appendChild(ico);

			item.onclick = function() {
				if(!clickable) return;
				// DO WITH SHIFT AND CONTROL LATER.

				if(this.className.search( 'selectedItem') === -1) {
					get('.item').forEach(function(ele) {
						ele.style.backgroundColor = '';
						ele.className = ele.className.replace(' selectedItem', 
							'');
					});
					this.className += ' selectedItem';
					this.style.backgroundColor = 'rgba(255,255,255,0.2)';
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
				} else if(ext.includes('image')) {
					downloadFile('image', ext, currDir + '/' + name);
				} else if(ext.includes('audio')) {
					streamFile('audio', ext, currDir + '/' + name);
				} else if(ext.includes('video')) {
					streamFile('video', ext, currDir + '/' + name);
				} else {
					downloadFile('download', ext, currDir + '/' + name);
				}
				clickable = true;

			}
			cont.appendChild(item);
		}
	}
	
	get('#directory').appendChild(cont);
	setTimeout(function() {
		get('#directoryCont').style.opacity = '1';
	}, 100);
};

function navLayout() {
	function createNavHeader(text) {
		get('#sidebarItems').appendChild(element('div', {
			class: 'naviHead transition',
			text: text
		}));
	};

	function createNav(navi) {	// Create navigation tabs on sidebar.
		var side = get('#sidebarItems');
		navi.forEach(function(ele) {
			var div = element('div', {
				id: ele.id,
				class: 'navi transition',
				onclick: ele.onclick
			});

			div.appendChild(element('i', {
				class: `fa fa-${ele.fa}`
			}));

			div.appendChild(element('p', {
				text: ele.alias
			}))

			side.appendChild(div);
		});
	};

	createNavHeader('My Drives');
	createNav(navi['owned']);
	createNavHeader('Shared Drives');
	createNav(navi['shared']);
};

function updateNav(op) { // Updates the sidebar navigation.
	var oldNav = document.getElementById(navSelect);
	var newNav = document.getElementById(op);
	navSelect = op;
	oldNav.style.backgroundColor = 'rgba(0,0,0,0)';
	oldNav.style.color = 'white';
	newNav.style.backgroundColor = themeColors.main;
	newNav.style.color = themeColors.highlight;
};

function clearTbl() {
	selectDiv = undefined;
	get('#directoryCont').style.opacity = '0';
};

function overlay(type, src, mime) {
	function resize(item, vH, vW) {
		wH = window.innerHeight, wW = window.innerWidth;
		if((vH/vW) > (wH/wW)) {
			item.style.height = (wH * 0.9).toString() + "px";
		} else {
			item.style.width = (wW * 0.9).toString() + "px";
		}
	}

	var div = element('div', {
		id: 'overlay',
		class: 'transition',
		style: `width: 100%;
				height: 100%;
				position: absolute; 
				top: 0; 
				left: 0;
				background-color: rgba(0,0,0,0.7);
				opacity: 0;
				display: grid;`,
		onclick: function() {
			this.style.opacity = '0';
			that = this;
			setTimeout(function() {
				that.parentNode.removeChild(that);
			}, 300);
		}
	});

	var inner;

	if(type === 'image') {
		var img = element('img', {
			style: 'margin: auto;',
			src: src,
			onclick: function(event) {
				event.stopPropagation();
			}
		});

		img.onload = function() {
			resize(this, this.height, this.width);
		};

		inner = img;

	} else if (type === 'audio') {
		var audio = element('audio', {
			class: 'noSelect',
			style: 'margin: auto; outline: none',
			controls: true,
			autoplay: true,
			src: src,
			type: mime,
			onclick: function(event) {
				event.stopPropagation();
			}
		});

		inner = audio;

	} else if (type === 'video') {
		var vid = element('video', {
			style: 'margin: auto; background-color: black;',
			controls: true,
			autoplay: true,
			src: src,
			type: mime,
			onclick: function(event) {
				event.stopPropagation();
			}
		});

		vid.onloadedmetadata = function() {
			resize(this, this.videoHeight, this.videoWidth);
		};

		inner = vid;
	}

	div.appendChild(inner);
	get('body').appendChild(div);

	setTimeout(function() {
		div.style.opacity = '1';
	}, 10);
}

function animFade(type, div) {
	if(type === 'open') {
		div.style.display = 'block';
		setTimeout(function() {
			div.style.opacity = '1';
		}, 10);
	} else if(type === 'close') {
		div.style.opacity = '0';
		setTimeout(function() {
			div.style.display = 'none';
		}, 300);
	}
};

function dateStr(date, type) {
	type = type || 'all';
	var str = new Date(date).toLocaleString();
	if(type === 'all') {
		return str.replace(',', ' | ');	
	} else if(type === 'date') {
		return str.substring(0, str.indexOf(','));
	} else if(Type === 'time') {
		return str.substring(str.indexOf(',') + 1, str.length);
	}	
};

function fileType(ext) {
	if(ext === 'fol') return 'fol';
	if(ext.includes('image')) {
		return 'image';
	} else if(ext.includes('video')) {
		return 'video';
	} else if(ext.includes('pdf')) {
		return 'pdf';
	} else if(ext.includes('audio')) {
		return 'audio';
	} else if(ext.includes('zip') ||
				ext.includes('x-rar') ||
				ext.includes('x-7z-compressed') ||
				ext.includes('gzip')) {
		return 'zip';
	} else {
		return 'other'
	}
}