"use strict";
var type;
(function (type) {
    type[type["init"] = 0] = "init";
    type[type["main"] = 1] = "main";
    type[type["shoot"] = 2] = "shoot";
    type[type["gameOver"] = 3] = "gameOver";
})(type = exports.type || (exports.type = {}));
class baseProtocol {
    constructor(type) {
        this.type = type;
    }
}
exports.baseProtocol = baseProtocol;
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
        this.newPlayerBPROTs = [];
        this.shootPROTs = [];
        this.runningPROTs = [];
        this.propHpPROTs = [];
        this.currPlayer = currPlayer;
        this.playersInSight = playersInSight;
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