"use strict";
var type;
(function (type) {
    type[type["pong"] = 0] = "pong";
    type[type["init"] = 1] = "init";
    type[type["main"] = 2] = "main";
    type[type["shoot"] = 3] = "shoot";
    type[type["gameOver"] = 4] = "gameOver";
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
    constructor(currPlayerId, players, barricades, propHps, propGuns) {
        super(type.init);
        this.currPlayerId = currPlayerId;
        this.players = players;
        this.barricades = barricades;
        this.propHps = propHps;
        this.propGuns = propGuns;
    }
}
exports.initialize = initialize;
class mainPROT extends baseProtocol {
    constructor(playersInSight) {
        super(type.main);
        this.playerPROTs = [];
        this.newPlayerBPROTs = [];
        this.shootPROTs = [];
        this.duringShootingPROTs = [];
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
        for (let shootPROT of this.shootPROTs) {
            arr = arr.concat(shootPROT.playerIdsInSight);
            if (shootPROT.shootedPlayerId)
                arr.push(shootPROT.shootedPlayerId);
        }
        for (let runningPROT of this.runningPROTs) {
            arr = arr.concat(runningPROT.playerIdsInSight);
        }
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