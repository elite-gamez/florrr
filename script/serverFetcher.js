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
            servers[matrixs[i]].NA[data.servers["vultr-miami"].id] = Math.floor(Date.now() / 1000)
            servers[matrixs[i]].EU[data.servers["vultr-frankfurt"].id] = Math.floor(Date.now() / 1000)
            servers[matrixs[i]].AS[data.servers["vultr-tokyo"].id] = Math.floor(Date.now() / 1000)
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
var servers = {},
    matrixs = ["Garden", "Desert", "Ocean", "Jungle", "Ant Hell", "Hel", "Sewers"]
updateServers()
setInterval(() => {
    updateServers()
    getServerId()
}, 5 * 1000)
