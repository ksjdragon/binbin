var data = [[],[]]		// Stores file directory data.
var navi = {			// Stores data for sidebar navigation.
	'owned': [], 
	'shared': []
};
var drives = {};		// Stores drive names.
var navSelect;			// Stores current selected sidebar option.
var clickable = true;	// Prevents actions being run more than once.
var selectDiv; 			// Stores selected file or folder div.
var currDir = '';		// Stores the current directory.

function sortFiles(type, direction) {
	if(type === 'name') data[0] = sortSection(type, direction, data[0]);
	data[1] = sortSection(type, direction, data[1]);

    var p = get('#sortType');
    var i = get('#sortDirection');
    p.style.opacity = '0';
    i.style.opacity = '0';
    p.innerText = type[0].toUpperCase() + type.substring(1, type.length);
    setTimeout(function() {
    	var arrow = (direction < 0) ? 'up' : 'down';
    	i.className = `fa fa-arrow-${arrow} transition`;
        p.style.opacity = '1';
        i.style.opacity = '1';
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

			var ext = (itemInfo.folder) ? 'fol' : 
					itemInfo.name.substring(
						itemInfo.name.lastIndexOf('.') + 1,
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
				text: (itemInfo.folder) ? '----' :
					dateStr(itemInfo.date, 'date') + ' | ' + itemInfo.size
			}));

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
				class: `fa fa-${(faIcons[ext] || faIcons['other'])}`
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
				} else {
					downloadFile(currDir + '/' + name);
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

function updateLocation() {
	var i = get('#barOpen i');
	if(currDir === '') {
		get('#location').textContent = drives[navSelect];
		if(i.className.includes('fa-bars')) return;
		i.style.opacity = '0';
		setTimeout(function() {
			i.className = 'fa fa-bars transition';
			i.style.opacity = '1'
		}, 300);
	} else {
		get('#location').textContent = currDir.split('/').slice(-1);
		if(i.className.includes('fa-arrow-left')) return;
		i.style.opacity = '0';
		setTimeout(function() {
			i.className = 'fa fa-arrow-left transition';
			i.style.opacity = '1';
		}, 300);
	}
};

function sortButtons() {
	get('#sortText').onclick = function() {
		event.stopPropagation();
	};

	get('#sortName').onclick = function() {
		event.stopPropagation();
		animMenu('close');
		sort.name = sort.name * -1;
        sortFiles('name', sort.name);
	};

	get('#sortDate').onclick = function() {
		event.stopPropagation();
		animMenu('close');
		sort.date = sort.date * -1;
        sortFiles('date', sort.date);
	};

	get('#sortSize').onclick = function() {
		event.stopPropagation();
		animMenu('close');
		sort.size = sort.size * -1;
        sortFiles('size', sort.size);
	};

	get('#sortType').onclick = function() {
		var type = this.innerText.toLowerCase();
		sort[type] = sort[type] * -1;
		sortFiles(type, sort[type]);
	};
};

get('#barOpen').onclick = function() {
	animIcon(this);
	if(currDir === '') {
		setTimeout(function() {
			moveSidebar('open');	
		}, 10);
	} else {
		var arr = currDir.split('/');
		if(arr.length === 2) {
			currDir = '';
		} else {
			currDir = arr.slice(0, -1).reduce((a,b) => a + '/' + b);
		}
		listDir(currDir, 0);
	}
};

function animMenu(type) {
	if(type === 'open') {
		animFade('open', get('#menuOverlay'));
		setTimeout(function() {
			get('#optionContainer').style.bottom = '0';
		}, 150);
	} else if(type === 'close') {
		animFade('close', get('#menuOverlay'));
		get('#optionContainer').style.bottom = '-60%';
	}
};

function moveSidebar(type) {
	if(type === 'open') {
		get('#sidebar').style.left = '0';		
	} else if(type === 'close') {
		get('#sidebar').style.left = '-80%';
	}
};

function animIcon(div) {
	div.children[0].style.backgroundColor = 'rgba(0,0,0,0.2)';
	setTimeout(function() {
		div.children[0].style.backgroundColor = 'rgba(0,0,0,0)';
	}, 300);
};

function darkenTap(div) {
	div.style.backgroundColor = 'rgba(0,0,0,0.2)';
	that = this;
	setTimeout(function() {
		div.style.backgroundColor = 'rgba(0,0,0,0)';
	}, 300);
};

get('#sidebar').onclick = function() {
    event.stopPropagation();
};

get('#dotOpen').onclick = function(event) {
	event.stopPropagation();
	animIcon(this);
	animFade('open', get('#dotMenu'));
};

get('#openSort').onclick = function() {
	event.stopPropagation();
	darkenTap(this);
	animFade('close', get('#dotMenu'));
	animMenu('open');
};

document.getElementById('download').onclick = function() {
	event.stopPropagation();
	darkenTap(this);
};

document.onclick = function(event) {
	animFade('close', get('#dotMenu'));
	animMenu('close');
	moveSidebar('close');
};

getDrives();
sortButtons();