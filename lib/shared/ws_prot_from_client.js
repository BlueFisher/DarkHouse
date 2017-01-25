"use strict";
var type;
(function (type) {
    type[type["ping"] = 0] = "ping";
    type[type["init"] = 1] = "init";
    type[type["startRunning"] = 2] = "startRunning";
    type[type["stopMoving"] = 3] = "stopMoving";
    type[type["rotate"] = 4] = "rotate";
    type[type["shoot"] = 5] = "shoot";
})(type = exports.type || (exports.type = {}));
class baseProtocol {
    constructor(type) {
        this.type = type;
    }
}
exports.baseProtocol = baseProtocol;
class pingProtocol extends baseProtocol {
    constructor() {
        super(type.ping);
    }
}
exports.pingProtocol = pingProtocol;
class initialize extends baseProtocol {
    constructor(name, resumeGame) {
        super(type.init);
        this.name = name;
        this.resumeGame = resumeGame;
    }
}
exports.initialize = initialize;
class startRunning extends baseProtocol {
    constructor(active) {
        super(type.startRunning);
        this.active = active;
    }
}
exports.startRunning = startRunning;
class stopMoving extends baseProtocol {
    constructor(active) {
        super(type.stopMoving);
        this.active = active;
    }
}
exports.stopMoving = stopMoving;
class rotate extends baseProtocol {
    constructor(angle) {
        super(type.rotate);
        this.angle = angle;
    }
}
exports.rotate = rotate;
class shoot extends baseProtocol {
    constructor() {
        super(type.shoot);
    }
}
exports.shoot = shoot;
//# sourceMappingURL=ws_prot_from_client.js.map