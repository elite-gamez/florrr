function giveDesirePetal(basicAddress, petal, number) {
    petal.forEach(thisPetal => {
        thisPetal = thisPetal.split(" ")
        let rarities = ["Common", "Unusual", "Rare", "Epic", "Legendary", "Mythic", "Ultra", "Super", "Unique"],
            petals = ['Basic', 'Light', 'Rock', 'Square', 'Rose', 'Stinger', 'Iris', 'Wing', 'Missile', 'Grapes', 'Cactus', 'Faster', 'Bubble', 'Pollen', 'Dandelion', 'Beetle Egg', 'Antennae', 'Heavy', 'Yin Yang', 'Web', 'Honey', 'Leaf', 'Salt', 'Rice', 'Corn', 'Sand', 'Pincer', 'Yucca', 'Magnet', 'Yggdrasil', 'Starfish', 'Pearl', 'Lightning', 'Jelly', 'Claw', 'Shell', 'Cutter', 'Dahlia', 'Uranium', 'Sponge', 'Soil', 'Fangs', 'Third Eye', 'Peas', 'Stick', 'Clover', 'Powder', 'Air', 'Basil', 'Orange', 'Ant Egg', 'Poo', 'Relic', 'Lotus', 'Bulb', 'Cotton', 'Carrot', 'Bone', 'Plank', 'Tomato', 'Mark', 'Rubber', 'Blood Stinger', 'Bur', 'Root', 'Ankh', 'Dice', 'Talisman', 'Battery', 'Amulet', 'Compass', 'Disc', 'Shovel', 'Coin', 'Chip', 'Card', 'Moon', 'Privet', 'Glass', "Corruption", "Mana Orb", "Blueberries", "Magic Cotton", "Magic Stinger", "Magic Leaf", "Magic Cactus", "Magic Eye", "Magic Missile", "Magic Stick"]
        let petalRarity = rarities.indexOf(thisPetal.shift()),
            petalId = petals.indexOf(thisPetal.join(" ")) + 1
        console.log(petalRarity, petalId)
        if ([petalId, petalRarity].includes(-1)) return console.error("Wrong petal name or rarity input.")
        Module.HEAPU32[basicAddress + (petalId * rarities.length) - (rarities.length - petalRarity)] = number
    })
}

function findSequence(seq, mem) {
    let match = 0
    for (let addr = 0; addr < mem.length; addr++) {
        if (mem[addr] === seq[match]) match++
        else if (mem[addr] === seq[0]) match = 1
        else match = 0
        if (match === seq.length) return addr - match + 1
    }
}

giveDesirePetal(
    findSequence(
        [
            5, // Common Basic
            4, // Unusual Basic
            1, // Rare Basic
            4, // Epic Basic
            4, // Legendary Basic
            4, // Mythic Basic
            0, // Ultra Basic
            0 // Super Basic
        ],
        Module.HEAPU32
    ),
    ["Super Basic", "Super Leaf"], // Rarity & Short name (except Beetle Egg, Ant Egg and Blood Stinger)
    10 // Number
)