function relMouseCoords(event){
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = this;

    do{
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while(currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {x:canvasX, y:canvasY}
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

var canvas;
var radius;
var ctx;
var timer;
var points;
var launchPoint = {x:1,y:1};

function doMouseMove(e){
    if (e.buttons) {
	doMouseDown(e);
    } else {
	var p = canvas.relMouseCoords(event);
	
	p.x = (p.x - canvas.width/2);
	p.y = (p.y - canvas.height/2);
	
	launchPoint.x = (radius) * p.x / Math.sqrt(p.x*p.x + p.y*p.y);
	launchPoint.y = (radius) * p.y / Math.sqrt(p.x*p.x + p.y*p.y);    
	draw();
    }
}

function doMouseDown(e){
    var p = canvas.relMouseCoords(event);    
    p.x = (p.x - canvas.width/2);
    p.y = (p.y - canvas.height/2);

    points.sort( function(a,b) {
	return ((a.x - p.x)*(a.x - p.x) + (a.y - p.y)*(a.y - p.y)) -
	    ((b.x - p.x)*(b.x - p.x) + (b.y - p.y)*(b.y - p.y));
    });
    points.shift();    
    points.push( p );
    console.log( points );
    draw();
}

function init() {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    canvas.addEventListener("mousemove",doMouseMove,false);
    canvas.addEventListener("mousedown",doMouseDown,false);

    radius = canvas.width/2 - 20;
    
    ctx.translate( canvas.width/2, canvas.height/2 );

    points = [];
    points.push( {x: radius/4,y:radius/4} );
    points.push( {x: -radius/4,y:radius/4} );
    points.push( {x: radius/4,y:-radius/4} );    
}

function intersectRayWithSegment( p, v, endpoints ) {
    var a = endpoints[0];
    var b = endpoints[1];
    var p1 = p;
    var v1 = v;
    var p2 = a;
    var v2 = [b[0]-a[0], b[1]-a[1]];

    var p1x = p1[0];
    var p1y = p1[1];
    var p2x = p2[0];
    var p2y = p2[1];
    var v1x = v1[0];
    var v1y = v1[1];
    var v2x = v2[0];
    var v2y = v2[1];

    if (Math.abs(v1y*v2x - v1x*v2y) < 0.00001)
	return null;

    var t = -((p1y - p2y)*v2x - p1x*v2y + p2x*v2y)/(v1y*v2x - v1x*v2y);
    if (t < 0)
	return null;

    var s = -((p1y - p2y)*v1x - p1x*v1y + p2x*v1y)/(v1y*v2x - v1x*v2y);

    if ((s < 0) || (s > 1))
	return null;

    return [p2x + s*v2x, p2y + s*v2y];
}

function hitCircle(p,q) {
    var px = p.x;
    var py = p.y;
    var qx = q.x;
    var qy = q.y;
    var r = radius;
    
    var t1 = (Math.pow(px,2) + Math.pow(py,2) - px*qx - py*qy - Math.sqrt((-Math.pow(py,2)*Math.pow(qx,2) + 2*px*py*qx*qy - Math.pow(px,2)*Math.pow(qy,2) + (Math.pow(px,2) + Math.pow(py,2) - 2*px*qx + Math.pow(qx,2) - 2*py*qy + Math.pow(qy,2))*Math.pow(r,2))))/(Math.pow(px,2) + Math.pow(py,2) - 2*px*qx + Math.pow(qx,2) - 2*py*qy + Math.pow(qy,2));
    
    var t2 = (Math.pow(px,2) + Math.pow(py,2) - px*qx - py*qy + Math.sqrt((-Math.pow(py,2)*Math.pow(qx,2) + 2*px*py*qx*qy - Math.pow(px,2)*Math.pow(qy,2) + (Math.pow(px,2) + Math.pow(py,2) - 2*px*qx + Math.pow(qx,2) - 2*py*qy + Math.pow(qy,2))*Math.pow(r,2))))/(Math.pow(px,2) + Math.pow(py,2) - 2*px*qx + Math.pow(qx,2) - 2*py*qy + Math.pow(qy,2));

    var t = t2;
    if (t2 > 1)
	t = t2;
    if (t1 > 1)
	t = t1;    

    return { x: p.x + t*(q.x-p.x), y: p.y + t*(q.y-p.y) };
}

function nextPath(p,v) {
    var bottom_bumper = [[0,0],[canvas.width,0]];
    var right_bumper = [[canvas.width,0],[canvas.width,canvas.height]];
    var top_bumper = [[canvas.width,canvas.height],[0,canvas.height]];
    var left_bumper = [[0,canvas.height],[0,0]];

    var bumpers = [top_bumper, bottom_bumper, left_bumper, right_bumper];
    var i;
    
    for (i = 0; i < bumpers.length; i++) {
        var hit = hitWall(p, v, bumpers[i]);
        if (hit) {
	    var distance = Math.pow(hit[0][0] - p[0],2) + Math.pow(hit[0][1] - p[1],2);
            if (distance > 0.00001)
                return hit;
	}
    }

    return null;
}

function canvasArrow(context, fromx, fromy, tox, toy){
    var headlen = 10;   // length of head in pixels
    var angle = Math.atan2(toy-fromy,tox-fromx);
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle-Math.PI/6),toy-headlen*Math.sin(angle-Math.PI/6));
    context.moveTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),toy-headlen*Math.sin(angle+Math.PI/6));
}

function draw() {
    ctx.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);
    ctx.fillStyle = "#FEFEFE";
    ctx.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);    
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI, false);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;    
    ctx.stroke();
    
    for( var i=0; i<3; i++ ) {
	var p = points[i];
	ctx.beginPath();
	ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI, false);
	ctx.fillStyle = 'black';
	ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(launchPoint.x, launchPoint.y, 3, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'black';
    ctx.fill();    

    var p = launchPoint;

    var iterations = 125;
    for( var j = 0; j<iterations; j++ ) {
	var opacity = Math.pow(j/iterations, 0.8);

	if (j%2 == 0) {
	    ctx.beginPath();
	    ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI, false);
	    ctx.fillStyle = "rgba(0, 0, 255, " + opacity + ")";
	    ctx.fill();
	}

	var opacity = 1.0 - Math.pow(j/iterations, 0.2);	
	
	ctx.strokeStyle = "rgba(0, 0, 255, " + opacity + ")";
	for( var i=0; i<3; i++ ) {
	    var q = points[i];
	    ctx.beginPath();
	    ctx.moveTo(p.x, p.y);
	    
	    p = hitCircle( p, q );
	    ctx.lineTo( p.x, p.y );	
	    ctx.stroke();
	}
    }
    
    var p = launchPoint;

    var iterations = 125;
    for( var j = 0; j<iterations; j++ ) {
	var opacity = Math.pow(j/iterations, 0.8);

	if (j%2 == 0) {
	    ctx.beginPath();
	    ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI, false);
	    ctx.fillStyle = "rgba(255, 0, 0, " + opacity + ")";
	    ctx.fill();
	}

	var opacity = 1.0 - Math.pow(j/iterations, 0.2);	
	
	ctx.strokeStyle = "rgba(255, 0, 0, " + opacity + ")";
	for( var i=2; i>=0; i-- ) {
	    var q = points[i];
	    ctx.beginPath();
	    ctx.moveTo(p.x, p.y);
	    
	    p = hitCircle( p, q );
	    ctx.lineTo( p.x, p.y );	
	    ctx.stroke();
	}
    }
    
    return;
    
    var p = [launchPoint.x, launchPoint.y];
    var v = [launchDirection.x - launchPoint.x,
	     launchDirection.y - launchPoint.y];

    ctx.lineWidth=2;
    ctx.strokeStyle = "#FF0000";
    ctx.beginPath();
    canvasArrow( ctx, p[0], p[1], p[0] + v[0], p[1] + v[1] );
    ctx.stroke();
    
    //ctx.globalAlpha=0.25;
    ctx.antialias = 'gray';
    ctx.strokeStyle = "#000000";
    ctx.lineWidth=0.35;

    var i;
    for( i=0; i<1500; i++ ) {
	var hit = nextPath(p,v);
	ctx.beginPath();
	ctx.moveTo(p[0], p[1]);
	ctx.lineTo( hit[0][0], hit[0][1] );
	ctx.stroke();
	p = hit[0];
	v = hit[1];
    }

}
