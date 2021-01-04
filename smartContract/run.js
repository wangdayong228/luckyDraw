var contract = require("@truffle/contract");
var content = require("./build/contracts/LuckyDraw.json");
var web3js = require("web3");
var LuckyDraw = contract(content);
const sdk = require("js-conflux-sdk");


const cfx = new sdk.Conflux({
    url: "http://test.confluxrpc.org",
    logger: console
})
cfx.wallet.addPrivateKey("0x0B8E5E4FD172B3FFADE2DA8CC3132C150D2500A53424C809F22106933B8A6E6D")

module.exports = async function (callback) {
    // perform actions
    // console.log(LuckyDraw)
    try {
        luckyDraw = await LuckyDraw.deployed();

        // inintal white list
        let whiteList = [];
        await luckyDraw.initalWhiteList(whiteList, { from: "0x1a6048c1D81190c9A3555D0a06d0699663c4dDF0" })
        console.log("init white list done")
        // add plan 
        await luckyDraw.addDrawPlan(3, 1, 3, 1e18, { value: 2 * 1e18 })
        await luckyDraw.addDrawPlan(3, 2, 2, 1e18, { value: 2 * 1e18 })
        await luckyDraw.addDrawPlan(2, 1, 2, 1e18, { value: 2 * 1e18 })
        await luckyDraw.addDrawPlan(1, 1, 1, 1e18, { value: 2 * 1e18 })
        await luckyDraw.addDrawPlan(1, 1, 1, 1e18, { value: 2 * 1e18 })
        console.log("add draw plan done")
        callback()
    } catch (err) {
        callback(err)
    }
}

async function runUseJssdk() {
    luckyDraw = cfx.Contract({ abi: content.abi, address: content.networks[10001].address })
    console.log(luckyDraw.address)
    // return

    let admin = await luckyDraw.getAdmin()
    console.log("admin:", admin)
    // return

    let whiteList = [Buffer.from("bea07ca55401c7aef3cc463643c98416c429cd0b95031dfd79cf263c82076d79", 'hex')];
    let sender = "0x1a6048c1D81190c9A3555D0a06d0699663c4dDF0"
    await luckyDraw.initalWhiteList(whiteList).sendTransaction({ from: sender }).executed()
    console.log("init white list done")
    // add plan 
    await luckyDraw.addDrawPlan(3, 1, 3, 1e17,).sendTransaction({ from: sender, value: 3 * 1e17 }).executed()
    await luckyDraw.addDrawPlan(3, 2, 2, 1e17,).sendTransaction({ from: sender, value: 2 * 1e17 }).executed()
    await luckyDraw.addDrawPlan(2, 1, 2, 1e17,).sendTransaction({ from: sender, value: 2 * 1e17 }).executed()
    await luckyDraw.addDrawPlan(1, 1, 1, 1e17,).sendTransaction({ from: sender, value: 1 * 1e17 }).executed()
    await luckyDraw.addDrawPlan(1, 1, 1, 1e17,).sendTransaction({ from: sender, value: 1 * 1e17 }).executed()
    console.log("add draw plan done")
}

runUseJssdk().catch(console.trace)