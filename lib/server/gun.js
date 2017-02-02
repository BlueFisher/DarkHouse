"use strict";
class gun {
    constructor(type, defaultSetting) {
        this._bullet = 15;
        this._maxBullet = 30;
        this._canShoot = true;
        this.type = type;
        this.shootingInterval = defaultSetting.shootingInterval;
        this.shootingSightRadius = defaultSetting.shootingSightRadius;
        this.shootingSightTimeOut = defaultSetting.shootingSightTimeOut;
        this._bullet = defaultSetting.bullet;
        this._maxBullet = defaultSetting.maxBullet;
    }
    shoot(canShootCallback) {
        if (this._canShoot && this._bullet > 0) {
            this._canShoot = false;
            this._bullet--;
            setTimeout(() => {
                this._canShoot = true;
                canShootCallback();
            }, this.shootingInterval);
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
//# sourceMappingURL=gun.js.map