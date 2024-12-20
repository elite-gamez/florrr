var templates = {
    shop: [26, 249, 2450, 1970, false],
    loadout: [(7680 - 3280) / 2, 4320 - 660, 3280, 660, false],
    gallery: [95, 500, 2265, 2145, true],
    inventory: [480, 2230, 1420, 1980, true],
    map: [6400, 80, 1200, 1200, false],
    fullScreen: [0, 0, 7680, 4320, false]
},
    cvs = document.querySelector('canvas'),
    cvsSize_og = [cvs.width, cvs.height],
    inputs = templates.gallery // Change template here

cvs.width = 7680
cvs.height = 4320

setTimeout(function() {
    var newCvs = document.createElement('canvas')
    newCvs.width = inputs[2]
    newCvs.height = inputs[3]
    newCvs.getContext('2d').drawImage(document.querySelector('canvas'), inputs[0], inputs[1], inputs[2], inputs[3], 0, 0, inputs[2], inputs[3])

    var image = new Image()
    image.src = newCvs.toDataURL()
    if (!inputs[4]) {
        cvs.width = cvsSize_og[0]
        cvs.height = cvsSize_og[1]
    }
    var blank_ = window.open("");
    blank_.document.body.appendChild(image)
    blank_.document.body.style.margin = 0
}, 1000)