function findSequences(seq, arr) { // findSequences() by Max Nest
    const res = []
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < seq.length; j++) {
            if (arr[i + j] !== seq[j]) break
            if (j === seq.length - 1) res.push(i)
        }
    }
    return res
}

var addr,
    chances = [0.64, 0.32, 0.16, 0.08, 0.04, 0.02, 0.01, 0, 0],
    rarity = ["Common", "Unusual", "Rare", "Epic", "Legendary", "Mythic", "Ultra", "Super", "Unique"]

function getPetalAddr(id, rarity) {
    return addr + (id * chances.length) - (chances.length - rarity)
}

function getAvg(chance) {
    return (2.5 * chance + 2.5) / chance
}

function getPercent(basicPetalNumber, endRarity, petals, ignoreRarities) {
    addr = findSequences(basicPetalNumber, Module.HEAPU32)[0]
    petals.forEach(petalName => {
        let id = window.florrio.utils.getPetals().find(x => x.i18n.fullName == petalName).id
        let percent = 0
        for (let i = 0; i < rarity.indexOf(endRarity); i++) {
            if (chances[i] == 0) continue
            let rarityAddr = getPetalAddr(id, i)
            percent = (ignoreRarities.includes(rarity[i]) == true ? 0 : Module.HEAPU32[rarityAddr] + percent) / getAvg(chances[i])
        }
        console.log(petalName, percent * 100)
    })
}

getPercent(
    [
        5, // common basic
        12, // unusual basic
        7, // rare basic
        61, // epic basic
        5, // legendary basic
        4, // mythic basic
        0, // ultra basic
        0, // super basic
        0, // unique basic
    ],
    "Ultra", // desired craft rarity
    [
        "Mysterious Stick"
    ],
    [
        // ignore rarities
    ]
)