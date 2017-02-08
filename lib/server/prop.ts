import { point } from '../shared/utils';
import { player } from './player';
import { gun } from './weapon';
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

export class propGun extends prop {
	readonly gun: gun;

	constructor(position: point, gun: gun) {
		super(position);

		this.gun = gun;
	}

	getPropGunPROT(): toClientPROT.propWeaponPROT {
		return {
			id: this.id,
			position: this.position,
			weapontType: this.gun.weaponType,
			attackType: this.gun.attackType
		}
	}
}

export class propManager {
	readonly propHps: propHp[] = [];
	readonly propGuns: propGun[] = [];

	private _newPropHpsCache: propHp[] = [];
	private _removedPropHpIdsCache: number[] = [];
	private _newPropGunsCache: propGun[] = [];
	private _removedPropGunIdsCache: number[] = [];

	constructor() {
		let a = config.weapon.gun.defaultSettings.get(config.weapon.gun.type.rifle) as config.weapon.gun.defaultSetting;
		this.propGuns.push(new propGun(new point(200, 200), new gun(config.weapon.gun.type.rifle, a)));
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
	addPropGun(position: point, gun: gun) {
		let newPropGun = new propGun(position, gun);
		this.propGuns.push(newPropGun);
		this._newPropGunsCache.push(newPropGun);
	}

	tryCoverProp(player: player, newPos: point) {
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
				// 如果道具枪与玩家现有枪的类型
				if (player.getGun().weaponType == propGun.gun.weaponType) {
					player.getGun().addBuilet(propGun.gun.getBullet());
				} else {
					player.setGun(propGun.gun);
				}
				this.propGuns.splice(i, 1);
				this._removedPropGunIdsCache.push(propGun.id);
			}
		}
	}
}