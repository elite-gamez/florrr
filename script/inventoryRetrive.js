function findSequence(seq, mem) {
    let match = 0
    for (let addr = 0; addr < mem.length; addr++) {
        if (mem[addr] === seq[match]) match++
        else if (mem[addr] === seq[0]) match = 1
        else match = 0
        if (match === seq.length) return addr - match + 1
    }
}
function getInventory(existingPetals, existingRarities, basicAddress) {
    var multiplier = [1, 5, 50, 500, 10_000, 500_000, 50_000_000, 5_000_000_000, 1_000_000_000_000],
        petalObj = {},
        craftables = {},
        uniques = {},
        fourAmounts = {},
        petalByRarityObj = JSON.parse(JSON.stringify(existingRarities.reduce((acc, curr) => (acc[curr] = {}, acc), {}))),
        rarityObj = JSON.parse(JSON.stringify(existingRarities.reduce((acc, curr) => (acc[curr] = 0, acc), {}))),
        sheetTable = JSON.stringify(JSON.parse(JSON.stringify(existingPetals)).sort())

    function betterNumber(value) {
        return Math.abs(Number(value)) >= 1.0e+9 ?
            (Math.abs(Number(value)) / 1.0e+9).toFixed(2) + "B" :
        Math.abs(Number(value)) >= 1.0e+6 ?
            (Math.abs(Number(value)) / 1.0e+6).toFixed(2) + "M" :
        Math.abs(Number(value)) >= 1.0e+3 ?
            (Math.abs(Number(value)) / 1.0e+3).toFixed(2) + "K" :
        Math.abs(Number(value))
    }
    petalObj = JSON.parse(JSON.stringify(existingPetals.reduce((acc, curr) => (acc[curr] = rarityObj, acc), {})))
    for (let i = basicAddress; i < basicAddress + existingPetals.length * existingRarities.length; i += existingRarities.length) {
        existingRarities.forEach((rarity, r) => {
            petalObj[existingPetals[(i - basicAddress) / 8]][rarity] = Module.HEAPU32[i + r]
            petalByRarityObj[rarity][existingPetals[(i - basicAddress) / 8]] = Module.HEAPU32[i + r]
            rarityObj[rarity] += Module.HEAPU32[i + r]
        })
    }

    petalObj = Object.keys(petalObj).sort().reduce((obj, key) => {
        obj[key] = petalObj[key];
        return obj
    }, {});
    for (const rarity in petalByRarityObj) {
        petalByRarityObj[rarity] = Object.keys(petalByRarityObj[rarity]).sort().reduce((obj, key) => {
            obj[key] = petalByRarityObj[rarity][key];
            return obj
        }, {});
        craftables[rarity] = Object.fromEntries(Object.entries(petalByRarityObj[rarity]).filter(([key, value]) => value >= 5))
        craftables[rarity].Total = Object.values(craftables[rarity]).reduce((partialSum, a) => partialSum + a, 0);
        craftables[rarity].MinCraftAmount = craftables[rarity].Total - (Object.values(craftables[rarity]).length - 1) * 4
        uniques[rarity] = Object.entries(petalByRarityObj[rarity]).filter(([key, value]) => value != 0).length
        fourAmounts[rarity] = Object.fromEntries(Object.entries(petalByRarityObj[rarity]).filter(([key, value]) => value == 4))
    }

    sheetTable = `{{"${new Date().toDateString().slice(4)}",${sheetTable.slice(1, -1)}}`
    Object.values(petalByRarityObj).forEach((j, index) => {
        sheetTable += `;{"${existingRarities[index]}",${Object.values(j).map(x => x = (x == 0) ? '""' : x)}}`
    })
    sheetTable += `}`
    var allPetals = Object.values(rarityObj).reduce((a, b) => a + b, 0),
        invValue = Object.values(rarityObj).reduce((a, b, index) => a + b * multiplier[index], 0)
    console.log("Sheet table\n\n", sheetTable)
    console.log("Petal arrange by name\n", petalObj)
    console.log("Petal arrange by rarity\n", petalByRarityObj)
    console.log("Total petal for each rarity\n", rarityObj)
    console.log("Craftables\n", craftables)
    console.log("Uniques\n", uniques)
    console.log("Four amounts\n", fourAmounts)
    console.log("All petals\n", allPetals, betterNumber(allPetals))
    console.log("Inventory value\n", invValue, betterNumber(invValue))
}

var result = getInventory(
    [
        "Basic",
        "Light",
        "Rock",
        "Square",
        "Rose",
        "Stinger",
        "Iris",
        "Wing",
        "Missile",
        "Grapes",
        "Cactus",
        "Faster",
        "Bubble",
        "Pollen",
        "Dandelion",
        "Beetle Egg",
        "Antennae",
        "Heavy",
        "Yin Yang",
        "Web",
        "Honey",
        "Leaf",
        "Salt",
        "Rice",
        "Corn",
        "Sand",
        "Pincer",
        "Yucca",
        "Magnet",
        "Yggdrasil",
        "Starfish",
        "Pearl",
        "Lightning",
        "Jelly",
        "Claw",
        "Shell",
        "Cutter",
        "Dahlia",
        "Uranium",
        "Sponge",
        "Soil",
        "Fangs",
        "Third Eye",
        "Peas",
        "Stick",
        "Clover",
        "Powder",
        "Air",
        "Basil",
        "Orange",
        "Ant Egg",
        "Poo",
        "Relic",
        "Lotus",
        "Bulb",
        "Cotton",
        "Carrot",
        "Bone",
        "Plank",
        "Tomato",
        "Mark",
        "Rubber",
        "Blood Stinger",
        "Bur",
        "Root",
        "Ankh",
        "Dice",
        "Talisman",
        "Battery",
        "Amulet",
        "Compass",
        "Disc",
        "Shovel",
        "Coin",
        "Chip",
        "Card",
        "Moon",
        "Privet",
        "Glass",
        "Corruption",
        "Mana Orb",
        "Blueberries",
        "Magic Cotton",
        "Magic Stinger",
        "Magic Leaf",
        "Magic Cactus",
        "Magic Eye",
        "Magic Missile",
        "Magic Stick"
        // Petal Index must be in right order
    ], [
        "Common",
        "Unusual",
        "Rare",
        "Epic",
        "Legendary",
        "Mythic",
        "Ultra",
        "Super",
        "Unique"
    ], findSequence(
        [
            5, // Common Basic
            21, // Unusual Basic
            4, // Rare Basic
            6, // Epic Basic
            4, // Legendary Basic
            2, // Mythic Basic
            0, // Ultra Basic
            0 // Super Basic
        ],
        Module.HEAPU32
    ))
// Input your basic petal amounts by rarity from Common to Super