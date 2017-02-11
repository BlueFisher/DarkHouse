"use strict";
const weapon_1 = require("./weapon");
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
class propWeapon extends prop {
    constructor(position, weapon) {
        super(position);
        this.weapon = weapon;
    }
    getPropGunPROT() {
        return {
            id: this.id,
            position: this.position,
            weapontType: this.weapon.weaponType,
            attackType: this.weapon.attackType
        };
    }
}
exports.propWeapon = propWeapon;
class propManager {
    constructor(generateEmptyPositionFunc) {
        this.propHps = [];
        this.propWeapons = [];
        this._newPropHpsCache = [];
        this._removedPropHpIdsCache = [];
        this._newPropGunsCache = [];
        this._removedPropGunIdsCache = [];
        // 生命值道具计时器循环
        setInterval(() => {
            if (this.propHps.length < config.prop.hp.maxNumber) {
                let newPosition = generateEmptyPositionFunc(config.prop.hp.activeRadius);
                this.addPropHp(newPosition);
            }
        }, config.prop.hp.appearInterval);
        setInterval(() => {
            if (this.propWeapons.length < config.prop.weapon.maxNumber) {
                let newPosition = generateEmptyPositionFunc(config.prop.weapon.activeRadius);
                let setting = config.weapon.gun.defaultSettings.get(config.weapon.gun.type.rifle);
                if (setting) {
                    setting.bullet = parseInt((Math.random() * setting.maxBullet).toFixed(0));
                    this.addPropWeapon(newPosition, new weapon_1.gun(config.weapon.gun.type.rifle, setting));
                }
            }
        }, config.prop.weapon.appearInterval);
    }
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
    addPropWeapon(position, gun) {
        let newPropWeapon = new propWeapon(position, gun);
        this.propWeapons.push(newPropWeapon);
        this._newPropGunsCache.push(newPropWeapon);
    }
    tryCoverProp(player, newPos) {
        for (let i = this.propHps.length - 1; i >= 0; i--) {
            let propHp = this.propHps[i];
            if (utils.didTwoCirclesCollied(propHp.position, config.prop.hp.activeRadius, newPos, config.player.radius)) {
                player.setHp(player.getHp() + 1);
                this.propHps.splice(i, 1);
                this._removedPropHpIdsCache.push(propHp.id);
            }
        }
        for (let i = this.propWeapons.length - 1; i >= 0; i--) {
            let propWeapon = this.propWeapons[i];
            if (utils.didTwoCirclesCollied(propWeapon.position, config.prop.hp.activeRadius, newPos, config.player.radius)) {
                // 如果道具枪与玩家现有枪的类型
                if (propWeapon.weapon.attackType == config.weapon.attackType.gun) {
                    if (player.getGun().weaponType == propWeapon.weapon.weaponType) {
                        player.getGun().addBullet(propWeapon.weapon.getBullet());
                    }
                    else {
                        player.setGun(propWeapon.weapon);
                    }
                }
                else if (propWeapon.weapon.attackType == config.weapon.attackType.melee) {
                    if (player.getMelee().weaponType != propWeapon.weapon.weaponType) {
                        player.setMelee(propWeapon.weapon);
                    }
                }
                this.propWeapons.splice(i, 1);
                this._removedPropGunIdsCache.push(propWeapon.id);
            }
        }
    }
}
exports.propManager = propManager;
//# sourceMappingURL=prop.js.map