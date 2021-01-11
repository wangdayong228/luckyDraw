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

// module.exports = async function (callback) {
//     // perform actions
//     // console.log(LuckyDraw)
//     try {
//         luckyDraw = await LuckyDraw.deployed();

//         // inintal white list
//         let whiteList = [];
//         await luckyDraw.initalWhiteList(whiteList, { from: "0x1a6048c1D81190c9A3555D0a06d0699663c4dDF0" })
//         console.log("init white list done")
//         // add plan 
//         await luckyDraw.addDrawPlan(3, 1, 3, 1e18, { value: 3 * 1e18 })
//         await luckyDraw.addDrawPlan(3, 2, 2, 1e18, { value: 2 * 1e18 })
//         await luckyDraw.addDrawPlan(2, 1, 2, 2e18, { value: 2 * 2e18 })
//         await luckyDraw.addDrawPlan(1, 1, 1, 3e18, { value: 1 * 3e18 })
//         console.log("add draw plan done")
//         callback()
//     } catch (err) {
//         callback(err)
//     }
// }

const whiteList = ["0xe388b6d301c6006f82a47e1aced9dc1da9496c5e2f01730db94334af9d42d155",
    "0x29f15172344342ea9810eb5df1694059173a3dae4cc5da62a752b123fb4f7f6a",
    "0xc95eb74e2d7483dfe5ac77ab836dbb6bd75020d34583ae0d7d2bbfa50d775e05",
    "0x4d84c32e3a2f6fd9407a2f9338e86b16b87920406403a2fe99fd426d4c2dc9bc",
    "0xc852268aff67edc3a18ea2b25a888ec3996bb008ab6027d9f4dd6a5a991a90fb",
    "0x9d1659c3b8ee9520ca72a7f5592aaaeb3ec9e631c00bdbea28154b42040ac108",
    "0xe54a4a65927cec229a5d85d7efd2ff7abc643bc4b4baf6d8dd06f97b4b6b30de",
    "0x68489cbdbfca6ae385913e50813df1507a36374d99ff13c3a6f1b1b9158378d2",
    "0xad4803b5c6e8b9e5eca6458f35e957b5113b49d6a856b934f284e7f9aac28350",
    "0xabb2005f087fe261093f687796ffb69ff1e886d5ef455abc991560443a889b67",
    "0x257db0004b21d16f09a6022df255723f6f481ca0ba8099aaa21d461b51aaf640"]

async function runUseJssdk() {
    luckyDraw = cfx.Contract({ abi: content.abi, address: content.networks[10001].address })
    console.log(luckyDraw.address)
    // return

    let admin = await luckyDraw.getAdmin()
    console.log("admin:", admin)
    // return

    let bWhiteList = whiteList.map(i => Buffer.from(i.substr(2), 'hex'))
    console.log("white list:", whiteList)
    // return

    let sender = "0x1a6048c1D81190c9A3555D0a06d0699663c4dDF0"
    await luckyDraw.initalWhiteList(bWhiteList).sendTransaction({ from: sender }).executed()
    console.log("init white list done")
    // return
    // add plan 
    await luckyDraw.addDrawPlan(3, 1, 3, 1e18,).sendTransaction({ from: sender, value: 3 * 1e18 }).executed()
    await luckyDraw.addDrawPlan(3, 2, 2, 1e18,).sendTransaction({ from: sender, value: 2 * 1e18 }).executed()
    await luckyDraw.addDrawPlan(2, 1, 2, 2e18,).sendTransaction({ from: sender, value: 2 * 2e18 }).executed()
    await luckyDraw.addDrawPlan(1, 1, 1, 3e18,).sendTransaction({ from: sender, value: 1 * 3e18 }).executed()
    console.log("add draw plan done")
}

runUseJssdk().catch(console.trace)