"use strict";
const serverConfig = require("../config");
var player;
(function (player) {
    player.movingStep = 0.08 * serverConfig.mainInterval; // 每循环移动前进距离
    player.runingStep = 0.2 * serverConfig.mainInterval; // 每循环跑步前进距离
    player.maxHp = 6;
    player.radius = 20;
    player.sightRadius = 100;
    player.runningSightRadius = 80;
    player.runningSightRemainsTime = 200; // 玩家跑步视野出现持续时间 (ms)
    player.runningSightDisapperTime = 400; // 玩家跑步视野消失持续时间 (ms)
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
var weapon;
(function (weapon) {
    var attackType;
    (function (attackType) {
        attackType[attackType["gun"] = 0] = "gun";
        attackType[attackType["melee"] = 1] = "melee";
    })(attackType = weapon.attackType || (weapon.attackType = {}));
    var gun;
    (function (gun) {
        var type;
        (function (type) {
            type[type["pistol"] = 0] = "pistol";
            type[type["rifle"] = 1] = "rifle";
        })(type = gun.type || (gun.type = {}));
        gun.defaultSettings = new Map();
        gun.defaultSettings.set(type.pistol, {
            attackType: attackType.gun,
            attackInterval: 500,
            attackSightRadius: 130,
            attackSightRemainsTime: 70,
            bullet: 15,
            bulletFlyStep: 3 * serverConfig.mainInterval,
            maxBullet: 30
        });
        gun.defaultSettings.set(type.rifle, {
            attackType: attackType.gun,
            attackInterval: 200,
            attackSightRadius: 200,
            attackSightRemainsTime: 60,
            bullet: 30,
            bulletFlyStep: 0.8 * serverConfig.mainInterval,
            maxBullet: 60
        });
    })(gun = weapon.gun || (weapon.gun = {}));
    var melee;
    (function (melee) {
        var type;
        (function (type) {
            type[type["fist"] = 0] = "fist";
        })(type = melee.type || (melee.type = {}));
        melee.defaultSettings = new Map();
        melee.defaultSettings.set(type.fist, {
            attackType: attackType.melee,
            attackInterval: 1000,
            attackSightRadius: 50,
            attackSightRemainsTime: 60,
            bulletFlyStep: 10
        });
    })(melee = weapon.melee || (weapon.melee = {}));
})(weapon = exports.weapon || (exports.weapon = {}));
var stage;
(function (stage) {
    stage.width = 500;
    stage.height = 500;
})(stage = exports.stage || (exports.stage = {}));
//# sourceMappingURL=game_config.js.map