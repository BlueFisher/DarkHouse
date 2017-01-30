import * as config from '../shared/game_config';

export class gun {
	readonly type: config.gun.type;

	readonly shootingInterval: number;
	readonly shootingSightRadius: number;
	readonly shootingSightTimeOut: number;

	private _bullet = 15;
	private _maxBullet = 30;

	private _canShoot = true;

	constructor(type: config.gun.type, defaultSetting: config.gun.defaultSetting) {
		this.type = type;
		this.shootingInterval = defaultSetting.shootingInterval;
		this.shootingSightRadius = defaultSetting.shootingSightRadius;
		this.shootingSightTimeOut = defaultSetting.shootingSightTimeOut;
		this._bullet = defaultSetting.bullet;
		this._maxBullet = defaultSetting.maxBullet;
	}

	shoot(canShootCallback: () => void) {
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

	addBuilet(n: number) {
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