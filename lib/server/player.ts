import * as utils from '../shared/utils';
import * as config from '../shared/game_config';
import * as toClientPROT from '../shared/ws_prot_to_client';
import { gun, melee } from './weapon';

const point = utils.point;
type point = utils.point;

let id = 0;

export class player {
	readonly id = ++id;
	readonly name: string;
	private _angle = 0;
	private _hp = config.player.maxHp;
	private _gun: gun;
	private _melee: melee;

	position: point;
	records: toClientPROT.records = {
		attackTimes: 0,
		attackInAimTimes: 0,
		attactedTimes: 0,
		killTimes: 0
	};
	canMove = true;
	isRunning = false;
	connected = true;

	constructor(name: string, position: point) {
		this.name = name;
		this.position = position;

		let gunSetting = config.weapon.gun.defaultSettings.get(config.weapon.gun.type.pistol);
		if (gunSetting)
			this._gun = new gun(config.weapon.gun.type.pistol, gunSetting);

		let meleeSetting = config.weapon.melee.defaultSettings.get(config.weapon.melee.type.fist);
		if (meleeSetting)
			this._melee = new melee(config.weapon.melee.type.fist, meleeSetting);
	}

	setDirectionAngle(angle: number) {
		angle = angle % (Math.PI * 2);
		this._angle = angle;
	}
	getDirectionAngle() {
		return this._angle;
	}

	setHp(hp: number) {
		if (hp <= config.player.maxHp && hp >= 0)
			this._hp = hp;
	}
	getHp() {
		return this._hp;
	}

	getGun() {
		return this._gun;
	}
	setGun(gun: gun) {
		this._gun = gun;
	}
	getMelee() {
		return this._melee;
	}
	setMelee(melee: melee) {
		this._melee = melee;
	}

	getPlayerPROT(): toClientPROT.playerPROT {
		return {
			id: this.id,
			position: this.position,
			angle: this._angle,
			hp: this._hp,
			bullet: this._gun.getBullet(),
			maxBullet: this._gun.getMaxBullet()
		}
	}
	getPlayerBasicPROT(): toClientPROT.playerBasicPROT {
		return {
			id: this.id,
			name: this.name
		}
	}

	adjustCircleCollided(newPos: point, r: number) {
		if (utils.didTwoCirclesCollied(this.position, config.player.radius, newPos, r)) {
			let pos = this.position;
			let d = utils.getTwoPointsDistance(pos, newPos);
			let x = pos.x + (config.player.radius + r) * (newPos.x - pos.x) / d;
			let y = pos.y + (config.player.radius + r) * (newPos.y - pos.y) / d;
			newPos.x = x;
			newPos.y = y;
		}
	}

	didCircleCollided(pos: point, r: number) {
		return utils.didTwoCirclesCollied(this.position, config.player.radius, pos, r);
	}

	getLineCollidedPoint(oldPos: point, newPos: point) {
		let collidedPoints = utils.getLineCircleCrossPoints(oldPos, newPos, this.position, config.player.radius);

		if (collidedPoints.length == 0)
			return null;
		else if (collidedPoints.length == 1)
			return collidedPoints[0];
		else {
			let minPoint = collidedPoints[0];
			let minDistant = utils.getTwoPointsDistance(collidedPoints[0], oldPos);
			for (let i = 1; i < collidedPoints.length; i++) {
				let d = utils.getTwoPointsDistance(collidedPoints[i], oldPos);
				if (d < minDistant) {
					minPoint = collidedPoints[i];
					minDistant = d;
				}
			}
			return minPoint;
		}
	}

	// 是否可以继续射击
	private _canContinueShooting = false;
	private _shootingFinishedCallback: () => void;
	startShooting(active: boolean, shootingFinishedCallback: () => void) {
		this._canContinueShooting = active;
		this._shootingFinishedCallback = shootingFinishedCallback;
		if (active)
			this._shoot();
	}
	private _shoot() {
		if (this._canContinueShooting) {
			if (this._gun.shoot(this._shoot.bind(this))) {
				this._shootingFinishedCallback();
			}
		}
	}

	// 是否可以继续近战攻击
	private _canContinueCombat = false;
	private _combatFinishedCallback: () => void;
	startCombat(active: boolean, combatFinishedCallback: () => void) {
		this._canContinueCombat = active;
		this._combatFinishedCallback = combatFinishedCallback;
		if (active)
			this._combat();
	}
	private _combat() {
		if (this._canContinueCombat) {
			if (this._melee.combat(this._combat.bind(this))) {
				this._combatFinishedCallback();
			}
		}
	}

	beKilled() {
		this._canContinueShooting = false;
		this._canContinueCombat = false;
	}
}

export class playerManager {
	readonly players: player[] = [];
	private _newPlayersCache: player[] = [];

	findPlayerById(id: number) {
		return this.players.find(p => p.id == id);
	}

	addNewPlayer(name: string, position: point) {
		let newPlayer = new player(name, position);
		this.players.push(newPlayer);
		this._newPlayersCache.push(newPlayer);
		return newPlayer;
	}
	removePlayer(player: player) {
		let i = this.players.findIndex(p => p == player);
		if (i != -1) {
			this.players[i].beKilled();
			this.players.splice(i, 1);
		}
	}

	getAndClearNewPlayersCache() {
		let res = this._newPlayersCache;
		this._newPlayersCache = [];
		return res;
	}

	getPlayersInPlayerSight(player: player, radius: number) {
		return this.players.filter(p => {
			if (p == player)
				return false;

			return utils.didTwoCirclesCollied(p.position, radius, player.position, config.player.radius);
		});
	}
	getPlayersInRadius(position: point, radius: number) {
		return this.players.filter(p => {
			return utils.didTwoCirclesCollied(p.position, radius, position, config.player.radius);
		});
	}

	getRankList(): toClientPROT.rankPROT[] {
		return this.players.slice(0).sort((a, b) => {
			return a.records.attackInAimTimes > b.records.attackInAimTimes ? -1 : 1;
		}).map(p => {
			return {
				id: p.id,
				killTimes: p.records.attackInAimTimes
			}
		}).slice(0, 10);
	}
}