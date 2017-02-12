import * as config from '../shared/game_config';
import * as serverConfig from '../../config';

export class weapon {
	readonly attackType: config.weapon.attackType;
	readonly weaponType: config.weapon.weaponType;
	readonly attackSightRadius: number;
	readonly attackSightTimeOut: number;
	readonly bulletFlyStep: number;

	protected _attackInterval: number;
	protected _canAttack = true;

	constructor(setting: config.weapon.commonSetting, weaponType: config.weapon.weaponType) {
		this.weaponType = weaponType;

		this.attackType = setting.attackType;
		this.attackSightRadius = setting.attackSightRadius;
		this.attackSightTimeOut = setting.attackSightRemainsTime / serverConfig.mainInterval;
		this.bulletFlyStep = setting.bulletFlyStep;
		this._attackInterval = setting.attackInterval;
	}
}

export class gun extends weapon {
	private _bullet = 15;
	private _maxBullet = 30;

	constructor(type: config.weapon.gun.type, defaultSetting: config.weapon.gun.defaultSetting) {
		super(defaultSetting,type);
		this._bullet = defaultSetting.bullet;
		this._maxBullet = defaultSetting.maxBullet;
	}

	shoot(canShootCallback: () => void) {
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

	addBullet(n: number) {
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

export class melee extends weapon {
	constructor(type: config.weapon.melee.type, defaultSetting: config.weapon.melee.defaultSetting) {
		super(defaultSetting,type);
	}

	combat(canCombatCallback: () => void) {
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