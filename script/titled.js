let x = y = 0, p = 30, b = 30, k = [false, false, false, false], s = 10
document.getElementById("canvas").style.transition = "all 0.2s ease-in-out"
function a() { document.getElementById("canvas").style.transform = `perspective(1000px) rotateX(${x}deg) rotateY(${y}deg)` }

document.documentElement.addEventListener("keydown", function (e) {
    if (event.keyCode == 87) k[0] = true
    if (event.keyCode == 68) k[1] = true
    if (event.keyCode == 83) k[2] = true
    if (event.keyCode == 65) k[3] = true
    if (k[0] && x <= b) x += p
    if (k[1] && y <= b) y += p
    if (k[2] && x >= -b) x += -p
    if (k[3] && y >= -b) y += -p
    a()
});
document.documentElement.addEventListener("keyup", function (e) {
    if (event.keyCode == 87) k[0] = false
    if (event.keyCode == 68) k[1] = false
    if (event.keyCode == 83) k[2] = false
    if (event.keyCode == 65) k[3] = false

    if (!k[0] && x > 0) {
        let t = setInterval(() => {
            x -= Math.floor(p)
            if (x <= 0) {clearInterval(t) ; x = 0}
            a()
        }, s)
    }
    if (!k[1] && y > 0) {
        let t = setInterval(() => {
            y -=  Math.floor(p)
            if (y <= 0) {clearInterval(t) ; y = 0}
            a()
        }, s)
    }
    if (!k[2] && x < 0) {
        let t = setInterval(() => {
            x -= Math.floor(-p)
            if (x >= 0) {clearInterval(t) ; x = 0}
            a()
        }, s)
    }
    if (!k[3] && y < 0) {
        let t = setInterval(() => {
            y -=  Math.floor(-p)
            if (y >= 0) {clearInterval(t) ; y = 0}
            a()
        }, s)
    }
});