var balls = [];
var nBalls = 7;
var cue = null;
var dt = 0.2;
var rad = 15;
var cueLength = 70;
var maxSpeed = 120;
var minSpeed = 1;
var slowDown = 5;
var delta = 20;
var moving = false;
var winW = 500, winH = 250;
var logTimings = false;
var colors = {table: '#004000', ballStroke: '#005000', ballFill: '#004000', cue: '#808000'};

function lineRel(x1, y1, dx, dy) {
    lineRel(x1, y1, x1 + dx, y1 + dy);
}

function line(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.stroke();
}

function circle(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
}

function posFromEvent(e) {
    var e = e || window.event;
    var cnv = getCanvas();
    var offsetX = e.pageX - cnv.clientLeft - cnv.offsetLeft;
    var offsetY = e.pageY - cnv.clientTop - cnv.offsetTop;
    return {x: offsetX, y: offsetY};
}

function draw() {
    ctx.fillStyle = colors.table;
    ctx.fillRect(0, 0, winW, winH);
    ctx.strokeStyle = colors.ballStroke;
    ctx.fillStyle = colors.ballFill;
    ctx.lineWidth = 1;
    for (var i in balls) {
        circle(Math.round(balls[i].x), Math.round(balls[i].y), rad);
    }
    if (cue != null) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = colors.cue;
        line(Math.round(cue.x), Math.round(cue.y), Math.round(cue.x2), Math.round(cue.y2));
    }
}

function setupBalls() {
    balls = [];
    tryAnotherBall:
    while (balls.length < nBalls) {
        var x = Math.floor(Math.random() * (winW - 2 * rad)) + rad;
        var y = Math.floor(Math.random() * (winH - 2 * rad)) + rad;
        if (findBall(x, y, rad * 3) >= 0) {
            continue;
        }
        balls.push({x: x, y: y, vx: 0, vy: 0});
    }
}

function findBall(x, y, r) {
    for (var i in balls) {
        if (hypot(balls[i].x - x, balls[i].y - y) < r) {
            return i;
        }
    }
    return -1;
}

function onTimer() {
    var t0 = Date.now();
    recalc();
    var t1 = Date.now();
    draw();
    var t2 = Date.now();
    if (logTimings) {
        console.log('Recalc: ' + (t1 - t0) + ', Redraw: ' + (t2 - t1));
    }
}

function recalc() {
    moving = false;
    for (var i in balls) {
        moveBall(balls[i]);
    }
    for (var j = 0; j < balls.length; j++) {
        for (var k = j + 1; k < balls.length; k++) {
            checkCollision(balls[j], balls[k]);
        }
    }
    moving = false;
    for (var i in balls) {
        var speed = hypot(balls[i].vx, balls[i].vy);
        if (speed > minSpeed) {
            moving = true;
        } else {
            balls[i].vx = 0, balls[i].vy = 0;
        }
    }
}

function checkBorders(ball) {
    if (ball.x < rad && ball.vx < 0) {
        ball.x += 2 * (rad - ball.x);
        ball.vx *= -1;
    }
    if (ball.y < rad && ball.vy < 0) {
        ball.y += 2 * (rad - ball.y);
        ball.vy *= -1;
    }
    if (ball.x >= winW - rad && ball.vx > 0) {
        ball.x -= 2 * (winW - rad - ball.x);
        ball.vx *= -1;
    }
    if (ball.y >= winH - rad && ball.vy > 0) {
        ball.y -= 2 * (winH - rad - ball.y);
        ball.vy *= -1;
    }
}

function checkCollision(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var dist = hypot(dx, dy);
    if (dist >= 2 * rad) {
        return;
    }
    var c = {vx: (a.vx + b.vx) / 2, vy: (a.vy + b.vy) / 2};
    var ux = a.vx - c.vx;
    var uy = a.vy - c.vy;
    var u = hypot(ux, uy);
    if (u < 1e-7) {
        return;
    }
    ur = (ux * dx + uy * dy) / dist;
    if (ur <= 0) {
        return;
    }
    urx = ur * dx / dist;
    ury = ur * dy / dist;
    a.vx -= 2 * urx;
    a.vy -= 2 * ury;
    b.vx += 2 * urx;
    b.vy += 2 * ury;
}

function moveBall(ball) {
    var v = hypot(ball.vx, ball.vy);
    if (v == 0) {
        return;
    }
    var divisor = 1000 / delta;
    ball.x += ball.vx / divisor;
    ball.y += ball.vy / divisor;
    checkBorders(ball);
    ball.vx -= ball.vx / v * slowDown / divisor;
    ball.vy -= ball.vy / v * slowDown / divisor;
}

function onMouseDown(event) {
    if (moving) {
        return;
    }
    var pos = posFromEvent(event);
    var i = findBall(pos.x, pos.y, rad);
    if (i < 0) {
        alert('Try to press mouse button on the center\nof some ball and drag the mouse');
        return;
    }
    var x = balls[i].x;
    var y = balls[i].y;
    cue = {x: x, y: y, x2: x, y2: y}
    event.preventDefault();
}

function onMouseUp(event) {
    if (cue == null || moving) {
        return;
    }
    var i = findBall(cue.x, cue.y, rad / 2);
    var dx = cue.x2 - cue.x;
    var dy = cue.y2 - cue.y;
    cue = null;
    balls[i].vx = dx * maxSpeed / cueLength;
    balls[i].vy = dy * maxSpeed / cueLength;
    moving = true;
}

function onMouseMove(event) {
    if (cue == null || moving) {
        return;
    }
    var pos = posFromEvent(event);
    var dx = pos.x - cue.x;
    var dy = pos.y - cue.y;
    var len = hypot(dx, dy);
    if (len > cueLength) {
        dx = dx * cueLength / len;
        dy = dy * cueLength / len;
    }
    cue.x2 = cue.x + dx;
    cue.y2 = cue.y + dy;
    event.preventDefault();
}

function setupGeometry(canvas) {
    winW = canvas.width;
    winH = canvas.height;
}

function getCanvas() {
    return document.getElementById('demo');
}

function poolInit() {
    var canvas = getCanvas();
    setupGeometry(canvas);
    if (typeof(overrideSettings) != 'undefined') {
        overrideSettings();
    }
    window.ctx = canvas.getContext('2d');
    setupBalls();
    draw();
    canvas.onmousedown = onMouseDown;
    canvas.onmouseup = onMouseUp;
    canvas.onmousemove = onMouseMove;
    setInterval(onTimer, delta);
}

function buttonReset() {
    setupBalls();
}
