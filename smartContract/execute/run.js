// var contract = require("@truffle/contract");
var content = require("../build/contracts/LuckyDraw.json");
const sdk = require("js-conflux-sdk");
const { genBatchVerifyInfo } = require("../lib/codeGen");
const { cfx, iluckyDraw, sender, whiteList, drawers, registersCode } = initEnv("test")

run()
// decodeDrawEvent()

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
        registersCode: env.registersCode
    }
}

async function run() {
    const verifyInfos = genBatchVerifyInfo(10);
    console.log("verifyInfos:", verifyInfos)
    whiteList.push(...verifyInfos.map(i => i.hash))
    registersCode.push(...verifyInfos.map(i => i.code))

    await initialContract().catch(console.trace)
    await register()
    await setDrawer()
}

async function initialContract() {

    console.log(iluckyDraw.address)
    // return

    let admin = await iluckyDraw.getAdmin()
    console.log("admin:", admin)
    // return

    let bWhiteList = whiteList.map(i => Buffer.from(i.substr(2), 'hex'))
    console.log("white list:", whiteList)
    // return

    await iluckyDraw.initalWhiteList(bWhiteList).sendTransaction({ from: sender }).executed()
    console.log("init white list done")
    // return

    // add plan 
    await iluckyDraw.addDrawPlan(3, 1, 3, 88e18,).sendTransaction({ from: sender, value: 3 * 88e18 }).executed()
    await iluckyDraw.addDrawPlan(3, 2, 2, 88e18,).sendTransaction({ from: sender, value: 2 * 88e18 }).executed()
    await iluckyDraw.addDrawPlan(2, 1, 2, 188e18,).sendTransaction({ from: sender, value: 2 * 188e18 }).executed()
    await iluckyDraw.addDrawPlan(1, 1, 1, 388e18,).sendTransaction({ from: sender, value: 1 * 388e18 }).executed()
    console.log("add draw plan done")

    console.log("whitlist num:", await iluckyDraw.getWhiteListNum())
    console.log("draw plan num:", await iluckyDraw.getDrawPlanNum())
    console.log("next draw step:", await iluckyDraw.nextDrawStep())
    console.log("check is registerd:", await iluckyDraw.checkIsRegisterd(sender))
    console.log("get player:", await iluckyDraw.getPlayerByAddress(sender))
}

async function register() {
    for (let i = 0; i < registersCode.length; i++) {
        const account = cfx.wallet.addRandom();
        await cfx.sendTransaction({ from: sender, to: account.address, value: 5e17 }).executed()
        await iluckyDraw.register(registersCode[i], i.toString(), i.toString()).sendTransaction({ from: account }).executed()
        console.log(`user ${account} register ${registersCode[i]} done`)
    }
    console.log("registered done:", registersCode.length)
}

async function setDrawer() {
    const receipt = await iluckyDraw.updateDrawers(drawers).sendTransaction({ from: sender }).executed()
    console.log("set drawer done:", receipt.outcomeStatus)
}

async function decodeDrawEvent() {
    const receipt = await cfx.getTransactionReceipt("0x2058be9d04f9ef1225030e1775a6e2f778cbe21653e31c8728303fc958f0fa5a")
    console.log("draw info:", iluckyDraw.abi.decodeLog(receipt.logs[0]).object.drawInfo.luckyGuys)
}