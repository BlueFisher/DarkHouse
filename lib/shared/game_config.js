"use strict";
var player;
(function (player) {
    player.movingStep = 2;
    player.runingStep = 5;
    player.movingInterval = 33;
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
        shootingSightTimeOut: 100,
        bullet: 15,
        maxBullet: 30
    });
    gun.defaultSettings.set(type.rifle, {
        shootingInterval: 200,
        shootingSightRadius: 200,
        shootingSightTimeOut: 100,
        bullet: 30,
        maxBullet: 60
    });
})(gun = exports.gun || (exports.gun = {}));
var stage;
(function (stage) {
    stage.width = 500;
    stage.height = 500;
})(stage = exports.stage || (exports.stage = {}));
//# sourceMappingURL=game_config.js.map