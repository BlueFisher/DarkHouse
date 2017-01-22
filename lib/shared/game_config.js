"use strict";
var player;
(function (player) {
    player.movingStep = 2;
    player.runingStep = 5;
    player.maxHp = 3;
    player.radius = 20;
    player.sightRadius = 100;
    player.runningSightRadius = 80;
    player.shootingSightRadius = 130;
})(player = exports.player || (exports.player = {}));
var hp;
(function (hp) {
    hp.radius = 10;
    // 血包触发的半径
    hp.activeRadius = 5;
    // 血包存在最大数量
    hp.maxNumber = 5;
    // 血包出现时间间隔
    hp.appearInterval = 10000;
})(hp = exports.hp || (exports.hp = {}));
var stage;
(function (stage) {
    stage.width = 500;
    stage.height = 500;
})(stage = exports.stage || (exports.stage = {}));
//# sourceMappingURL=game_config.js.map