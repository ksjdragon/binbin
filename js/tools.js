var themeColors = { // For reference and for quick changing if need-be.
	'main': '#3e505a',
	'sidebar': '#2a2e31',
	'highlight': '#fff'
};

var faIcons = {
	'fol': 'folder',
	'mp3': 'music',
	'ogg': 'music',
	'mp4': 'video-camera',
	'zip': 'file-zip-o',
	'other': 'file-o' 
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
						sidebar = get('.closeable');
						if(sidebar) moveSidebar('close');
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
	});
};

// Directory is the sub-directory, sec is the section of data, 
// if files need to be split up into sections.

function listDir(dir, sec) { 
	$.post('./files', {'drive_id': navSelect, 'path': currDir})
	.done(function(d) {
		data = [[],[]];
		for(var i = 0; i < d.length; i++) {
			if(d[i]['folder']) {
				data[0].push(d[i]);
			} else {
				data[1].push(d[i]);
			}
		}
	  	sortFiles('name', -1);
		clickable = true;
	});
};

function downloadFile(path) {
	alertBox('Downloading file...', 'msg');
	$.post('./files', {'drive_id': navSelect, 'path': path}).done(function(d) {
		window.location = './d/' + d;
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
				a = a.date.replace(",","").split(" ");
				b = b.date.replace(",","").split(" ");
				a = Date.parse(a[1] + " " + a[0] + " " + a[2]);
				b = Date.parse(b[1] + " " + b[0] + " " + b[2]);

				return (a < b) ? direc*1 : direc*-1;
			});
			break;
		case 'size':
			sorted.sort(function(a, b) {
				return (a['real_size'] < b['real_size']) ? direc*1 : direc*-1;
			});
			break;
	}
	return sorted;
}

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