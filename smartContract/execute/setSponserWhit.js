var content = require("../build/contracts/LuckyDraw.json");
const sdk = require("js-conflux-sdk");
const { cfx, iluckyDraw, sender, whiteList, drawers, registersCode, networkType } = initEnv("main")


function initEnv(netType) {
    env = {
        test: require("./enviorment/testnet.json"),
        main: require("./enviorment/mainnet.json")
    }[netType]

    const cfx = new sdk.Conflux({
        url: env.url,
        // logger: console
    })

    const iluckyDraw = cfx.Contract({ abi: content.abi, address: content.networks[env.networkId].address })
    cfx.wallet.addPrivateKey(env.from.privateKey)

    return {
        cfx, iluckyDraw,
        sender: env.from.address,
        whiteList: env.whiteList,
        drawers: env.drawers,
        registersCode: env.registersCode,
        networkType: netType
    }
}

async function setPrivilege() {
    let abi = [{
        "type": "function",
        "name": "addPrivilegeByAdmin",
        "inputs": [
            {
                "type": "address",
                "name": "contractAddr"
            },
            {
                "type": "address[]",
                "name": "addresses"
            }
        ],
        "outputs": []
    }]
    let contract = cfx.Contract({ abi, address: "0x0888000000000000000000000000000000000001" })
    await contract.addPrivilegeByAdmin(iluckyDraw.address, ["0x0000000000000000000000000000000000000000"]).sendTransaction({ from: sender }).executed()
    console.log("set whitelist done")
}

async function destory() {
    let abi = [{
        "type": "function",
        "name": "destroy",
        "inputs": [
            {
                "type": "address",
                "name": "contractAddr"
            }
        ],
        "outputs": []
    }]
    let contract = cfx.Contract({ abi, address: "0x0888000000000000000000000000000000000000" })
    await contract.destroy(iluckyDraw.address).sendTransaction({ from: sender }).executed()
    console.log("destroyed")

}

// destory()
setPrivilege()
