var t = 0;

function login(form) {
    u = form.username.value;
    p = form.password.value;
    uEmpty = u === "", pEmpty = p === "";

    if(uEmpty && pEmpty) {
    	alertBox("Please enter a username and password!");
    	return;
    } else if (uEmpty && !pEmpty) {
    	alertBox("Please enter a username!");
    	return;
    } else if (!uEmpty && pEmpty) {
    	alertBox("Please enter a password!");
    	return;
    }

    data = {username: u, password: p}
    $.post("./login", data).done(function(data) {
    	if(data) {
    		location.reload(true);
    	} else {
    		alertBox("Wrong username or password!");
    	}
    });
}

function drawCanvas() {
    var el = get("canvas")
    var c = el.getContext("2d")
    var block = 10, space = 2, size = block+space;
    var period = 100, freq = 2*Math.PI/period, step = 1.4, base = 0.05;
    
    var col = randColor();
    var dir = randDir();

    function animCanvas(t, col) {
        // To update when window changes.
        var w = window.innerWidth, h = window.innerHeight;
        var x = w/size, y = h/size;
        var offX = -(w-Math.floor(x)*size)/2, offY = -(h-Math.floor(y)*size)/2;

        el.width = w, el.height = h;


        c.fillStyle = "#0e0e0e";
        c.fillRect(0, 0, w, h);
        for(var i = 0; i < x+1; i++) {
            for(var j = 0; j < y+1; j++) {
                var intes = Math.round(step*Math.cos((i+j*dir[0]+t*dir[1])*freq)+step)*0.2/step+base
                c.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${intes})`;
                c.fillRect(i*size+offX, j*size+offY, block, block);
            }
        }
        return 1
    }

    function randColor() {
        var arr = [
            128*Math.round(2*Math.random())-1,
            128*Math.round(2*Math.random())-1,
            128*Math.round(2*Math.random())-1
        ];
        while(arr[0]+arr[1]+arr[2] < 382) arr = randColor();
        return arr;
    }

    function randDir() {
        return [
            (Math.round(Math.random())) ? -1 : 1,
            (Math.round(Math.random())) ? -1 : 1
        ];
    }

    setInterval(function() {
        t += animCanvas(t, col);
        if(t == period) {
            t = 0;
            newCol = randColor();
            while(newCol === col) newCol == randColor();
            col = newCol;
            
        }
    }, 80);
}

drawCanvas();

inputs = get("input"), button = get("button")

inputs[0].addEventListener("keyup", function(e) {
	if(e.keyCode === 13) button.click();
});

inputs[1].addEventListener("keyup", function(e) {
	if(e.keyCode === 13) button.click();
});