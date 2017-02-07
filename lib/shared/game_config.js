"use strict";
const serverConfig = require("../config");
var player;
(function (player) {
    player.movingStep = 0.08 * serverConfig.mainInterval; // 每循环移动前进距离
    player.runingStep = 0.2 * serverConfig.mainInterval; // 每循环跑步前进距离
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
var gun;
(function (gun) {
    var type;
    (function (type) {
        type[type["pistol"] = 0] = "pistol";
        type[type["rifle"] = 1] = "rifle";
    })(type = gun.type || (gun.type = {}));
    gun.defaultSettings = new Map();
    gun.defaultSettings.set(type.pistol, {
        shootingInterval: 500,
        shootingSightRadius: 130,
        shootingSightRemainsTime: 70,
        bullet: 15,
        bulletFlyStep: 3 * serverConfig.mainInterval,
        maxBullet: 30
    });
    gun.defaultSettings.set(type.rifle, {
        shootingInterval: 200,
        shootingSightRadius: 200,
        shootingSightRemainsTime: 60,
        bullet: 30,
        bulletFlyStep: 0.8 * serverConfig.mainInterval,
        maxBullet: 60
    });
})(gun = exports.gun || (exports.gun = {}));
var stage;
(function (stage) {
    stage.width = 500;
    stage.height = 500;
})(stage = exports.stage || (exports.stage = {}));
//# sourceMappingURL=game_config.js.map