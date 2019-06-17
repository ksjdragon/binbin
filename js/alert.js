// Loads alert box into HTML first.

var box = document.createElement("div");
var p = document.createElement("p");

box.id = "alert";
box.style.position = "absolute";
box.style.top = "-4em";
box.style.width = "100%";
box.style.color = "#fefefe";
box.style.textAlign = "center";

box.style.setProperty("-webkit-transition", " top 0.3s cubic-bezier(.25, .8, .25, 1)");
box.style.setProperty("transition:", "top 0.3s cubic-bezier(.25, .8, .25, 1)");
box.style.setProperty("-moz-transition", " top 0.3s cubic-bezier(.25, .8, .25, 1)");
box.style.setProperty("-ms-transition", " top 0.3s cubic-bezier(.25, .8, .25, 1)");

p.style.backgroundColor = "#000";
p.style.display = "inline";
p.style.padding = "1em";
p.style.borderRadius = "4px";

box.appendChild(p);

get("body").appendChild(box);

function alertBox(s, type) {
	colors = {
		"error": "#d24242",
		"msg": "#4d9e53"
	};
	box.childNodes[0].textContent = s;
	box.childNodes[0].style.backgroundColor = colors[type];
	box.style.top = "2em";
	setTimeout(function() {
		box.style.top = "-4em";
	}, 1000);
}
