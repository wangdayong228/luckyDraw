const LuckyDraw = artifacts.require("luckyDraw");

module.exports = function(deployer){
    deployer.deploy(LuckyDraw);
};