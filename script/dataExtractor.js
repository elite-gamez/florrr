let data = {
    versionHash: versionHash,
    mob: florrio.utils.getMobs(),
    petal: florrio.utils.getPetals(),
    talent: florrio.utils.getTalents(),
    rarity: [
        {
            index: 0,
            name: "common",
            color: 0x7EEF6D
        },
        {
            index: 1,
            name: "unusual",
            color: 0xFFE65D
        },
        {
            index: 2,
            name: "rare",
            color: 0x4D52E3
        },
        {
            index: 3,
            name: "epic",
            color: 0x861FDE
        },
        {
            index: 4,
            name: "legendary",
            color: 0xDE1F1F
        },
        {
            index: 5,
            name: "mythic",
            color: 0x1FDBDE
        },
        {
            index: 6,
            name: "ultra",
            color: 0xFF2B75
        },
        {
            index: 7,
            name: "super",
            color: 0x2BFFA3
        },
        {
            index: 8,
            name: "unique",
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
            let thisPetalAllowDrop = data.petal.find(x => x.id == k.type).rarities.map(x => x.droppable).map((x, i, a) => {
                if (x == null && i != 0) a[i] = a[i - 1]
                return a[i]
            })
            rarities.forEach((petalRarity, petalRarity_Idx) => {
                let chance = florrio.utils.calculateDropChance(k.baseChance, mobRarity_Idx, petalRarity_Idx)
                if ((chance == 0 || thisPetalAllowDrop[petalRarity_Idx] == false) && isIgnoreNonDroppable) delete chance
                else output[sid][mobRarity][data.petal.find(x => x.id == k.type).sid][petalRarity] = chance.noExponents()
            })
        })
    })
    data.drop_chance = output
}

data.mob.map(x => x.sid).forEach(sid => getMobDropChance(sid, true)) // getMobDropChance(sid, isIgnoreNonDroppable)
console.log(data)
