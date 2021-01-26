const Migrations = artifacts.require("Migrations");
const LuckyDraw = artifacts.require("LuckyDraw");

const { expect } = require('chai');
const { expectRevert, expectEvent, constants, balance, BN, time } = require("@openzeppelin/test-helpers");
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { genBatchVerifyInfo } = require('../lib/codeGen');
const sleep = (interval) => new Promise((res, rej) => setTimeout(res, interval));

async function registerMulti(n) {
    n = n + 5
    expect(this.accounts.length, "accounts small than registing count").to.gte(n)
    expect(this.verifyInfos.length, "verify info small than registing count").to.gte(n)
    const blncsOfRegistered = {}
    for (let i = 5; i < n; i++) {
        // let account = web3.eth.accounts.create();
        // await web3.eth.personal.unlockAccount("0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe", "aaa", 0).catch()
        let acnt = this.accounts[i]
        // console.log(`accounts${i}:`, acnt)
        // await web3.eth.sendTransaction({ from: accounts[1], to: acnt, value: 1e18 })
        await this.luckyDraw.register(this.verifyInfos[i].code, "wishes", "blessing", { from: acnt })

        blncsOfRegistered[acnt] = new BN(await web3.eth.getBalance(acnt))
    }
    return blncsOfRegistered
}

async function addDrawPlan(level, roundIndex, luckyNum, bonus) {
    let plan = {
        level, roundIndex, luckyNum, bonus
    }
    await this.luckyDraw.addDrawPlan(level, roundIndex, luckyNum, bonus, { value: bonus * luckyNum })
    return plan
}

contract("LuckyDraw", async accounts => {
    // console.log("accounts:", accounts)

    beforeEach(async () => {
        // console.log("run LuckyDraw before hook")
        this.accounts = accounts
        const luckyDraw = await LuckyDraw.new()
        this.luckyDraw = luckyDraw
        //initalWhiteList
        let infos = genBatchVerifyInfo(90)
        this.verifyInfos = infos
        this.whiteList = infos.map(i => i.hash)
        // console.log("verifyInfos:", infos.map(i => `${i.code},${i.hash}`))
        await luckyDraw.initalWhiteList(infos.map(i => i.hash))

        //updateDrawers
        await luckyDraw.updateDrawers(accounts.slice(1, 3))
    })

    describe("register", async () => {

        // before:before.bind(this)
        it("player in white list could register", async () => {
            const n = Math.round(this.verifyInfos.length / 2)
            const goodCode = this.verifyInfos[n].code
            const goodHash = this.verifyInfos[n].hash
            const receipt = await this.luckyDraw.register(goodCode, "增胖10斤", "conflux涨10倍", { from: accounts[1] })
            const actualPlayer = await this.luckyDraw.players(goodHash)

            const expectPlayer = {
                account: accounts[1],
                wishes: "增胖10斤",
                blessing: "conflux涨10倍",
                hasWinned: false,
                isWhiteList: true
            }

            expectEvent(receipt, "Registered", {
                codeHash: goodHash,
                player: Object.values(expectPlayer)
            })
            // console.log(actualPlayer)

            expect(actualPlayer.account).to.equal(expectPlayer.account)
            expect(actualPlayer.wishes).to.equal(expectPlayer.wishes)
            expect(actualPlayer.blessing).to.equal(expectPlayer.blessing)
            expect(actualPlayer.hasWinned).to.equal(expectPlayer.hasWinned)
            expect(actualPlayer.isWhiteList).to.equal(expectPlayer.isWhiteList)

            // register again will revert
            expectRevert(this.luckyDraw.register(goodCode, "再增胖10斤", "conflux涨100倍", { from: accounts[2] }),
                "you has registered")
        })

        it("player not in white list could not not register", async () => {
            const badCode = "xxxxxxxx"
            expectRevert(this.luckyDraw.register(badCode, "再增胖10斤", "conflux涨100倍", { from: accounts[3] }),
                "invalid verify code hash")
        })

        it("check registerd", async () => {
            let isRegisterd = await this.luckyDraw.checkIsRegisterd(accounts[1])
            expect(isRegisterd).to.equal(false)

            const goodCode = this.verifyInfos[0].code
            await this.luckyDraw.register(goodCode, "增胖10斤", "conflux涨10倍", { from: accounts[1] })

            isRegisterd = await this.luckyDraw.checkIsRegisterd(accounts[1])
            expect(isRegisterd).to.equal(true)
        })
    })

    describe("draw", async () => {
        it("drawer permission", async () => {
            await addDrawPlan.call(this, 3, 0, 20, 88)
            expectRevert(this.luckyDraw.draw({ from: accounts[0] }), "need drawer permission")
        })

        it("after draw, contract state should correct", async () => {
            //addDrawPlans
            // await this.luckyDraw.addDrawPlan(3, 0, 20, 88, { value: 88 * 20 })
            const expected = await addDrawPlan.call(this, 3, 0, 20, 88)

            const regNum = Math.min(30, this.verifyInfos.length)
            const blncsOfRegBeforeDraw = await registerMulti.call(this, regNum)
            const registerd = Object.keys(blncsOfRegBeforeDraw)
            const cBlncBeforeDraw = new BN(await web3.eth.getBalance(this.luckyDraw.address))
            // console.log("this balance before draw:", cBlncBeforeDraw)
            // console.log("register done!", blncsOfRegBeforeDraw)
            expect(await this.luckyDraw.registeredCount()).to.bignumber.equal(new BN(regNum))

            // draw
            const wReceipt = await this.luckyDraw.draw({ from: accounts[1] })
            const actualDrawInfo = wReceipt.logs[0].args.drawInfo
            // console.log("drawedOneRound:", actualDrawInfo)
            expect(wReceipt.logs[0].event, "should emit DrawedOneRound").to.equal("DrawedOneRound")

            // check this round
            expect(actualDrawInfo.level).to.equal(expected.level.toString())
            expect(actualDrawInfo.roundIndex).to.equal(expected.roundIndex.toString())
            expect(actualDrawInfo.luckyNum).to.equal(expected.luckyNum.toString())
            expect(actualDrawInfo.bonus).to.equal(expected.bonus.toString())
            expect(actualDrawInfo.luckyGuys.length).to.equal(expected.luckyNum)
            expect([... new Set(actualDrawInfo.luckyGuys)].length, "has repeated winner").to.equal(expected.luckyNum)

            // every player should received cfx
            for (let i = 0; i < actualDrawInfo.luckyGuys.length; i++) {
                const hash = actualDrawInfo.luckyGuys[i]
                const p = await this.luckyDraw.players(hash)
                expect(registerd.indexOf(p.account) > -1).to.equal(true)
                expect(p.hasWinned).to.equal(true)

                const bDrawStr = await web3.eth.getBalance(p.account)
                const bDraw = new BN(bDrawStr)
                // console.log(`account ${p.account}: bNoDraw ${blncsOfRegBeforeDraw[p.account]} b ${bDraw}`)
                expect(bDraw.sub(blncsOfRegBeforeDraw[p.account])).to.bignumber.equal(new BN(expected.bonus))
            }

            // check contract balance
            const bDraw = new BN(await web3.eth.getBalance(this.luckyDraw.address))
            // console.log(`${expected.luckyNum}*${expected.bonus}=${expected.luckyNum * expected.bonus}`)
            expect(cBlncBeforeDraw.sub(bDraw), "contract balance should reduce luckyNum * bonus").to.bignumber.equal(new BN(expected.luckyNum * expected.bonus))
        })

        it("draw all plan", async () => {
            let plans = []
            //addDrawPlans
            plans.push(await addDrawPlan.call(this, 3, 0, 20, 88))
            plans.push(await addDrawPlan.call(this, 3, 1, 10, 888))
            plans.push(await addDrawPlan.call(this, 2, 0, 5, 8888))
            plans.push(await addDrawPlan.call(this, 2, 1, 3, 88888))
            plans.push(await addDrawPlan.call(this, 1, 0, 1, 888888))

            const willWins = 20 + 10 + 5 + 3 + 1
            // register
            await registerMulti.call(this, willWins * 2)

            // draw
            for (let p of plans) {
                const cBlncBeforeDraw = new BN(await web3.eth.getBalance(this.luckyDraw.address))
                const wReceipt = await this.luckyDraw.draw({ from: this.accounts[1] })
                const actualDrawInfo = wReceipt.logs[0].args.drawInfo
                // console.log("drawedOneRound:", actualDrawInfo)
                let cBlncAfterDraw = new BN(await web3.eth.getBalance(this.luckyDraw.address))
                expect(cBlncBeforeDraw.sub(cBlncAfterDraw)).to.bignumber.equal(new BN(
                    p.luckyNum * p.bonus))
                // console.log(`cbalance before:${cBlncBeforeDraw},after:${cBlncAfterDraw}`)
            }
            const winnerCount = await this.luckyDraw.winnerCount()
            expect(winnerCount).to.bignumber.equal(new BN(willWins))

            expectRevert(this.luckyDraw.draw({ from: this.accounts[1] }), "all darw plans has done")
        })

        it("player not enouch", async () => {
            let plans = []
            //addDrawPlans
            plans.push(await addDrawPlan.call(this, 3, 0, 20, 88))
            plans.push(await addDrawPlan.call(this, 3, 1, 10, 888))
            // register
            await registerMulti.call(this, 20 + 5)
            // draw
            await this.luckyDraw.draw({ from: this.accounts[1] })
            expectRevert(this.luckyDraw.draw({ from: this.accounts[1] }), "remain players not enough")
        })

        it("getWinners", async () => {
            let plans = []
            //addDrawPlans
            plans.push(await addDrawPlan.call(this, 3, 0, 5, 88))
            plans.push(await addDrawPlan.call(this, 3, 1, 3, 888))
            plans.push(await addDrawPlan.call(this, 3, 1, 2, 888))
            plans.push(await addDrawPlan.call(this, 3, 1, 1, 888))
            // register
            await registerMulti.call(this, 20 + 5)
            // draw
            await this.luckyDraw.draw({ from: this.accounts[1] })
            await this.luckyDraw.draw({ from: this.accounts[1] })
            await this.luckyDraw.draw({ from: this.accounts[1] })
            await this.luckyDraw.draw({ from: this.accounts[1] })
            // check
            let winners = await this.luckyDraw.getWinners()
            // console.log("winners:", winners)
            expect(winners.length).to.equal(11)
        })

        it("only draw enable in drawtime", async () => {
            await addDrawPlan.call(this, 3, 0, 5, 88)
            await addDrawPlan.call(this, 3, 0, 5, 88)
            await registerMulti.call(this, 20 + 5)
            await this.luckyDraw.draw({ from: this.accounts[1] })
            // let startDrawTime = Math.round(new Date() / 1000) + 1
            await this.luckyDraw.setDrawStartTime(startDrawTime)
            // console.log("draw start time:", (await this.luckyDraw.drawStartTime()).toString())
            expectRevert(this.luckyDraw.draw({ from: this.accounts[1] }), "it's not time to draw")
            // console.log("start sleep", new Date()/1000)
            await sleep(10000)
            // console.log("end sleep", new Date()/1000)
            await this.luckyDraw.draw({ from: this.accounts[1] })
        })
    })

    describe("add draw plan", async () => {
        it("need enough balance when add plan", async () => {
            expectRevert(this.luckyDraw.addDrawPlan(3, 0, 20, 88, { value: 100 }), "not enough balance for bonus")
        })
    })

    describe("get draw step number", async () => {
        it("should ok", async () => {
            await addDrawPlan.call(this, 3, 0, 20, 88)
            await addDrawPlan.call(this, 3, 1, 10, 888)
            num = await this.luckyDraw.getDrawPlanNum()
            expect(num).to.bignumber.equal(new BN(2))
        })
    })

})