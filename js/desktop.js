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
var version = 'desktop';

function sortFiles(type, direction) {
	if(type === 'name') data[0] = sortSection(type, direction, data[0]);
	data[1] = sortSection(type, direction, data[1]);

	ico = get('#directoryHeader i');
	ico.forEach(function(ele) {
		ele.style.opacity = '0';
	});

	setTimeout(function() {
		ico.forEach(function(ele) {
			ele.style.display = 'none';
		});
		var arrow = (direction < 0) ? 'up' : 'down';
		arrow = get(`#directoryHeader .${type} i.fa-chevron-${arrow}`);
		animFade('open', arrow);
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

function updateLocation() {
	var loc = get('#directoryLocation');
	while(loc.firstChild) loc.removeChild(loc.firstChild);
	loc.style.opacity = '1';
	var subdir = currDir.split('/');
	
	for(var i = 0; i < subdir.length; i++) {
		var p = element('p', {
			text: (i === 0) ? drives[navSelect] : subdir[i],
			class: 'subdir transition',
			style: 'cursor:pointer',
			onclick: function() {
				clickable = false;
				clearTbl();
				subdirNum = subdir.indexOf(this.innerText);
				if(subdirNum === -1) {
					currDir = '';
				} else {
					currDir = subdir.slice(0, subdirNum+1)
					.reduce(function(a,b) { return a + '/' + b; });
				}
				listDir(currDir, 0);
			}
		});

		if(i > 0) {
			loc.appendChild(element('i', {
				class: 'fas fa-chevron-right'
			}));
		}
		loc.appendChild(p);
	}
};

function sortButtons() {
	get('#directoryHeader .name').onclick = function() {
		sort.name = sort.name * -1;
		sortFiles('name', sort.name);
	};
	get('#directoryHeader .date').onclick = function() {
		sort.date = sort.date * -1;
		sortFiles('date', sort.date);
	};
	get('#directoryHeader .size').onclick = function() {
		sort.size = sort.size * -1;
		sortFiles('size', sort.size);
	};
};

document.addEventListener('keydown', function(event) {
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
					document.getElementById('directoryCont').childNodes[0].click();
				} else {
					selectDiv.nextElementSibling.click();
				}
				break;
			case 8:
				var subdirs = document.getElementsByClassName('subdir');
				subdirs[subdirs.length-1].click();
				break;
		}
	} catch(err) {}
});

getDrives();
sortButtons();
