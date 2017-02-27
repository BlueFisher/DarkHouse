import * as config from '../../shared/game_config';
import * as utils from '../../shared/utils';
import * as toClientPROT from '../../shared/ws_prot_to_client';

import { player } from './player';
import { weapon, gun, melee } from './weapon';
import { eqptVisableSight } from './equipment';

const point = utils.point;
type point = utils.point;

let id = 0;

export abstract class prop {
	readonly id = ++id;
	readonly position: point;

	constructor(position: point) {
		this.position = position;
	}

	abstract getPropPROT(): toClientPROT.prop.allPropPROTTypes
	abstract effect(player: player);
}

export class propHp extends prop {
	readonly hp: number;

	constructor(position: point, hp: number) {
		super(position);

		this.hp = hp;
	}
	getPropPROT(): toClientPROT.prop.hpPROT {
		return {
			type: toClientPROT.prop.type.hp,
			id: this.id,
			position: this.position,
			hp: this.hp
		}
	}

	effect(player: player) {
		player.setHp(player.getHp() + this.hp);
	}
}

export class propWeapon extends prop {
	readonly weapon: weapon;

	constructor(position: point, weapon: weapon) {
		super(position);

		this.weapon = weapon;
	}

	getPropPROT(): toClientPROT.prop.weaponPROT {
		return {
			type: toClientPROT.prop.type.weapon,
			id: this.id,
			position: this.position,
			weapontType: this.weapon.weaponType,
			attackType: this.weapon.attackType
		}
	}

	effect(player: player) {
		if (this.weapon instanceof gun) {
			if (player.getGun().weaponType == this.weapon.weaponType) {
				player.getGun().addBullet(this.weapon.getBullet())
				if (this.weapon.isEquippedSilencer) {
					player.getGun().isEquippedSilencer = true;
				}
			} else {
				player.setGun(this.weapon);
			}
		} else if (this.weapon instanceof melee) {
			if (player.getMelee().weaponType != this.weapon.weaponType) {
				player.setMelee(this.weapon);
			}
		}
	}
}

export class propSilencer extends prop {
	getPropPROT(): toClientPROT.prop.silencerPROT {
		return {
			type: toClientPROT.prop.type.silencer,
			id: this.id,
			position: this.position,
		}
	}

	effect(player: player) {
		player.getGun().isEquippedSilencer = true;
	}
}

export class propVisableSight extends prop {
	readonly eqptVisableSight: eqptVisableSight;

	constructor(position: point, lastTime: number, radius: number) {
		super(position);

		this.eqptVisableSight = new eqptVisableSight(lastTime, radius);
	}

	getPropPROT(): toClientPROT.prop.visableSightPROT {
		return {
			type: toClientPROT.prop.type.visableSight,
			id: this.id,
			position: this.position,
			radius: this.eqptVisableSight.radius
		}
	}

	effect(player: player) {
		this.eqptVisableSight.equip(player);
	}
}

export class propManager {
	readonly propHps: propHp[] = [];
	readonly propWeapons: propWeapon[] = [];
	readonly propSilencers: propSilencer[] = [];
	readonly propVisableSight: propVisableSight[] = [];

	private _newPropsCache: prop[] = [];
	private _removedPropIdsCache: number[] = [];

	constructor(generateEmptyPositionFunc: (radius: number) => point | null) {
		setInterval(() => {
			if (this.propHps.length < config.prop.hp.smallHpMaxNumber) {
				let newPosition = generateEmptyPositionFunc(config.prop.hp.activeRadius);
				if (newPosition) {
					this._addPropHp(newPosition, config.prop.hp.smallHp);
				}
			}
		}, config.prop.hp.smallHpAppearInterval);

		setInterval(() => {
			if (this.propHps.length < config.prop.hp.bigHpMaxNumber) {
				let newPosition = generateEmptyPositionFunc(config.prop.hp.activeRadius);
				if (newPosition) {
					this._addPropHp(newPosition, config.prop.hp.bigHp);
				}
			}
		}, config.prop.hp.bigHpAppearInterval);

		setInterval(() => {
			if (this.propSilencers.length < config.prop.silencer.maxNumber) {
				let newPosition = generateEmptyPositionFunc(config.prop.hp.activeRadius);
				if (newPosition) {
					let newPropSilencer = new propSilencer(newPosition);
					this.propSilencers.push(newPropSilencer);
					this._newPropsCache.push(newPropSilencer);
				}
			}
		}, config.prop.silencer.appearInterval);

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

		setInterval(() => {
			if (this.propVisableSight.length < config.prop.visableSight.maxNumber) {
				let newPosition = generateEmptyPositionFunc(config.prop.visableSight.activeRadius);

				if (newPosition) {
					let newPropVisableSight = new propVisableSight(newPosition,
						config.prop.visableSight.lastTime,
						config.prop.visableSight.radius);
					this.propVisableSight.push(newPropVisableSight);
					this._newPropsCache.push(newPropVisableSight);
				}
			}
		}, config.prop.visableSight.appearInterval);
	}

	getAndClearNewAndRemovedPropPROTs(): [toClientPROT.prop.allPropPROTTypes[] | undefined, number[] | undefined] {
		let newPropsCache = this._newPropsCache.length > 0 ? this._newPropsCache.map(p => p.getPropPROT()) : undefined;
		let removedPropIdsCache = this._removedPropIdsCache.length > 0 ? this._removedPropIdsCache : undefined;
		this._newPropsCache = [];
		this._removedPropIdsCache = [];
		return [newPropsCache, removedPropIdsCache];
	}

	getAllPropPROTs() {
		let PROTs: toClientPROT.prop.allPropPROTTypes[] = this.propHps.map(p => p.getPropPROT());
		PROTs = PROTs.concat(this.propWeapons.map(p => p.getPropPROT()));
		PROTs = PROTs.concat(this.propSilencers.map(p => p.getPropPROT()));
		PROTs = PROTs.concat(this.propVisableSight.map(p => p.getPropPROT()));

		return PROTs;
	}

	private _addPropHp(position: point, hp: number) {
		let newPropHp = new propHp(position, hp);
		this.propHps.push(newPropHp);
		this._newPropsCache.push(newPropHp);
	}
	addPropWeapon(position: point, gun: gun) {
		let newPropWeapon = new propWeapon(position, gun);
		this.propWeapons.push(newPropWeapon);
		this._newPropsCache.push(newPropWeapon);
	}

	/**尝试自动使用道具 */
	tryCoverProp(player: player, position: point) {
		for (let i = this.propHps.length - 1; i >= 0; i--) {
			let propHp = this.propHps[i];
			if (utils.didTwoCirclesCollied(propHp.position, config.prop.hp.activeRadius, position, config.player.radius)) {
				propHp.effect(player);

				this.propHps.splice(i, 1);
				this._removedPropIdsCache.push(propHp.id);
			}
		}
		for (let i = this.propWeapons.length - 1; i >= 0; i--) {
			let propWeapon = this.propWeapons[i];
			if (utils.didTwoCirclesCollied(propWeapon.position, config.prop.hp.activeRadius, position, config.player.radius)) {
				// 如果道具枪与玩家现有枪的类型相同
				if (propWeapon.weapon instanceof gun) {
					if (player.getGun().weaponType == propWeapon.weapon.weaponType) {
						propWeapon.effect(player);

						this.propWeapons.splice(i, 1);
						this._removedPropIdsCache.push(propWeapon.id);
					}
				}
			}
		}
		for (let i = this.propSilencers.length - 1; i >= 0; i--) {
			let propSilencer = this.propSilencers[i];
			if (utils.didTwoCirclesCollied(propSilencer.position, config.prop.hp.activeRadius, position, config.player.radius)) {
				propSilencer.effect(player);

				this.propSilencers.splice(i, 1);
				this._removedPropIdsCache.push(propSilencer.id);
			}
		}
		for (let i = this.propVisableSight.length - 1; i >= 0; i--) {
			let propVisableSight = this.propVisableSight[i];
			if (utils.didTwoCirclesCollied(propVisableSight.position, config.prop.hp.activeRadius, position, config.player.radius)) {
				propVisableSight.effect(player);

				this.propVisableSight.splice(i, 1);
				this._removedPropIdsCache.push(propVisableSight.id);
			}
		}
	}

	tryUseProp(player: player, position: point) {
		for (let i = this.propWeapons.length - 1; i >= 0; i--) {
			let propWeapon = this.propWeapons[i];
			if (utils.didTwoCirclesCollied(propWeapon.position, config.prop.hp.activeRadius, position, config.player.radius)) {
				// 如果道具枪与玩家现有枪的类型
				if (propWeapon.weapon instanceof gun) {
					if (player.getGun().weaponType != propWeapon.weapon.weaponType) {
						propWeapon.effect(player);

						this.propWeapons.splice(i, 1);
						this._removedPropIdsCache.push(propWeapon.id);
					}
				} else if (propWeapon.weapon instanceof melee) {
					if (player.getMelee().weaponType != propWeapon.weapon.weaponType) {
						propWeapon.effect(player);

						this.propWeapons.splice(i, 1);
						this._removedPropIdsCache.push(propWeapon.id);
					}
				}
			}
		}
	}
}