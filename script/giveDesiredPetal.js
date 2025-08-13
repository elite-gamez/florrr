function giveDesirePetal(basicAddress, petal, number) {
    petal.forEach(thisPetal => {
        thisPetal = thisPetal.split(" ")
        let rarities = ["Common", "Unusual", "Rare", "Epic", "Legendary", "Mythic", "Ultra", "Super", "Unique"],
            petals = florrio.utils.getPetals().map(x => x.sid.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
        let petalRarity = rarities.indexOf(thisPetal.shift()),
            petalId = petals.indexOf(thisPetal.join(" ")) + 1
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
            12, // Unusual Basic
            7, // Rare Basic
            61, // Epic Basic
            5, // Legendary Basic
            4, // Mythic Basic
            0, // Ultra Basic
            0, // Super Basic
            0  // Unique Basic
        ],
        Module.HEAPU32
    ),
    ["Super Basic", "Super Leaf"], // Rarity & Short name (except Beetle Egg, Ant Egg and Blood Stinger)
    10 // Number of petal
)
