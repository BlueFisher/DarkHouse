"use strict";
const serverConfig = require("../../config");
const utils_1 = require("../shared/utils");
var player;
(function (player) {
    player.movingStep = 0.08 * serverConfig.mainInterval; // 每循环移动前进距离
    player.runingStep = 0.136 * serverConfig.mainInterval; // 每循环跑步前进距离
    player.maxHp = 6;
    player.radius = 20;
    player.sightRadius = 100;
    player.runningSightRadius = 80;
    player.runningSightRemainsTime = 200; // 玩家跑步视野出现持续时间 (ms)
    player.runningSightDisapperTime = 400; // 玩家跑步视野消失持续时间 (ms)
})(player = exports.player || (exports.player = {}));
var prop;
(function (prop) {
    prop.radius = 10; // 道具显示的半径
    var hp;
    (function (hp) {
        hp.activeRadius = 5; // 血包触发的半径
        hp.maxNumber = 5; // 血包存在最大数量
        hp.appearInterval = 10000; // 血包出现时间间隔
    })(hp = prop.hp || (prop.hp = {}));
    var weapon;
    (function (weapon) {
        weapon.activeRadius = 5;
        weapon.maxNumber = 2;
        weapon.appearInterval = 15000;
    })(weapon = prop.weapon || (prop.weapon = {}));
})(prop = exports.prop || (exports.prop = {}));
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
            bulletFlyStep: 5 * serverConfig.mainInterval,
            maxBullet: 30
        });
        gun.defaultSettings.set(type.rifle, {
            attackType: attackType.gun,
            attackInterval: 200,
            attackSightRadius: 160,
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
            attackInterval: 600,
            attackSightRadius: 50,
            attackSightRemainsTime: 60,
            bulletFlyStep: 10
        });
    })(melee = weapon.melee || (weapon.melee = {}));
})(weapon = exports.weapon || (exports.weapon = {}));
var stage;
(function (stage) {
    stage.width = 1000;
    stage.height = 500;
    stage.barricades = [
        [new utils_1.point(360, 50), new utils_1.point(550, 90)],
        [new utils_1.point(310, 130), new utils_1.point(610, 160)],
        [new utils_1.point(100, 160), new utils_1.point(160, 410)],
        [new utils_1.point(790, 160), new utils_1.point(850, 410)],
        [new utils_1.point(440, 220), new utils_1.point(480, 450)],
    ];
})(stage = exports.stage || (exports.stage = {}));
//# sourceMappingURL=game_config.js.map