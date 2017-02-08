"use strict";
const utils_1 = require("./utils");
var type;
(function (type) {
    type[type["pong"] = 0] = "pong";
    type[type["init"] = 1] = "init";
    type[type["main"] = 2] = "main";
    type[type["gameOver"] = 3] = "gameOver";
})(type = exports.type || (exports.type = {}));
class baseProtocol {
    constructor(type) {
        this.type = type;
    }
}
exports.baseProtocol = baseProtocol;
class pongProtocol extends baseProtocol {
    constructor() {
        super(type.pong);
    }
}
exports.pongProtocol = pongProtocol;
class initialize extends baseProtocol {
    constructor(currPlayerId, players, edge, barricades, propHps, propGuns) {
        super(type.init);
        this.currPlayerId = currPlayerId;
        this.players = players;
        this.edge = edge;
        this.barricades = barricades;
        this.propHps = propHps;
        this.propGuns = propGuns;
        edge.point1 = utils_1.point.getFixedPoint(edge.point1);
        edge.point2 = utils_1.point.getFixedPoint(edge.point2);
        barricades.forEach(p => {
            p.point1 = utils_1.point.getFixedPoint(p.point1);
            p.point2 = utils_1.point.getFixedPoint(p.point2);
        });
        propHps.forEach(p => {
            p.position = utils_1.point.getFixedPoint(p.position);
        });
        propGuns.forEach(p => {
            p.position = utils_1.point.getFixedPoint(p.position);
        });
    }
}
exports.initialize = initialize;
class mainPROT extends baseProtocol {
    constructor(playersInSight) {
        super(type.main);
        this.playerPROTs = [];
        this.newPlayerBPROTs = [];
        this.attackPROTs = [];
        this.duringAttackPROTs = [];
        this.runningPROTs = [];
        this.rankList = [];
        this.newPropGunPROTs = [];
        this.removedPropGunIds = [];
        this.newPropHpPROTs = [];
        this.removedPropHpIds = [];
        this.playerIdsInSight = playersInSight;
    }
    formatPlayerPROT(currPlayerId, format) {
        let arr = [currPlayerId];
        arr = arr.concat(this.playerIdsInSight);
        this.attackPROTs.forEach(p => {
            arr = arr.concat(p.playerIdsInSight);
        });
        this.duringAttackPROTs.forEach(p => {
            arr = arr.concat(p.playerIdsInSight);
        });
        this.runningPROTs.forEach(p => {
            arr = arr.concat(p.playerIdsInSight);
        });
        let json = {};
        for (let i of arr) {
            if (!json[i]) {
                json[i] = 1;
                let playerPROT = format(i);
                if (playerPROT)
                    this.playerPROTs.push(playerPROT);
            }
        }
    }
    fixNumbers() {
        this.playerPROTs.forEach(p => {
            p.angle = parseFloat(p.angle.toFixed(2));
            p.position = utils_1.point.getFixedPoint(p.position);
        });
        this.attackPROTs.forEach(p => {
            p.angle = parseFloat(p.angle.toFixed(2));
            p.bulletPosition = utils_1.point.getFixedPoint(p.bulletPosition);
            p.position = utils_1.point.getFixedPoint(p.position);
        });
        this.duringAttackPROTs.forEach(p => {
            p.bulletPosition = utils_1.point.getFixedPoint(p.bulletPosition);
        });
        this.runningPROTs.forEach(p => {
            p.position = utils_1.point.getFixedPoint(p.position);
        });
        this.newPropGunPROTs.forEach(p => {
            p.position = utils_1.point.getFixedPoint(p.position);
        });
        this.newPropHpPROTs.forEach(p => {
            p.position = utils_1.point.getFixedPoint(p.position);
        });
    }
}
exports.mainPROT = mainPROT;
class gameOver extends baseProtocol {
    constructor(records) {
        super(type.gameOver);
        this.records = records;
    }
}
exports.gameOver = gameOver;
//# sourceMappingURL=ws_prot_to_client.js.map