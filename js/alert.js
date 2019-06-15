// Loads alert box into HTML first.

var box = document.createElement("div");
var p = document.createElement("p");

box.id = "alert";
box.style.position = "absolute";
box.style.top = "-4em";
box.style.width = "100%";
box.style.color = "#fefefe";
box.style.textAlign = "center";

p.style.backgroundColor = "#d24242";
p.style.display = "inline";
p.style.padding = "1em";
p.style.borderRadius = "4px";

box.appendChild(p);
box.className = "transition";

get("body").appendChild(box);


function alertBox(s) {
	box.childNodes[0].textContent = s;
	box.style.top = "2em";
	setTimeout(function() {
		box.style.top = "-4em";
	}, 1000);
}
