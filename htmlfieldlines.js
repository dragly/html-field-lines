 

// CONSTANTS
var minStepLength = 0.005;
var maxStepLength = 0.05;

var minNSteps = 1;
var maxNSteps = 10000;

var minNFieldLines = 6;
var maxNFieldLines = 20;

var minInitialCharge = -2;
var maxInitialCharge = 2;
// END CONSTANTS

var needsRedraw = false;
var particles = [];
var stepLength = 0.02;
var nSteps = 10;
var nFieldLines = 12;
var initialCharge = 1.0;

function initialize() {
    particles[0] = {
        position: [window.innerWidth/2, window.innerHeight/2],
        charge: 0.8 * maxInitialCharge
    }
    onResize();
    controllersChanged(0);
}

function controllersChanged(event) {
    stepLength = minStepLength + document.getElementById('stepLength').value / 100 * (maxStepLength - minStepLength);
    nSteps = minNSteps + document.getElementById('nSteps').value / 100 * (maxNSteps - minNSteps);
    nFieldLines = minNFieldLines + document.getElementById('nFieldLines').value / 100 * (maxNFieldLines - minNFieldLines);
    initialCharge = minInitialCharge + document.getElementById('initialCharge').value / 100 * (maxInitialCharge - minInitialCharge);
    //drawFieldLines();
    redraw();
}

function E(position) {
    var Ex = 0.0;
    var Ey = 0.0;
    var sign = 1;
    for(var j = 0; j < particles.length; j++) {
        var xdiff = position[0] - particles[j].position[0];
        var ydiff = position[1] - particles[j].position[1];
        
        var distanceSquared = xdiff*xdiff + ydiff*ydiff;
        var distance = Math.sqrt(distanceSquared);
        
        var rsq = distanceSquared;
        
        sign = -sign;
        
        Ex += particles[j].charge * xdiff / (distance * distanceSquared);
        Ey += particles[j].charge * ydiff / (distance * distanceSquared);
    }
        
    return [Ex, Ey];
}

var canvas=document.getElementById("myCanvas");
var ctx=canvas.getContext("2d");

    
//var centerx = 200;
//var centery = 200;
var drawing = false;

function redraw() {
    needsRedraw = true;
}

function removeAll() {
    particles.length = 0;
    redraw();
}

function drawFieldLines() {
    if(!needsRedraw) {
        return;
    }
    drawing = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Restore the transform
    ctx.restore();

    // Testing
    ctx.lineWidth = 8;

    var x = 0.0;
    var y = 0.0;
    var radius = 5;
    for(var j = 0; j < particles.length; j++) {
        var xa = particles[j].position[0];
        var ya = particles[j].position[1];
        var opacity = Math.abs(particles[j].charge / minInitialCharge);
        if(particles[j].charge > 0) {
            ctx.fillStyle="rgba(255, 0, 0, " + opacity + ")";
        } else {
            ctx.fillStyle="rgba(0, 0, 255, " + opacity + ")";
        }
        ctx.beginPath();
        ctx.arc(xa, ya, radius, 0, Math.PI*2, true); 
        ctx.closePath();
        ctx.fill();
        //ctx.fillRect(xa - 5, ya - 5, 10, 10);
        if(particles[j].charge < 0) {
            //continue;
        }

        var sign = particles[j].charge > 0 ? 1 : -1;

        var nLines = nFieldLines * Math.abs(particles[j].charge / minInitialCharge);
        var startAngle = j / particles.length * 2 * 3.14;
        for(var a = 0; a < nLines; a++) {
            x = xa + radius * Math.cos(startAngle + a / nLines * 2 * 3.14);
            y = ya + radius * Math.sin(startAngle + a / nLines * 2 * 3.14);
            ctx.beginPath();
            ctx.moveTo(x,y);
            for(var i = 0; i < nSteps; i++) {
                var field = E([x,y]);
                var stepx = field[0];
                var stepy = field[1];
                
                var scale = stepLength * stepLength / (stepLength / 10000000000. + stepx * stepx + stepy * stepy);


                x = x + sign*scale*stepx;
                y = y + sign*scale*stepy;
                
                ctx.lineTo(x,y);
            }
            //ctx.closePath();
            ctx.lineWidth = 1;
            ctx.strokeStyle="#000000";
            ctx.stroke();
        }
    }
    drawing = false;
    needsRedraw = false;
}

var dragging = false;

var dragX = 0;
var dragY = 0;

var dragStartX = 0;
var dragStartY = 0;

var draggingParticle = 0;

function relMouseCoords(event){
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = this;

    do{
        totalOffsetX += currentElement.offsetLeft;
        totalOffsetY += currentElement.offsetTop;
    }
    while(currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {x:canvasX, y:canvasY}
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;


function onResize() {
    console.log("Resized!");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    redraw();
}

function onMouseDown(e) {    
    
    coords = canvas.relMouseCoords(e);
    dragStartX = coords.x;
    dragStartY = coords.y;
    
    for(var i = 0; i < particles.length; i++) {
        var diffX = dragStartX - particles[i].position[0];
        var diffY = dragStartY - particles[i].position[1];
        
        if((diffX*diffX + diffY*diffY) < 1000) {
            draggingParticle = i;
            dragging = true;
            break;
        }
    }
    return false;
}

function onMouseMove(e) {
    if(!drawing) {
        coords = canvas.relMouseCoords(e);
        dragX = coords.x;
        dragY = coords.y;
        if(dragging) {
            particles[draggingParticle].position[0] = dragX;
            particles[draggingParticle].position[1] = dragY;
            //drawFieldLines();
            redraw();
        }
    }
    return false;
}

function onMouseUp(e) {
    e.ctrlKey;
    
    dragging = false;
    
    var theCharge = initialCharge;
    if(e.ctrlKey) {
        theCharge = -initialCharge;
    }
    
    var diffX = dragStartX - dragX;
    var diffY = dragStartY - dragY;
    
    if((diffX*diffX + diffY*diffY) < 100) {
        particles[particles.length] = {
            position: [dragX,dragY],
            charge: theCharge
        }
        //drawFieldLines();
        redraw();
    }
    return false;
}

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();


// usage: 
// instead of setInterval(render, 16) ....

(function animloop(){
  requestAnimFrame(animloop);
  drawFieldLines();
})();
// place the rAF *before* the render() to assure as close to 
// 60fps with the setTimeout fallback.

initialize();
canvas.addEventListener('mousedown', onMouseDown, false);
canvas.addEventListener('mousemove', onMouseMove, false);
canvas.addEventListener('mouseup', onMouseUp, false);
window.addEventListener('resize', onResize, false);
canvas.onselectstart = function () { return false; } // ie

// JQuery stuff
$('#title').mouseenter(function() {
    $('#info').fadeIn('slow', function() {
    // Animation complete
    });
});
$('#title').mouseleave(function() {
    $('#info').fadeOut('slow', function() {
    // Animation complete
    });
});
// Done JQuery

console.log("Done!");


