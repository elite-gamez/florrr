const inventoryBaseAddress = await new Promise((resolve, reject) => {
    function readVarUint32(arr) {
        let idx = 0, res = 0;
        do res |= (arr[idx] & 0b01111111) << idx * 7;
        while (arr[idx++] & 0b10000000);
        return [idx, res];
    }
    WebAssembly.instantiateStreaming =
        (src, imports) => src.arrayBuffer().then(buf => WebAssembly.instantiate(buf, imports));
    const _instantiate = WebAssembly.instantiate;
    WebAssembly.instantiate = (buf, imports) => {
        const arr = new Uint8Array(buf);
        const addrs = [];
        for (let i = 0; i < arr.length; i++) {
            let j = i;
            if (arr[j++] !== 0x41) continue; // i32.const
            if (arr[j++] !== 1) continue;    // 1
            if (arr[j++] !== 0x3a) continue; // i32.store8
            if (arr[j++] !== 0) continue;    // align=0
            if (arr[j++] !== 0) continue;    // offset=0
            if (arr[j++] !== 0x41) continue; // i32.const
            const [offset, addr] = readVarUint32(arr.subarray(j));
            j += offset;
            if (arr[j++] !== 0x41) continue; // i32.const
            if (arr[j++] !== 5) continue;    // 5
            if (arr[j++] !== 0x36) continue; // i32.store
            if (arr[j++] !== 2) continue;    // align=2
            if (arr[j++] !== 0) continue;    // offset=0
            addrs.push(addr >> 2);
        }
        if (addrs.length === 1) resolve(addrs[0]);
        else reject(new Error('Failed to get inventory base address'));
        return _instantiate(buf, imports);
    };
})

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

function getPetalAddr(id, thisRarity, inventoryBaseAddress) {
    return inventoryBaseAddress + ((id + 1) * kRarity.length) - (kRarity.length - thisRarity)
}

let kRarity = [
    { name: 'Common', color: 0x7EEF6D },
    { name: 'Unusual', color: 0xFFE65D },
    { name: 'Rare', color: 0x4D52E3 },
    { name: 'Epic', color: 0x861FDE },
    { name: 'Legendary', color: 0xDE1F1F },
    { name: 'Mythic', color: 0x1FDBDE },
    { name: 'Ultra', color: 0xFF2B75 },
    { name: 'Super', color: 0x2BFFA3 },
    { name: 'Unique', color: 0x555555 }
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

var isKeyPressed = { toggleKey: true },
    autocorrect = stringSimilarity,
    module,
    kPetals,
    florrioUtils,
    image = {
        petal: [],
        blank: []
    }

let interval1 = setInterval(() => {
    if (!florrioUtils) {
        florrioUtils = unsafeWindow?.florrio?.utils
        if (!florrioUtils) return
        kPetals = {
            sidByNameOrder: florrioUtils.getPetals().map(x => [x.sid, x.sid.split('_')[x.sid.split('_').length - 1]]).sort(function (a, b) {
                if (a[1] > b[1]) return 1
                else return -1
            }).map(x => x[0]),
            sid: florrioUtils.getPetals().map(x => x.sid)
        }

        let thisRarity = new Array(florrioUtils.getPetals().find(x => x.allowedDropRarities != null).allowedDropRarities.length).fill({ name: '?', color: 0 })
        thisRarity.forEach((x, i) => { if (kRarity[i]) thisRarity[i] = kRarity[i] })
        kRarity = thisRarity

        for (let r = 0; r < kRarity.length; r++) image.blank[r] = florrioUtils.generateMobImage(128, florrioUtils.getMobs().find(x => x.sid == 'titan').id, r, 1)
        for (let p = 0; p < kPetals.sid.length; p++) image.petal[p] = florrioUtils.generatePetalImage(128, p + 1, kRarity.length - 1, 1)
        module = Module.HEAPU32
        updateProgress()
        newPetal()
        clearInterval(interval1)
    }
})

setInterval(() => {
    module = Module.HEAPU32
    updateProgress()
}, 10 * 1000)

function updateProgress() {
    countEachRarity()
    countProgressOfEachPetal()
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

function buttonToggle(element, condition) {
    condition = condition == true ? false : true
    element.innerHTML = `<font color='${condition == true ? color.secondary : color.tertiary}'>${condition}</font>`
    return condition
}

if (lcs_.exactNumber) document.getElementById(`petalCounter_exactNumber`).innerHTML = lcs_.exactNumber.toString().fontcolor(color.secondary)
else document.getElementById(`petalCounter_exactNumber`).innerHTML = lcs_.exactNumber.toString().fontcolor(color.tertiary)

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
        b = new Array(kRarity.length).fill(0)

    for (let i = inventoryBaseAddress; i < inventoryBaseAddress + kPetals?.sid?.length * kRarity.length; i += kRarity.length) {
        for (let j = 0; j < kRarity.length; j++) {
            b[j] += module[i + j]
        }
    }
    a += `<div style='display:flex; overflow-y: auto'>`
    b.forEach((x, i) => {
        a += `
            <div style='display: flex; flex-direction: column; margin: 3px; padding: 10px' class='hover'>
                <img style='width: 50px; height: 50px;' src='${image.blank[i]}'>
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
                <img id='petalCounter_progress_petal_${p}' style='cursor: pointer' height='64px' src='${image.petal[kPetals?.sid.indexOf(p)]}'>
                <div style='width: 100%'>
            `
        for (const r in lcs_.count.petal[p]) {
            if (lcs_.count.petal[p][r] <= 0) continue
            let amount = module[getPetalAddr(kPetals?.sid.indexOf(p), r, inventoryBaseAddress)]
            let aim = lcs_.count.petal[p][r]
            let percent = `${(amount / aim * 100).toFixed(2)}%`
            a += `
                    <div id='petalCounter_progress_rarity_${kRarity[r].name}/${p}' class='hover' style='cursor: pointer; padding: 0 5px; margin: 0 10px 0 30px; display: flex; flex-direction: row; height: 20px;'>
                        <div style='width: 80px; margin-top: 3px;'>${kRarity[r].name}</div>
                        <div style='width: 200px; height: 7px; background-color: ${color.darker}; border-radius: 10px; margin: 7px 10px 0 0;'>
                            <div style='width: ${percent}; height: 100%; max-width: 100%; background-color: #${kRarity[r].color.toString(16)}; border-radius: 10px;'></div>
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
                let p = a[0]
                let b = new Array(kRarity.length).fill(0)
                let aim = prompt(`Aim (${p})\n(Set to 0 to remove)\n${kRarity.map(x => x.name)}`, lcs_.count.petal[p].toString())
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
                let p = a[1]
                let aim = parseInt(prompt(`Aim (${r} ${p})\n(Set to 0 to remove)`, lcs_.count.petal[p][kRarity.map(x => x.name).indexOf(r)]))
                if (!isNaN(aim) && aim >= 0) {
                    lcs_.count.petal[p][kRarity.map(x => x.name).indexOf(r)] = aim
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
    kRarity.forEach((x, i) => {
        thisRarity += `
            <div id='petalCounter_newPetal_container_rarity_${x.name}' class='hover selectable' style='margin: 2px; padding: 5px;'>
                <img style='width: 50px; height: 50px; margin: 2px;' src='${image.blank[i]}'>
            </div>
            `
    })
    thisRarity += `</div>`

    thisPetal += `<div style='display:flex; width: 100%; overflow-y: auto'>`

    kPetals.sidByNameOrder.forEach(x => {
        thisPetal += `
            <div id='petalCounter_newPetal_container_petal_${x}' class='hover selectable' style='margin: 2px; padding: 5px;'>
                <img style='width: 50px; height: 50px; margin: 2px;' src='${image.petal[kPetals?.sid.indexOf(x)]}'>
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
        selected = selected.map(x => x.replace(/petalCounter_newPetal_container_rarity_|petalCounter_newPetal_container_petal_/g, ''))
        let raritySelected = selected.filter(x => kRarity.map(x => x.name).includes(x))
        let petalSelected = selected.filter(x => !kRarity.map(x => x.name).includes(x))

        for (let i = 0; i < petalSelected.length; i++) {
            if (raritySelected.length == 0) break
            if (!lcs_.count.petal[petalSelected[i]]) lcs_.count.petal[petalSelected[i]] = new Array(kRarity.length).fill(0)
            for (let j = 0; j < raritySelected.length; j++) {
                lcs_.count.petal[petalSelected[i]][kRarity.map(x => x.name).indexOf(raritySelected[j])] = 1
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
            <p id='petalCounter_message' style='margin-block: 10px;' class='hover'>Press <font color='${color.primary}'>${document.querySelector('#petalCounter_toggleKey > font').innerHTML}</font> to open/close this menu.</p>
            <br>
    
            <h1>How to add and count a petal's progress?</h1>
            <p style='margin-block: 10px' class='hover'><font color='${color.tertiary}'>1.</font> In the <font color='${color.secondary}'>Progress</font> category, <font color='${color.secondary}'>choose at least 1</font> for each rarity and petal.<br><br>After that, click <font color='${color.secondary}'>Add</font> button to add the petals you chose into script.</p>
            <p style='margin-block: 10px' class='hover'><font color='${color.tertiary}'>2.</font> Click on the line of that <font color='${color.secondary}'>petal's rarity</font> to modify its <font color='${color.secondary}'>Aim number</font> (set to 0 to remove it from script).<br><br>Or you can click on that <font color='${color.secondary}'>petal's image</font> to modify all rarities' aims at once.</p>
            <br>
    
            <h1>Credit</h1>
                <p style='margin-block: 10px' class='hover'>Script is created by Furaken (discord: <font color='${color.secondary}'>samerkizi</font>).</p>
                <p style='margin-block: 10px; cursor: pointer;' class='hover' onclick='window.open("https://github.com/Furaken")'>Github: <font color='${color.primary}'>https://github.com/Furaken</font>.</p>
                <p style='margin-block: 10px; cursor: pointer;' class='hover' onclick='window.open("https://discord.gg/tmWUfg4FR9")'>Discord: <font color='${color.primary}'>https://discord.gg/tmWUfg4FR9</font>.</p>
                <p style='margin-block: 10px' class='hover'>Special thanks to <font color='${color.secondary}'>Max Nest</font> for auto <font color='${color.tertiary}'>inventoryBaseAddress finder</font>.</p>
                <p style='margin-block: 10px' class='hover'>Images by <font color='${color.secondary}'>M28</font>.</p>
            <br>
            
            <h1>Changelog</h1>
    
            <h2>January 24th 2024 - v1.3.3</h2>
                <p style='margin-block: 10px' class='hover'>Reworked menu UI.</p>
                <p style='margin-block: 10px' class='hover'>Some features were removed.</p>
                <p style='margin-block: 10px' class='hover'>Script can find <font color='${color.primary}'>inventoryBaseAddress finder</font> automatically (Credit to <font color='${color.secondary}'>Max Nest</font>).</p>
            <br>
            <h2>January 04th 2024 - v1.2</h2>
                <p style='margin-block: 10px' class='hover'>The container now has smooth scrolling effect (Credit to <font color='${color.secondary}'>Manuel Otto</font>).</p>
                <p style='margin-block: 10px' class='hover'>Added multiple petals counter.</p>
                <p style='margin-block: 10px' class='hover'>Added <font color='${color.primary}'>Auto update ID</font> (this requires you to use <font color='${color.primary}'>Find & Apply</font> at least one times).</p>
            <br>
            <h2>December 24th 2023 - v1.1</h2>
                <p style='margin-block: 10px' class='hover'>Added 3 new petals.</p>
                <p style='margin-block: 10px' class='hover'>Added a manual way to find Basic ID: <font color='${color.primary}'>Find & Apply</font> (Credit to <font color='${color.secondary}'>Max Nest</font>).</p>
                <p style='margin-block: 10px' class='hover'>The container is now moveable and scalable.</p>
                <p style='margin-block: 10px' class='hover'>Press <font color='${color.primary}'>=</font> key to show/hide the container, this is also available in earlier versions. You can custom it in settings now.</p>
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
        document.querySelector('#petalCounter_message > font').innerHTML = document.getElementById('petalCounter_toggleKey').innerHTML
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