"use strict";
var type;
(function (type) {
    type[type["init"] = 0] = "init";
    type[type["startRunning"] = 1] = "startRunning";
    type[type["stopMoving"] = 2] = "stopMoving";
    type[type["rotate"] = 3] = "rotate";
    type[type["shoot"] = 4] = "shoot";
})(type = exports.type || (exports.type = {}));
class baseProtocol {
    constructor(type) {
        this.type = type;
    }
}
exports.baseProtocol = baseProtocol;
class initialize extends baseProtocol {
    constructor(name) {
        super(type.init);
        this.name = name;
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