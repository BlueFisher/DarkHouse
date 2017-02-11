import { point } from '../shared/utils';
import { player } from './player';
import { weapon, gun, melee } from './weapon';
import * as config from '../shared/game_config';
import * as utils from '../shared/utils';

import * as toClientPROT from '../shared/ws_prot_to_client';

let id = 0;

export class prop {
	readonly id = ++id;
	readonly position: point;

	constructor(position: point) {
		this.position = position;
	}
}

export class propHp extends prop {
	getPropHpPROT(): toClientPROT.propHpPROT {
		return {
			id: this.id,
			position: this.position
		}
	}
}

export class propWeapon extends prop {
	readonly weapon: weapon;

	constructor(position: point, weapon: weapon) {
		super(position);

		this.weapon = weapon;
	}

	getPropGunPROT(): toClientPROT.propWeaponPROT {
		return {
			id: this.id,
			position: this.position,
			weapontType: this.weapon.weaponType,
			attackType: this.weapon.attackType
		}
	}
}

export class propManager {
	readonly propHps: propHp[] = [];
	readonly propWeapons: propWeapon[] = [];

	private _newPropHpsCache: propHp[] = [];
	private _removedPropHpIdsCache: number[] = [];
	private _newPropGunsCache: propWeapon[] = [];
	private _removedPropGunIdsCache: number[] = [];

	constructor(generateEmptyPositionFunc: (radius: number) => point) {
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
					this.addPropWeapon(newPosition, new gun(config.weapon.gun.type.rifle, setting));
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
		}
		this._newPropHpsCache = [];
		this._removedPropHpIdsCache = [];
		this._newPropGunsCache = [];
		this._removedPropGunIdsCache = [];
		return res;
	}

	addPropHp(position: point) {
		let newPropHp = new propHp(position);
		this.propHps.push(newPropHp);
		this._newPropHpsCache.push(newPropHp);
	}
	addPropWeapon(position: point, gun: gun) {
		let newPropWeapon = new propWeapon(position, gun);
		this.propWeapons.push(newPropWeapon);
		this._newPropGunsCache.push(newPropWeapon);
	}

	tryCoverProp(player: player, newPos: point) {
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
						player.getGun().addBullet((propWeapon.weapon as gun).getBullet());
					} else {
						player.setGun(propWeapon.weapon as gun);
					}
				} else if (propWeapon.weapon.attackType == config.weapon.attackType.melee) {
					if (player.getMelee().weaponType != propWeapon.weapon.weaponType) {
						player.setMelee(propWeapon.weapon as melee);
					}
				}

				this.propWeapons.splice(i, 1);
				this._removedPropGunIdsCache.push(propWeapon.id);
			}
		}
	}
}