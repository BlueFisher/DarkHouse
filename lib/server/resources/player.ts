import * as utils from '../../shared/utils';
import * as config from '../../shared/game_config';
import * as toClientPROT from '../../shared/ws_prot_to_client';

import { gun, melee } from './weapon';
import { edge, barricadeManager } from './barricade';
import * as props from './prop';
import * as eqpts from './equipment';

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
	private _sightRadius: number = config.player.sightRadius;

	position: point;
	records: toClientPROT.records = {
		attackTimes: 0,
		attackInAimTimes: 0,
		attactedTimes: 0,
		killTimes: 0
	};
	canMove = true;

	readonly eqpts: eqpts.equipment[] = [];

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
	setSightRadius(radius: number) {
		this._sightRadius = radius;
	}
	getSightRadius() {
		return this._sightRadius;
	}

	setHp(hp: number) {
		if (hp < 0)
			this._hp = 0;
		else if (hp > config.player.maxHp)
			this._hp = config.player.maxHp
		else
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
			maxBullet: this._gun.maxBullet
		}
	}
	getPlayerBasicPROT(): toClientPROT.playerBasicPROT {
		return {
			id: this.id,
			name: this.name,
			eqpts: this.eqpts.map(p => p.getEqptPROT())
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

	private _isRunning = false;
	private _runningSightActive = false;
	canRun = true;
	private _runningSightRemainsTimer: NodeJS.Timer;
	private _runningSightDisapperTimer: NodeJS.Timer;
	startRunning(active: boolean) {
		if (active) {
			if (!this._isRunning && this.canRun) {
				this._isRunning = true;
				this._run();
			}
		} else {
			this._isRunning = false;
		}
	}
	private _run() {
		clearTimeout(this._runningSightRemainsTimer);
		clearTimeout(this._runningSightDisapperTimer);
		if (this._isRunning && this.canRun) {
			this._runningSightActive = true;
			this._runningSightRemainsTimer = setTimeout(() => {
				this._runningSightActive = false;
				this._runningSightDisapperTimer = setTimeout(() => {
					this._run();
				}, config.player.runningSightDisapperTime);
			}, config.player.runningSightRemainsTime);
		}
	}

	isRunningSightActive() {
		return this._runningSightActive;
	}
	isRunning() {
		return this._isRunning;
	}

	newEqptsCache: eqpts.equipment[] = [];
	removedEqptsCache: eqpts.equipment[] = [];
	getAndClearNewAndRemovedEqptPROTs() {
		let res = {
			newEqptPROTs: this.newEqptsCache.map(p => p.getEqptPROT()),
			removedEqptIds: this.removedEqptsCache.map(p => p.id)
		};
		this.newEqptsCache = [];
		this.removedEqptsCache = [];
		return res;
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
			this.canRun = false;
			this.startRunning(false);

			if (this._gun.shoot(this._shoot.bind(this))) {
				this._shootingFinishedCallback();
			} else {
				this.canRun = true;
			}
		} else {
			this.canRun = true;
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

	getAllPlayerPROTs() {
		return this.players.map(p => p.getPlayerBasicPROT());
	}

	findPlayerById(id: number) {
		return this.players.find(p => p.id == id);
	}

	addNewPlayer(name: string, position: point) {
		let newPlayer = new player(name, position);
		this.players.push(newPlayer);
		this._newPlayersCache.push(newPlayer);
		return newPlayer;
	}

	removePlayerById(playerId: number) {
		let i = this.players.findIndex(p => p.id == playerId);
		if (i != -1) {
			this.players[i].beKilled();
			this.players.splice(i, 1);
		}
	}
	removePlayer(player: player) {
		let i = this.players.findIndex(p => p == player);
		if (i != -1) {
			this.players[i].beKilled();
			this.players.splice(i, 1);
		}
	}

	getPlayersInRadius(position: point, radius: number) {
		return this.players.filter(p => {
			return utils.didTwoCirclesCollied(p.position, radius, position, config.player.radius);
		});
	}

	getRankListPROT(): toClientPROT.rankPROT[] {
		return this.players.slice(0).sort((a, b) => {
			return a.records.attackInAimTimes > b.records.attackInAimTimes ? -1 : 1;
		}).map(p => {
			return {
				id: p.id,
				killTimes: p.records.attackInAimTimes
			}
		}).slice(0, 10);
	}

	/**生成新加入玩家的基础协议 */
	getAndClearNewPlayersBasicPROTs() {
		let newPlayersBasicPROTs = this._newPlayersCache.map(p => p.getPlayerBasicPROT());
		this._newPlayersCache = [];
		return newPlayersBasicPROTs;
	}

	/**生成每个玩家视野中的玩家 */
	generatePlayersInSightMap(players: player[], barricadeManager: barricadeManager) {
		let playersInSightMap: Map<player, player[]> = new Map();

		for (let i = 0; i < players.length - 1; i++) {
			let player = players[i];

			for (let j = i + 1; j < players.length; j++) {
				let testPlayer = players[j];

				let distance = utils.getTwoPointsDistance(player.position, testPlayer.position);
				let isInPlayerSight = distance - config.player.radius <= player.getSightRadius(),
					isInTestPlayerSight = distance - config.player.radius <= testPlayer.getSightRadius();

				if (isInPlayerSight || isInTestPlayerSight) {
					if (!barricadeManager.didPlayerBlocked(player.position, testPlayer)) {
						if (isInPlayerSight) {
							utils.addInMap(playersInSightMap, player, testPlayer);
						}
						if (isInTestPlayerSight) {
							utils.addInMap(playersInSightMap, testPlayer, player);
						}
					}
				}
			}
		}

		return playersInSightMap;
	}

	getAndClearNewAndRemovedEqptPROTs(): toClientPROT.eqpt.playerNewAndRemovedEqptPROTs[]|undefined {
		let res: toClientPROT.eqpt.playerNewAndRemovedEqptPROTs[] = [];

		this.players.forEach(p => {
			let tmp = p.getAndClearNewAndRemovedEqptPROTs();
			if (tmp.newEqptPROTs.length > 0 || tmp.removedEqptIds.length > 0)
				res.push({
					playerId: p.id,
					newEqptPROTs: tmp.newEqptPROTs,
					removedEqptIds: tmp.removedEqptIds
				});
		});

		return res.length > 0 ? res : undefined;
	}

	move(player: player, adjustNewPosition: (oldPosition: point, newPosition: point) => void) {
		if (!player.canMove) {
			return;
		}
		let angle = player.getDirectionAngle();
		let oldPos: point = player.position;
		let step = player.isRunning() ? config.player.runingStep : config.player.movingStep;
		let x = oldPos.x + Math.cos(angle) * step;
		let y = oldPos.y + Math.sin(angle) * step;
		let newPos = new point(x, y);

		adjustNewPosition(oldPos, newPos);

		this.players.forEach(p => {
			if (p == player)
				return;

			p.adjustCircleCollided(newPos, config.player.radius);
		});

		return player.position = newPos;
	}
}