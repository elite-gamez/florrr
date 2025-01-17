// ==UserScript==
// @name         florr.io | Petal farming progress counter
// @namespace    Furaken
// @version      1.3.0
// @description  Track and count the number of desired petals.
// @author       Furaken
// @match        https://florr.io/*
// @grant        unsafeWindow
// @license      AGPL3
// @require      https://unpkg.com/string-similarity@4.0.4/umd/string-similarity.min.js
// ==/UserScript==

function syntaxHighlight(json) { // https://stackoverflow.com/questions/4810841/pretty-print-json-using-javascript
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var c = color.json.number
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                c = color.json.key
            } else {
                c = color.json.string
            }
        } else if (/true|false/.test(match)) {
            c = color.json.boolean
        } else if (/null/.test(match)) {
            c = color.json.null
        }
        return `<font style='font-weight: normal; color: ${c}'>${match}</font>`;
    });
}

function abbNum(value) {
    if (lcs_.exactNumber) return value
    else {
        return Math.abs(Number(value)) >= 1.0e+9
            ? (Math.abs(Number(value)) / 1.0e+9).toFixed(2) + "b"
            : Math.abs(Number(value)) >= 1.0e+6
                ? (Math.abs(Number(value)) / 1.0e+6).toFixed(2) + "m"
                : Math.abs(Number(value)) >= 1.0e+3
                    ? (Math.abs(Number(value)) / 1.0e+3).toFixed(2) + "k"
                    : Math.abs(Number(value))
    }
}

class ElementCreate {
    constructor(tag) { this.element = document.createElement(tag) }
    attr(attributes) {
        for (const [key, value] of Object.entries(attributes)) this.element.setAttribute(key, value)
        return this
    }
    style(styles) {
        for (const [property, value] of Object.entries(styles)) this.element.style[property] = value
        return this
    }
    content(content) {
        if (typeof content == 'string') this.element.innerHTML = content
        else if (content instanceof HTMLElement) this.element.appendChild(content)
        return this
    }
    append(parent) {
        const parentElement = typeof parent == 'string' ? document.querySelector(parent) : parent
        parentElement.appendChild(this.element)
        return this
    }
    get() { return this.element }
}

function syncLcs() {
    localStorage.__petalCounter = JSON.stringify(lcs_)
}

function findSequence(seq, mem) { // findSequence() by Max Nest
    let match = 0
    for (let addr = 0; addr < mem.length; addr++) {
        if (mem[addr] === seq[match]) match++
        else if (mem[addr] === seq[0]) match = 1
        else match = 0
        if (match === seq.length) return addr - match + 1
    }
}

function getPetalAddr(id, thisRarity, addr) {
    return addr + ((id + 1) * rarity.length) - (rarity.length - thisRarity)
}

let rarity = [
    {
        name: 'Common',
        id: 'c',
        color: 8318829
    },
    {
        name: 'Unusual',
        id: 'n',
        color: 16770653
    },
    {
        name: 'Rare',
        id: 'r',
        color: 5067491
    },
    {
        name: 'Epic',
        id: 'e',
        color: 8789982
    },
    {
        name: 'Legendary',
        id: 'l',
        color: 14556959,
    },
    {
        name: 'Mythic',
        id: 'm',
        color: 2087902
    },
    {
        name: 'Ultra',
        id: 'u',
        color: 16722805
    },
    {
        name: 'Super',
        id: 's',
        color: 2883491
    },
    {
        name: 'Unique',
        id: 'q',
        color: 5592405
    }
]

const color = {
    background: '#202020',
    darker: '#1d1d1d',
    primary: '#bb86fc',
    secondary: '#03dac5',
    tertiary: '#ff0266',
    gray: '#666666',
    json: {
        string: '#ff0266',
        number: '#03dac5',
        boolean: '#bb86fc',
        null: '#bb86fc',
        key: '#9cdcfe'
    }
}

const defaultLCS = {
    address: '?',
    addressFinder: {
        autoFind: true,
        set: ['Basic', 5, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    toggleKey: {
        Ctrl: false,
        Shift: false,
        Alt: false,
        Meta: false,
        key: ['=', 0],
        code: 'Equal'
    },
    exactNumber: false,
    count: {
        petal: {}
    }
}

let lcs_ = localStorage.__petalCounter || defaultLCS
if (typeof lcs_ == 'string') lcs_ = JSON.parse(lcs_)
for (const [key, value] of Object.entries(defaultLCS)) {
    if (lcs_[key] == null) lcs_[key] = value
}
localStorage.__petalCounter = JSON.stringify(lcs_)

var isKeyPressed = {
    toggleKey: true
}
var autocorrect = stringSimilarity
var module
var petal
var mob
var loaded = false

setInterval(() => {
    if (!petal) {
        petal = unsafeWindow.florrio.utils.getPetals().map(x => x.i18n.fullName)
        mob = unsafeWindow.florrio.utils.getMobs()
        let thisRarity
        thisRarity = new Array(unsafeWindow.florrio.utils.getPetals().find(x => x.allowedDropRarities != null).allowedDropRarities.length).fill({ name: '?', id: '?', color: 0 })
        thisRarity.forEach((x, i) => {
            if (rarity[i]) thisRarity[i] = rarity[i]
        })
        rarity = thisRarity
    }
    module = Module.HEAPU32
    updateProgress()
}, 5 * 1000)

function updateProgress() {
    countEachRarity()
    countProgressOfEachPetal()
    if (!loaded) {
        loaded = true
        newPetal()
    }
    document.getElementById('petalCounter_json').innerHTML = syntaxHighlight(JSON.stringify(lcs_, null, 4))
}

function getToggleKey() {
    let t = ''
    for (const [key, value] of Object.entries(lcs_.toggleKey)) {
        if (value == true) t += ' ' + key
        if (key == 'key' && value[1] == 0) t += ` ${value[0].toUpperCase()} (${lcs_.toggleKey.code})`
    }
    return t
}

const container = document.getElementById('__skContainer') || new ElementCreate('div')
    .attr({ id: '__skContainer' })
    .style({
        margin: 0,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) scale(1)',
        width: '80%',
        height: '80%',
        zIndex: '999',
        transition: 'all 0.4s ease-in-out',
        fontFamily: 'Consolas, "Courier New", monospace',
        color: 'white',
        cursor: 'default',
        wordWrap: 'break-word'
    })
    .append(document.body)
    .get()

const container_petalCounter = new ElementCreate('div')
    .style({
        backgroundColor: color.background,
        borderRadius: '10px',
        boxShadow: '5px 5px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        width: '100%',
        height: '100%',
    })
    .append(container)
    .get();

new ElementCreate('div')
    .style({
        width: '70%',
        padding: '30px',
        fontSize: '14px',
        lineHeight: '14px',
        overflow: 'hidden auto',
        whiteSpace: 'nowrap'
    })
    .content(`
    <h1>Config</h1>
    <div style='display: flex;' class='hover'>
        <p style='width: 30%; cursor: pointer;' id='petalCounter_assignAddress'>Address: <font color='${color.primary}'>${lcs_.address}</font></p>
        <p style='width: 60%; cursor: pointer;' id='petalCounter_findAddress'><font color='${color.primary}'>${lcs_.addressFinder.set}</font></p>
    </div>
    <div style='display: flex;' class='hover'>
        <p style='width: 30%;'>Auto find:</p>
        <p style='width: 60%; cursor: pointer;' id='petalCounter_autoFind'></p>
    </div>
    <div style='display: flex;' class='hover'>
        <p style='width: 30%;'>Toggle key:</p>
        <p style='width: 60%; cursor: pointer;' id='petalCounter_toggleKey'><font color='${color.primary}'>${getToggleKey()}</font></p>
    </div>
    <div style='display: flex;' class='hover'>
        <p style='width: 30%;'>Exact number:</p>
        <p style='width: 60%; cursor: pointer;' id='petalCounter_exactNumber'></p>
    </div>

    <h1>Counter</h1>
    <div id='petalCounter_countAll' style='margin-bottom: 15px;'></div>

    <h1>Progress</h1>
    <div style='display: flex; flex-direction: column;'>
        <div id='petalCounter_newPetal_container' style='border-radius: 5px; background: ${color.darker}; width: 100%; height: fit-content; transition: all 0.4s ease-in-out;'>
            <h3 style='margin: 20px 0 5px 30px; padding: 0'>Add new petal</h3>
            <div id='petalCounter_newPetal_container_rarity' style='padding: 0 20px 0 20px;'></div>
            <div id='petalCounter_newPetal_container_petal' style='padding: 0 20px 20px 20px;'></div>
        </div>
        <div id='petalCounter_newPetal' class='button' style='margin-block: 15px; height: fit-content;'>Add</div>
    </div>
    <div id='petalCounter_progress'></div>

    <h1>JSON</h1>
    <pre id='petalCounter_json' style='border-radius: 10px; padding: 20px; background-color: ${color.darker}'>${syntaxHighlight(JSON.stringify(lcs_, null, 4))}</pre>
    `)
    .append(container_petalCounter)
    .get();

document.getElementById('petalCounter_assignAddress').onclick = function () {
    let a = prompt('Assign new address:', lcs_.address)
    if (!a) return
    if (a.length > 10) return
    a = parseInt(a)
    if (!isNaN(a)) {
        document.querySelector(`#${this.id} > font`).innerHTML = a
        lcs_.address = a
        syncLcs()
        updateProgress()
    }
}

document.querySelector('#petalCounter_findAddress').onclick = function () {
    let a = prompt('petal_name,common,unusual,rare,epic,legendary,mythic,ultra,super,unique', lcs_.addressFinder.set)
    if (!a) return
    a = a.split(',').map(x => x.trim())
    let seqArr = new Array(10).fill(0)
    for (let i = 0; i <= rarity.length; i++) {
        if (!a[i]) continue
        if (i != 0) a[i] = parseInt(a[i])
        seqArr[i] = a[i]
    }

    let petalMatch = autocorrect.findBestMatch(seqArr[0], petal)
    let petalName = petalMatch.bestMatch.target
    let petalId = petalMatch.bestMatchIndex + 1
    seqArr[0] = petalName

    let foundAddress = findSequence(seqArr.slice(1), module) - (petalId * rarity.length) + rarity.length

    if (!isNaN(foundAddress)) {
        lcs_.address = foundAddress
        document.querySelector('#petalCounter_assignAddress > font').innerHTML = lcs_.address
    }
    document.querySelector(`#${this.id} > font`).innerHTML = seqArr

    lcs_.addressFinder.set = seqArr
    syncLcs()
    updateProgress()
}

function buttonToggle(element, condition) {
    condition = condition == true ? false : true
    element.innerHTML = `<font color='${condition == true ? color.secondary : color.tertiary}'>${condition}</font>`
    return condition
}

if (lcs_.addressFinder.autoFind) document.getElementById(`petalCounter_autoFind`).innerHTML = lcs_.addressFinder.autoFind.toString().fontcolor(color.secondary)
else document.getElementById(`petalCounter_autoFind`).innerHTML = lcs_.addressFinder.autoFind.toString().fontcolor(color.tertiary)

if (lcs_.exactNumber) document.getElementById(`petalCounter_exactNumber`).innerHTML = lcs_.exactNumber.toString().fontcolor(color.secondary)
else document.getElementById(`petalCounter_exactNumber`).innerHTML = lcs_.exactNumber.toString().fontcolor(color.tertiary)

document.getElementById('petalCounter_autoFind').onclick = function () {
    lcs_.addressFinder.autoFind = buttonToggle(this, lcs_.addressFinder.autoFind)
    syncLcs()
}

document.getElementById('petalCounter_exactNumber').onclick = function () {
    lcs_.exactNumber = buttonToggle(this, lcs_.exactNumber)
    syncLcs()
    updateProgress()
}

document.getElementById('petalCounter_toggleKey').onclick = function () {
    if (isKeyPressed.toggleKey) {
        isKeyPressed.toggleKey = false
        this.innerHTML = 'Press a key'.toString().fontcolor(color.tertiary)
    } else {
        isKeyPressed.toggleKey = true
        this.innerHTML = getToggleKey().toString().fontcolor(color.primary)
    }
}

function countEachRarity() {
    let a = '',
        b = new Array(rarity.length).fill(0),
        c = lcs_.address

    for (let i = c; i < c + petal?.length * rarity.length; i += rarity.length) {
        for (let j = 0; j < rarity.length; j++) {
            b[j] += module[i + j]
        }
    }
    a += `<div style='display:flex; overflow-y: auto'>`
    b.forEach((x, i) => {
        a += `
        <div style='display: flex; flex-direction: column; margin: 3px; padding: 10px' class='hover'>
            <img style='width: 50px; height: 50px;' src='${unsafeWindow.florrio.utils.generateMobImage(512, mob.find(x => x.sid == 'titan').id, i, 1)}'>
            <font style='text-align: center; margin-top: 5px;' color='${color.primary}'>${abbNum(x)}</font>
        </div>`
    })
    a += `</div>`
    document.getElementById('petalCounter_countAll').innerHTML = a
}

function countProgressOfEachPetal() {
    let a = ''
    for (const p in lcs_.count.petal) {
        if (lcs_.count.petal[p].every(item => item == 0)) {
            delete lcs_.count.petal[p]
            syncLcs()
        }
        a += `
        <div style='display: flex; flex-direction: row; margin-bottom: 20px;'>
            <img id='petalCounter_progress_petal_${p.replaceAll(' ', '-')}' style='cursor: pointer' height='64px' src='${unsafeWindow.florrio.utils.generatePetalImage(512, petal.indexOf(p) + 1, rarity.length - 1, 1)}'>
            <div style='width: 100%'>
        `
        for (const r in lcs_.count.petal[p]) {
            if (lcs_.count.petal[p][r] <= 0) continue
            let amount = module[getPetalAddr(petal.indexOf(p), r, lcs_.address)]
            let aim = lcs_.count.petal[p][r]
            let percent = `${amount / aim * 100}%`
            a += `
                <div id='petalCounter_progress_rarity_${rarity[r].name}_${p.replaceAll(' ', '-')}' class='hover' style='cursor: pointer; padding: 0 5px; margin: 0 10px 0 30px; display: flex; flex-direction: row; height: 20px;'>
                    <div style='width: 80px; margin-top: 3px;'>${rarity[r].name}</div>
                    <div style='width: 200px; height: 7px; background-color: ${color.darker}; border-radius: 10px; margin: 7px 10px 0 0;'>
                        <div style='width: ${percent}; height: 100%; max-width: 100%; background-color: #${rarity[r].color.toString(16)}; border-radius: 10px;'></div>
                    </div>
                    <div style='margin: 3px 0 0 10px; width: 150px;'>${abbNum(amount)}/${abbNum(aim)}</div>
                    <div style='margin: 3px 0 0 10px; width: 150px;'>${percent} ${amount / aim >= 1 ? `(${~~(amount / aim)})` : ''}</div>
                </div>
            `
        }
        a += `</div></div>`
    }
    document.getElementById('petalCounter_progress').innerHTML = a
    document.querySelectorAll('#petalCounter_progress > div > img').forEach(x => {
        x.onclick = function () {
            if (x.id.startsWith('petalCounter_progress_petal_')) {
                let a = x.id.replace('petalCounter_progress_petal_', '').split('_')
                let p = a[0].replaceAll('-', ' ')
                let b = new Array(rarity.length).fill(0)
                let aim = prompt(`Aim (${p})\n(Set to 0 to remove)\n${rarity.map(x => x.name)}`, lcs_.count.petal[p].toString())
                aim.split(',').forEach((rarityAim, i) => {
                    b[i] = isNaN(parseInt(rarityAim)) == true ? 0 : parseInt(rarityAim)
                })
                lcs_.count.petal[p] = b
                syncLcs()
                updateProgress()
            }
        }
    })
    document.querySelectorAll('#petalCounter_progress > div > div > div').forEach(x => {
        x.onclick = function () {
            if (x.id.startsWith('petalCounter_progress_rarity_')) {
                let a = x.id.replace('petalCounter_progress_rarity_', '').split('_')
                let r = a[0]
                let p = a[1].replaceAll('-', ' ')
                let aim = parseInt(prompt(`Aim (${r} ${p})\n(Set to 0 to remove)`, lcs_.count.petal[p][rarity.map(x => x.name).indexOf(r)]))
                if (!isNaN(aim) && aim >= 0) {
                    lcs_.count.petal[p][rarity.map(x => x.name).indexOf(r)] = aim
                    syncLcs()
                    updateProgress()
                }
            }
        }
    })
}


function newPetal() {
    let thisRarity = '',
        thisPetal = ''
    thisRarity += `<div style='display:flex; width: 100%; overflow-y: auto'>`
    rarity.forEach((x, i) => {
        thisRarity += `
        <div id='petalCounter_newPetal_container_rarity_${x.name}' class='hover selectable' style='margin: 2px; padding: 5px;'>
            <img style='width: 50px; height: 50px; margin: 2px;' src='${unsafeWindow.florrio.utils.generateMobImage(512, mob.find(x => x.sid == 'titan').id, i, 1)}'>
        </div>
        `
    })
    thisRarity += `</div>`

    thisPetal += `<div style='display:flex; width: 100%; overflow-y: auto'>`

    let a = unsafeWindow.florrio.utils.getPetals().map(x => [x.i18n.name, x.i18n.fullName])
    a.sort(function (a, b) {
        if (a[0] > b[0]) return 1
        else return -1
    })
    a.forEach((x, i) => {
        thisPetal += `
        <div id='petalCounter_newPetal_container_petal_${x[1].replaceAll(' ', '-')}' class='hover selectable' style='margin: 2px; padding: 5px;'>
            <img style='width: 50px; height: 50px; margin: 2px;' src='${unsafeWindow.florrio.utils.generatePetalImage(512, petal.indexOf(x[1]) + 1, rarity.length - 1, 1)}'>
        </div>
        `
    })
    thisPetal += `</div>`

    document.getElementById('petalCounter_newPetal_container_rarity').innerHTML = thisRarity
    document.getElementById('petalCounter_newPetal_container_petal').innerHTML = thisPetal

    document.querySelectorAll('.selectable').forEach(x => {
        x.onclick = function () {
            this.classList.toggle('selected')
            addNewPetalIntoObj()
        }
    })
}

function addNewPetalIntoObj() {
    document.getElementById('petalCounter_newPetal').onclick = function () {
        let selected = Array.from(document.querySelectorAll('.selected')).map(x => x.id)
        selected = selected.map(x => x.split('_')[x.split('_').length - 1].replaceAll('-', ' '))
        let raritySelected = selected.filter(x => rarity.map(x => x.name).includes(x))
        let petalSelected = selected.filter(x => !rarity.map(x => x.name).includes(x))

        for (let i = 0; i < petalSelected.length; i++) {
            if (raritySelected.length == 0) break
            if (!lcs_.count.petal[petalSelected[i].replaceAll('-', ' ')]) lcs_.count.petal[petalSelected[i].replaceAll('-', ' ')] = new Array(rarity.length).fill(0)
            for (let j = 0; j < raritySelected.length; j++) {
                lcs_.count.petal[petalSelected[i].replaceAll('-', ' ')][rarity.map(x => x.name).indexOf(raritySelected[j])] = 1
            }
        }
        syncLcs()
        updateProgress()
    }
}

new ElementCreate('div')
    .style({
        width: '30%',
        padding: '30px',
        fontSize: '14px',
        lineHeight: '14px',
        overflowY: 'auto',
        borderRadius: '0 10px 10px 0',
        backgroundColor: color.darker,
    }).content(`
        <h1>Welcome back!</h1>
        <p style='margin-block: 10px' class='hover'>I have reworked this script's UI but some functions stayed the same.</p>
        <p style='margin-block: 10px' class='hover'>This version is still unfinished and some old features are missing. I will try to finish this by next week (Jan 25).</p>
        <p style='margin-block: 10px' class='hover'>Thanks for using my script.</p>
        <p style='margin-block: 10px' class='hover'>Script is created by Furaken (discord: <font color='${color.secondary}'>samerkizi</font>).</p>
        <p style='margin-block: 10px; cursor: pointer;' class='hover' onclick='window.open("https://github.com/Furaken")'>Github: <font color='${color.secondary}'>https://github.com/Furaken</font>.</p>

        <br>
        <br>

        <h1>How to get Address?</h1>
        <p style='margin-block: 10px' class='hover'><font color='${color.tertiary}'>1.</font> Choose any <font color='${color.secondary}'>petal type</font> (Basic or Ankh or Stinger or ...) that has <font color='${color.secondary}'>at least 4 rarities</font> with number greater than 0.<br><br>For large number that is shown as abbreviation (> 1000), move your cursor over the petal, the number of it will be shown next to its name.</p>
        <p style='margin-block: 10px' class='hover'><font color='${color.tertiary}'>2.</font> Click on <font color='${color.primary}'>${lcs_.addressFinder.set}</font> next to Address button in <font color='${color.secondary}'>Config</font> category.</p>
        <p style='margin-block: 10px' class='hover'><font color='${color.tertiary}'>3.</font> There will be a prompt pops up with following format:<br>
        <font color='${color.primary}'>petal_name,common,unusual,rare,epic,legendary,mythic,ultra,super,unique</font></p>
            <p class='hover' style='margin-block: 10px; margin-left: 20px'>For example, you have these in inventory:</p>
            <p class='hover' style='margin-block: 10px; margin-left: 40px'>
                3 common Ankh<br>
                2 unusual Ankh<br>
                0 rare Ankh<br>
                225 epic Ankh<br>
                609 legendary Ankh<br>
                5 mythic Ankh<br>
                2 ultra Ankh<br>
                0 super Ankh<br>
                0 unique Ankh<br>
            </p>
            <p class='hover' style='margin-block: 10px; margin-left: 20px'>
                You should input in the prompt with the following text:<br>
                <font color='${color.primary}'>Ankh,3,2,0,225,609,5,2,0,0</font>
            </p>
        <p style='margin-block: 10px' class='hover'><font color='${color.tertiary}'>4.</font> If you have done them right, the script will work as expected.</p>
        <p style='margin-block: 10px' class='hover'><font color='${color.tertiary}'>NOTE:</font> <font color='${color.secondary}'>Auto find</font> only works if you have found the right address for at least once.</p>

        <br>
        <br>

        <h1>How to add and count a petal's progress?</h1>
        <p style='margin-block: 10px' class='hover'><font color='${color.tertiary}'>1.</font> In the <font color='${color.secondary}'>Progress</font> category, <font color='${color.secondary}'>choose at least 1</font> for each rarity and petal.<br><br>After that, click <font color='${color.secondary}'>Add</font> button to add the petals you chose into script.</p>
        <p style='margin-block: 10px' class='hover'><font color='${color.tertiary}'>2.</font> Click on the line of that <font color='${color.secondary}'>petal's rarity</font> to modify its <font color='${color.secondary}'>Aim number</font> (set to 0 to remove it from script).<br><br>Or you can click on that <font color='${color.secondary}'>petal's image</font> to modify all rarities' aims at once.</p>
        `)
    .append(container_petalCounter)
    .get()

document.documentElement.addEventListener('keydown', function (e) {
    if (!isKeyPressed.toggleKey) {
        lcs_.toggleKey = {
            Ctrl: e.ctrlKey,
            Shift: e.shiftKey,
            Alt: e.altKey,
            Meta: e.metaKey,
            key: [e.key, e.location],
            code: e.code,
        }
    }
    else if (e.key == lcs_.toggleKey.key[0] && e.ctrlKey == lcs_.toggleKey.Ctrl && e.shiftKey == lcs_.toggleKey.Shift && e.altKey == lcs_.toggleKey.Alt && e.metaKey == lcs_.toggleKey.Meta && !e.repeat) {
        container.style.transform = container.style.transform == 'translate(-50%, -50%) scale(1)' ? 'translate(-50%, -50%) scale(0)' : 'translate(-50%, -50%) scale(1)'
    }
})

document.documentElement.addEventListener('keyup', function (e) {
    if (!isKeyPressed.toggleKey) {
        isKeyPressed.toggleKey = true
        document.getElementById('petalCounter_toggleKey').innerHTML = getToggleKey().toString().fontcolor(color.primary)
        syncLcs()
    }
})

new ElementCreate('style').content(`
p {
    margin: 3px;
}

h1 {
    line-height: 22px;
}

font {
    font-weight: bold;
}

.hover {
    transition: all 0.2s ease-in-out;
}

.hover:hover {
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 5px;
    padding: 5px;
}

.button {
    background-color: ${color.secondary}99;
    width: fit-content;
    border-radius: 5px;
    padding: 7px 12px;
    cursor: pointer;
    font-weight: bold;
}

.selected {
    background-color: ${color.secondary}33!important;
    border-radius: 5px;
}

::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}
::-webkit-scrollbar-track {
    background: #00000000;
}
::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 5px;
}
::-webkit-scrollbar-thumb:hover {
    background: #444;
}
`).append('head')