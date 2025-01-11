// @license agpl

function updateServers() {
    for (let i = 0; i < totalServers; i++) {
        fetch(`https://api.n.m28.io/endpoint/florrio-map-${i}-green/findEach/`).then((response) => response.json()).then((data) => {
            if (servers[matrixs[i]] == null) {
                servers[matrixs[i]] = {
                    NA: {},
                    EU: {},
                    AS: {}
                }
            }
            if (data?.servers?.["vultr-miami"]?.id) servers[matrixs[i]].NA[data.servers["vultr-miami"].id] = Math.floor(Date.now() / 1000)
            if (data?.servers?.["vultr-frankfurt"]?.id) servers[matrixs[i]].EU[data.servers["vultr-frankfurt"].id] = Math.floor(Date.now() / 1000)
            if (data?.servers?.["vultr-tokyo"]?.id) servers[matrixs[i]].AS[data.servers["vultr-tokyo"].id] = Math.floor(Date.now() / 1000)
        });
    }
    for (const [keyMatrix, valueMatrix] of Object.entries(servers)) {
        for (const [keyServer, valueServer] of Object.entries(valueMatrix)) {
            for (const [keyId, valueId] of Object.entries(valueServer)) {
                if (Math.floor(Date.now() / 1000) - valueId > 5 * 60) delete servers[keyMatrix][keyServer][keyId]
            }
        }
    }
}

function getServerByCp6Code(cp6Code) {
    for (const [biome, serversObj] of Object.entries(servers)) {
        for (const [server, obj] of Object.entries(serversObj)) {
            if (Object.keys(obj).includes(cp6Code)) {
                return { server, biome, cp6Code }
            }
        }
    }
    return
}

function getCp6IdByBiome(biome) {
    let t = {}
    Object.keys(servers[biome]).forEach(server => {
        t[server] = Object.keys(servers[biome][server])
    })
    return t
}

let servers = {},
    matrixs = ["Garden", "Desert", "Ocean", "Jungle", "Ant Hell", "Hel", "Sewers"],
    totalServers = 7

updateServers()
setInterval(() => {
    updateServers()
}, 30 * 1000)

/*
    getCp6IdByBiome(biome) will give you available cp6 codes if a biome
        example input: getCp6IdByBiome("Ant Hell")
        example output:
            {
                "NA": [
                    "1gms"
                ],
                "EU": [
                    "1gmt"
                ],
                "AS": [
                    "1gn1"
                ]
            }
        
    getServerByCp6Code(cp6Code) will give you server object that has your inputed cp6 id
        example input: getServerByCp6Code("1gms")
        example ouput:
            {
                "server": "NA",
                "biome": "Ant Hell",
                "cp6Code": "1gms"
            }
*/