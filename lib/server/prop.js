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
    constructor(position, gun) {
        super(position);
        this.gun = gun;
    }
    getPropGunPROT() {
        return {
            id: this.id,
            position: this.position,
            type: this.gun.type
        };
    }
}
exports.propGun = propGun;
//# sourceMappingURL=prop.js.map