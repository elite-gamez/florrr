let data = {
    mob: window.florrio.utils.getMobs(),
    petal: window.florrio.utils.getPetals(),
    rarity: [
        {
            "index": 0,
            "name": "Common",
            "color": 8318829
        },
        {
            "index": 1,
            "name": "Unusual",
            "color": 16770653
        },
        {
            "index": 2,
            "name": "Rare",
            "color": 5067491
        },
        {
            "index": 3,
            "name": "Epic",
            "color": 8789982
        },
        {
            "index": 4,
            "name": "Legendary",
            "color": 14556959
        },
        {
            "index": 5,
            "name": "Mythic",
            "color": 2087902
        },
        {
            "index": 6,
            "name": "Ultra",
            "color": 16722805
        },
        {
            "index": 7,
            "name": "Super",
            "color": 2883491
        },
        {
            "index": 8,
            "name": "Unique",
            "color": 5592405
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
            output[sid][mobRarity][data.petal.find(x => x.id == k.type).i18n.fullName] = {}
            rarities.forEach((petalRarity, petalRarity_Idx) => {
                let chance = window.florrio.utils.calculateDropChance(k.baseChance, mobRarity_Idx, petalRarity_Idx)
                if ((chance == 0 || data.petal.find(x => x.id == k.type).allowedDropRarities?.[petalRarity_Idx] == false) && isIgnoreNonDroppable) delete chance
                else output[sid][mobRarity][data.petal.find(x => x.id == k.type).i18n.fullName][petalRarity] = chance.noExponents()
            })
        })
    })
    data.drop_chance = output
}

data.mob.map(x => x.sid).forEach(sid => getMobDropChance(sid, true)) // getMobDropChance(sid, isIgnoreNonDroppable)
console.log(data)