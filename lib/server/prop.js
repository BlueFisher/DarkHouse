"use strict";
const config = require("../shared/game_config");
const utils = require("../shared/utils");
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
class propManager {
    constructor() {
        this.propHps = [];
        this.propGuns = [];
        this._newPropHpsCache = [];
        this._removedPropHpIdsCache = [];
        this._newPropGunsCache = [];
        this._removedPropGunIdsCache = [];
    }
    // constructor() {
    // 	// 生命值道具计时器循环
    // 	setInterval(() => {
    // 		if (this._propHps.length < config.hp.maxNumber)
    // 			this._addNewPropHp();
    // 	}, config.hp.appearInterval);
    // }
    getAndClearPropPROTs() {
        let res = {
            newPropHps: this._newPropHpsCache.map(p => p.getPropHpPROT()),
            removedPropHpIds: this._removedPropHpIdsCache,
            newPropGuns: this._newPropGunsCache.map(p => p.getPropGunPROT()),
            removedPropGunIds: this._removedPropGunIdsCache
        };
        this._newPropHpsCache = [];
        this._removedPropHpIdsCache = [];
        this._newPropGunsCache = [];
        this._removedPropGunIdsCache = [];
        return res;
    }
    addPropHp(position) {
        let newPropHp = new propHp(position);
        this.propHps.push(newPropHp);
        this._newPropHpsCache.push(newPropHp);
    }
    addPropGun(position, gun) {
        let newPropGun = new propGun(position, gun);
        this.propGuns.push(newPropGun);
        this._newPropGunsCache.push(newPropGun);
    }
    tryCoverProp(player, newPos) {
        for (let i = this.propHps.length - 1; i >= 0; i--) {
            let propHp = this.propHps[i];
            if (utils.didTwoCirclesCollied(propHp.position, config.hp.activeRadius, newPos, config.player.radius)) {
                player.setHp(player.getHp() + 1);
                this.propHps.splice(i, 1);
                this._removedPropHpIdsCache.push(propHp.id);
            }
        }
        for (let i = this.propGuns.length - 1; i >= 0; i--) {
            let propGun = this.propGuns[i];
            if (utils.didTwoCirclesCollied(propGun.position, config.hp.activeRadius, newPos, config.player.radius)) {
                player.getGun().addBuilet(propGun.gun.getBullet());
                this.propGuns.splice(i, 1);
                this._removedPropGunIdsCache.push(propGun.id);
            }
        }
    }
}
exports.propManager = propManager;
//# sourceMappingURL=prop.js.map