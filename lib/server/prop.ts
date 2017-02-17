import { point } from '../shared/utils';
import { player } from './player';
import { weapon, gun, melee } from './weapon';
import * as config from '../shared/game_config';
import * as utils from '../shared/utils';

import * as toClientPROT from '../shared/ws_prot_to_client';

let id = 0;

export abstract class prop {
	readonly id = ++id;
	readonly position: point;

	constructor(position: point) {
		this.position = position;
	}

	abstract getPropPROT(): toClientPROT.allPropPROTTypes
}

export class propHp extends prop {
	getPropPROT(): toClientPROT.allPropPROTTypes {
		return {
			type: toClientPROT.propType.hp,
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

	getPropPROT(): toClientPROT.allPropPROTTypes {
		return {
			type: toClientPROT.propType.weapon,
			id: this.id,
			position: this.position,
			weapontType: this.weapon.weaponType,
			attackType: this.weapon.attackType
		}
	}
}

export class propSilencer extends prop {
	getPropPROT(): toClientPROT.allPropPROTTypes {
		return {
			type: toClientPROT.propType.silencer,
			id: this.id,
			position: this.position,
		}
	}
}

export class propManager {
	readonly propHps: propHp[] = [];
	readonly propWeapons: propWeapon[] = [];
	readonly propSilencers: propSilencer[] = [];

	private _newPropsCache: prop[] = [];
	private _removedPropIdsCache: number[] = [];

	constructor(generateEmptyPositionFunc: (radius: number) => point | null) {
		// 生命值道具计时器循环
		setInterval(() => {
			if (this.propHps.length < config.prop.hp.maxNumber) {
				let newPosition = generateEmptyPositionFunc(config.prop.hp.activeRadius);
				if (newPosition)
					this.addPropHp(newPosition);
				newPosition = generateEmptyPositionFunc(config.prop.hp.activeRadius);
				if (newPosition)
					this.addPropSilencer(newPosition);
			}
		}, config.prop.hp.appearInterval);

		// 武器道具
		setInterval(() => {
			if (this.propWeapons.length < config.prop.weapon.maxNumber) {
				let newPosition = generateEmptyPositionFunc(config.prop.weapon.activeRadius);

				if (newPosition) {
					let weaponTypes = [config.weapon.gun.type.rifle, config.weapon.gun.type.rocket];
					let weaponType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];

					let setting = config.weapon.gun.defaultSettings.get(weaponType);
					if (setting) {
						this.addPropWeapon(newPosition, new gun(weaponType, setting));
					}
				}
			}
		}, config.prop.weapon.appearInterval);
	}

	getAndClearPropPROTs() {
		let res = {
			newPropsCache: this._newPropsCache.map(p => p.getPropPROT()),
			removedPropIdsCache: this._removedPropIdsCache
		}
		this._newPropsCache = [];
		this._removedPropIdsCache = [];
		return res;
	}

	getAllPropPROTs() {
		return this.propHps.map(p => p.getPropPROT())
			.concat(this.propWeapons.map(p => p.getPropPROT()))
			.concat(this.propSilencers.map(p => p.getPropPROT()));
	}

	addPropHp(position: point) {
		let newPropHp = new propHp(position);
		this.propHps.push(newPropHp);
		this._newPropsCache.push(newPropHp);
	}
	addPropWeapon(position: point, gun: gun) {
		let newPropWeapon = new propWeapon(position, gun);
		this.propWeapons.push(newPropWeapon);
		this._newPropsCache.push(newPropWeapon);
	}
	addPropSilencer(position: point) {
		let newPropSilencer = new propSilencer(position);
		this.propSilencers.push(newPropSilencer);
		this._newPropsCache.push(newPropSilencer);
	}

	tryCoverProp(player: player, newPos: point) {
		for (let i = this.propHps.length - 1; i >= 0; i--) {
			let propHp = this.propHps[i];
			if (utils.didTwoCirclesCollied(propHp.position, config.prop.hp.activeRadius, newPos, config.player.radius)) {
				player.setHp(player.getHp() + 1);
				this.propHps.splice(i, 1);
				this._removedPropIdsCache.push(propHp.id);
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
				this._removedPropIdsCache.push(propWeapon.id);
			}
		}
		for (let i = this.propSilencers.length - 1; i >= 0; i--) {
			let propSilencer = this.propSilencers[i];
			if (utils.didTwoCirclesCollied(propSilencer.position, config.prop.hp.activeRadius, newPos, config.player.radius)) {
				player.getGun().isEquippedSilencer = true;
				this.propSilencers.splice(i, 1);
				this._removedPropIdsCache.push(propSilencer.id);
			}
		}
	}
}