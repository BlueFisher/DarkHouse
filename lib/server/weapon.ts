import * as serverConfig from '../../config';
import * as config from '../shared/game_config';

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
	private _bullet: number;
	readonly maxBullet: number;
	readonly damageRanges: config.weapon.gun.damageRange[];

	isEquippedSilencer = false;

	constructor(type: config.weapon.gun.type, defaultSetting: config.weapon.gun.defaultSetting) {
		super(defaultSetting, type);
		this._bullet = defaultSetting.bullet;
		this.maxBullet = defaultSetting.maxBullet;
		this.damageRanges = defaultSetting.damageRanges;
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
		if (this._bullet > this.maxBullet)
			this._bullet = this.maxBullet;
	}
	getBullet() {
		return this._bullet;
	}
}

export class melee extends weapon {
	readonly damage: number;

	constructor(type: config.weapon.melee.type, defaultSetting: config.weapon.melee.defaultSetting) {
		super(defaultSetting, type);

		this.damage = defaultSetting.damage;
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