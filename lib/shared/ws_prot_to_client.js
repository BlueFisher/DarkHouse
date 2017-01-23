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
    constructor(currPlayer, players, barricades, propHps) {
        super(type.init);
        this.currPlayer = currPlayer;
        this.players = players;
        this.barricades = barricades;
        this.propHps = propHps;
    }
}
exports.initialize = initialize;
class mainPROT extends baseProtocol {
    constructor(currPlayer, playersInSight) {
        super(type.main);
        this.playerBPROTs = [];
        this.newPlayerBPROTs = [];
        this.shootPROTs = [];
        this.runningPROTs = [];
        this.propHpPROTs = [];
        this.currPlayerId = currPlayer;
        this.playerIdsInSight = playersInSight;
    }
    formatPlayerPROT(format) {
        let arr = [this.currPlayerId];
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
                    this.playerBPROTs.push(playerPROT);
            }
        }
    }
}
exports.mainPROT = mainPROT;
class gameOver extends baseProtocol {
    constructor() {
        super(type.gameOver);
    }
}
exports.gameOver = gameOver;
//# sourceMappingURL=ws_prot_to_client.js.map