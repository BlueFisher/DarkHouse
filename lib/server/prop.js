"use strict";
let id = 0;
class prop {
    constructor(position) {
        this.id = ++id;
        this.position = position;
    }
}
exports.prop = prop;
class propHp extends prop {
    getPropHpPROT() {
        return {
            id: this.id,
            position: this.position
        };
    }
}
exports.propHp = propHp;
class propGun extends prop {
    getPropGunPROT() {
        return {
            id: this.id,
            position: this.position,
            type: this.type
        };
    }
}
exports.propGun = propGun;
//# sourceMappingURL=prop.js.map