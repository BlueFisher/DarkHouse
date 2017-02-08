"use strict";
const serverConfig = require("../config");
class weapon {
    constructor(setting, weaponType) {
        this._canAttack = true;
        this.weaponType = weaponType;
        this.attackType = setting.attackType;
        this.attackSightRadius = setting.attackSightRadius;
        this.attackSightTimeOut = setting.attackSightRemainsTime / serverConfig.mainInterval;
        this.bulletFlyStep = setting.bulletFlyStep;
        this._attackInterval = setting.attackInterval;
    }
}
exports.weapon = weapon;
class gun extends weapon {
    constructor(type, defaultSetting) {
        super(defaultSetting, type);
        this._bullet = 15;
        this._maxBullet = 30;
        this._bullet = defaultSetting.bullet;
        this._maxBullet = defaultSetting.maxBullet;
    }
    shoot(canShootCallback) {
        if (this._canAttack && this._bullet > 0) {
            this._canAttack = false;
            this._bullet--;
            setTimeout(() => {
                this._canAttack = true;
                canShootCallback();
            }, this._attackInterval);
            return true;
        }
        return false;
    }
    addBuilet(n) {
        this._bullet += n;
        if (this._bullet > this._maxBullet)
            this._bullet = this._maxBullet;
    }
    getBullet() {
        return this._bullet;
    }
    getMaxBullet() {
        return this._maxBullet;
    }
}
exports.gun = gun;
class melee extends weapon {
    constructor(type, defaultSetting) {
        super(defaultSetting, type);
    }
    combat(canCombatCallback) {
        if (this._canAttack) {
            this._canAttack = false;
            setTimeout(() => {
                this._canAttack = true;
                canCombatCallback();
            }, this._attackInterval);
            return true;
        }
        return false;
    }
}
exports.melee = melee;
//# sourceMappingURL=weapon.js.map