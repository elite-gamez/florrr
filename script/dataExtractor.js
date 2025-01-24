let data = {
    mob: window.florrio.utils.getMobs(),
    petal: window.florrio.utils.getPetals(),
    rarity: [
        {
            index: 0,
            name: "Common",
            color: 0x7EEF6D
        },
        {
            index: 1,
            name: "Unusual",
            color: 0xFFE65D
        },
        {
            index: 2,
            name: "Rare",
            color: 0x4D52E3
        },
        {
            index: 3,
            name: "Epic",
            color: 0x861FDE
        },
        {
            index: 4,
            name: "Legendary",
            color: 0xDE1F1F
        },
        {
            index: 5,
            name: "Mythic",
            color: 0x1FDBDE
        },
        {
            index: 6,
            name: "Ultra",
            color: 0xFF2B75
        },
        {
            index: 7,
            name: "Super",
            color: 0x2BFFA3
        },
        {
            index: 8,
            name: "Unique",
            color: 0x555555
        }
    ]
}

Number.prototype.noExponents = function () {
    var data = String(this).split(/[eE]/);
    if (data.length == 1) return data[0];

    var z = '',
        sign = this < 0 ? '-' : '',
        str = data[0].replace('.', ''),
        mag = Number(data[1]) + 1;

    if (mag < 0) {
        z = sign + '0.';
        while (mag++) z += '0';
        return z + str.replace(/^\-/, '');
    }
    mag -= str.length;
    while (mag--) z += '0';
    return str + z;
} // https://stackoverflow.com/questions/18719775/parsing-and-converting-exponential-values-to-decimal-in-javascript

let output = {}

function getMobDropChance(sid, isIgnoreNonDroppable) {
    let t = data.mob.find(x => x.sid == sid)
    let rarities = data.rarity.map(x => x.name)
    output[sid] = {}
    rarities.forEach((mobRarity, mobRarity_Idx) => {
        output[sid][mobRarity] = {}
        t.drops.forEach(k => {
            output[sid][mobRarity][data.petal.find(x => x.id == k.type).sid] = {}
            rarities.forEach((petalRarity, petalRarity_Idx) => {
                let chance = window.florrio.utils.calculateDropChance(k.baseChance, mobRarity_Idx, petalRarity_Idx)
                if ((chance == 0 || data.petal.find(x => x.id == k.type).allowedDropRarities?.[petalRarity_Idx] == false) && isIgnoreNonDroppable) delete chance
                else output[sid][mobRarity][data.petal.find(x => x.id == k.type).sid][petalRarity] = chance.noExponents()
            })
        })
    })
    data.drop_chance = output
}

data.mob.map(x => x.sid).forEach(sid => getMobDropChance(sid, true)) // getMobDropChance(sid, isIgnoreNonDroppable)
console.log(data)