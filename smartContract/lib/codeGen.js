const crypto = require('crypto');
const keccak = require('keccak');
// =======gen verify codes

const charOpts = "abcdefghijklmnopqrstuvwxyaABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"

function keccak256(buffer) {
    return keccak('keccak256').update(buffer).digest();
}

function randomBuffer(size) {
    return crypto.randomBytes(size);
}

function genVerifyInfo() {
    let len = randomBuffer(1)[0] % 8 + 8
    let randBytes = randomBuffer(len)
    for (let i = 0; i < randBytes.length; i++) {
        randBytes[i] = charOpts.charCodeAt(randBytes[i] % charOpts.length)
    }
    return {
        code: Buffer.from(randBytes).toString(),
        hash: "0x" + keccak256(randBytes).toString('hex'),
    }
}

function genBatchVerifyInfo(n) {
    let infos = []
    for (let i = 0; i < n; i++) {
        let info = genVerifyInfo()
        infos.push(info)
    }
    return infos
}
// ============================

module.exports={
    genBatchVerifyInfo,
    genVerifyInfo
}