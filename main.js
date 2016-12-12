var data;
var section = 0;
var selected;
var selectDiv;
var rootDir;
var currDir = "";
var clickable = true;
var url;

function listDir(dir,sec) {
	var real = rootDir+dir;
	$.when($.ajax({
		type : 'POST',
		url: 'main.php',
		data: {getdir : [real, sec]},
	})).done(function(d) {
		data = JSON.parse(d);
		if(section == 0) {
			data[0].splice(0,2);
			data[1].splice(0,3);
			data[2].splice(0,3);
			data[3].splice(0,3);
		} else {
			data[1].splice(0,1);
			data[2].splice(0,1);
			data[3].splice(0,1);
		}
		clickable = true;
		dispDir();
	});
}

function dispDir() {
	var tbl = document.createElement("table");
	tbl.className = "items";
	tbl.style.opacity = "0";

	selected = "";
	var item;
	for(var i = 0; i < data[0].length; i++) {
		item = getRow();

		var curr = data[0][i];
		var name = document.createTextNode(curr);
		var modified = document.createTextNode(data[2][i]);
		var size = document.createTextNode(data[3][i]);

		item.childNodes[0].appendChild(name);
		item.childNodes[1].appendChild(modified);
		item.childNodes[2].appendChild(size); 

		var ext = document.createAttribute("ext");

		if(data[1][i] == "true") {
			ext.value = "fol";
		} else {
			ext.value = curr.substring(curr.lastIndexOf(".")+1,curr.length).toLowerCase();
		}
		item.setAttributeNode(ext);

		item.onclick = function() {
			if(clickable == true) {
				var name = this.childNodes[0].childNodes[0].nodeValue;
				url = "http://"+window.location.hostname+rootDir+currDir+name;
				if(selected == name) {
					clickable = false;
					attr = this.getAttribute("ext");
					if(attr == "fol") {
						clearTbl();
						setTimeout(function() {
							document.getElementsByClassName("content")[0].removeChild(table);
							currDir += name+"/";
							listDir(currDir,0);
						})
						return;
					} else if(attr == "mkv" || attr == "mp4") {
						videoOverlay(url);
					} else if(attr == "png" || attr == "jpg" || attr == "gif") {
						imageOverlay(url); 
					} else {
						downloadFile("/html/"rootDir+currDir+name,'n');
						clickable = true;
					}
				}
				selected = name;
				selectDiv = this;
				for(var i =0; i< document.getElementsByTagName("tr").length;i++){
					document.getElementsByTagName("tr")[i].style.backgroundColor = "";
				}
				this.style.backgroundColor = '#443b5e';
				document.getElementById("permalink").value = encodeURI(url);
			}
		}

		tbl.appendChild(item);
		item = null;
	}
	document.getElementsByClassName("content")[0].appendChild(tbl);
	setTimeout(function() {
		document.getElementsByClassName("items")[0].style.opacity = "1";
	}, 100)
}

function getRow() {
	var each = document.createElement("tr");
	var name = document.createElement("td");
	name.className = "name";
	each.appendChild(name);
	var modified = document.createElement("td");
	modified.className = "modified";
	each.appendChild(modified);
	var size = document.createElement("td");
	size.className = "size";
	each.appendChild(size);
	return each;
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
	}

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


		if(width/height < 16/9) {
			image.style.height = (window.innerHeight * .85).toString() + "px";
			image.style.width = (image.style.height.replace("px","") * width/height).toString() + "px";
		} else {
			image.style.width = (window.innerWidth * .85).toString() + "px";
			image.style.height = (image.style.width.replace("px","") * height/width).toString() + "px";
		}

		image.style.marginTop = (image.style.height.replace("px","")/-2).toString() + "px";
		image.style.marginLeft = (image.style.width.replace("px","")/-2).toString() + "px";

		overlay.appendChild(image);

		var close = getClose();
		overlay.appendChild(close);

		document.getElementsByTagName("body")[0].appendChild(overlay);
	}		
}

function videoOverlay(url) {
	var overlay = getDefaultOverlay();

	var video = document.createElement("video");
	video.src = url;
	video.controls = true;
	video.autoplay = true;
	video.type = "video/mp4";

	document.addEventListener("keydown", function(event) {
	    if((event || window.event).keyCode === 32) {
	        video.paused ? video.play() : video.pause();
	    }

	    if((event || window.event).keyCode === 27) {
			document.getElementsByTagName("body")[0].removeChild(document.getElementsByClassName("overlay")[0]);
		}
	})

	video.style.position = "fixed";
	video.style.top = "50%";
	video.style.left = "50%";
	var height = window.innerHeight * .4305;
	video.style.marginTop = (height/-2).toString() + "px";
	video.style.marginLeft = (height*-16/18).toString() + "px";
	video.style.height = height.toString() + "px";
	video.style.width =  (height * 16/9).toString() + "px";
	overlay.appendChild(video);

	var close = getClose();
	overlay.appendChild(close);

	document.getElementsByTagName("body")[0].appendChild(overlay);
}

function downloadFile(url,u) {
	window.location.assign("http://"+window.location.hostname+":8080/download.php?name="+url+"&u="+u);
}

function clearTbl() {
	selected = undefined;
	selectDiv = undefined;
	table = document.getElementsByClassName("items")[0];
	table.style.opacity = "0";
	console.log(table.childNodes.length);
	document.getElementById("permalink").value = "";
}

document.getElementsByClassName("fa-arrow-left")[0].onclick = function() {
	clearTbl();
	setTimeout(function() {
		document.getElementsByClassName("content")[0].removeChild(table);
		currDir = currDir.substring(0,currDir.substring(0,currDir.length-1).lastIndexOf("/")+1);
		listDir(currDir,0);
	}, 300)
}

document.getElementsByClassName("fa-download")[0].onclick = function() {
	if (selected != null) {
		var items = document.getElementsByClassName("name");
		var i = 0;
		while(items[i].childNodes[0].nodeValue != selected) {
			i++;
		}
		var extension = items[i].parentNode.getAttribute("ext");
		var relroot = rootDir+currDir+selected;

		if(extension == "fol") {
			$.when($.ajax({
				type : 'POST',
				url: 'main.php',
				data: {zip : [relroot, selected+".zip"]}
			})).done(function(d) {
				downloadFile("/zip/"+selected+".zip",'y');
			});
		} else {
			downloadFile(relroot,'n');	
		}
	}
}

document.getElementById("permalink").onclick = function() {
	this.select();
	document.execCommand("copy");
}

document.addEventListener("keydown", function(event) {
	if((event || window.event).keyCode === 13) { // Enter
		try {
			selectDiv.click();
		} catch(err) {}

    } else if((event || window.event).keyCode === 38) { // Up
		try {
			selectDiv.previousElementSibling.click();
		} catch(err) {}

    } else if((event || window.event).keyCode === 40) { // Down
		try {
			if(selectDiv == undefined) {
				document.getElementsByClassName("items")[0].childNodes[0].click();
			} else {
				selectDiv.nextElementSibling.click();
			}
		} catch(err) {} 
    } else if((event || window.event).keyCode === 37) {
    	try{
    		document.getElementsByClassName("fa-arrow-left")[0].click();
    	} catch(err) {}
    }
})

$.when($.ajax({
	type : 'POST',
	url: 'main.php',
	data: {rootdir: 'rootdir'}
})).done(function(d) {
	rootDir = JSON.parse(d);
	listDir(currDir,0);
});
