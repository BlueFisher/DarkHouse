import * as events from 'events';

import { player, playerManager } from './player';
import { barricade } from './barricade';
import { propManager, propHp, propGun } from './prop';
import * as gameServer from './game_server';

import * as config from '../shared/game_config';
import * as serverConfig from '../config';
import * as utils from '../shared/utils';

import * as fromClientPROT from '../shared/ws_prot_from_client';
import * as toClientPROT from '../shared/ws_prot_to_client';

const point = utils.point;
type point = utils.point;

export class gameCore extends events.EventEmitter {
	static events = {
		sendToPlayers: Symbol(),
		gameOver: Symbol()
	}

	private _playerManager: playerManager;
	private _barricades: barricade[] = [];
	private _propManager: propManager;

	private _shootingCacheId = 0;
	private _shootingCache: {
		id: number,
		shootingPosition: point,
		shootingPlayer: player,
		angle: number,
		collisionPoint?: point,
		shootedPlayer?: player,
		timeCount: number
	}[] = [];
	private _runningCache: Map<player, number> = new Map();

	constructor() {
		super();

		this._playerManager = new playerManager();
		this._propManager = new propManager();

		this._barricades.push(new barricade(new point(0, 0), new point(500, 10)));
		this._barricades.push(new barricade(new point(0, 0), new point(10, 500)));
		this._barricades.push(new barricade(new point(0, 490), new point(500, 500)));
		this._barricades.push(new barricade(new point(490, 0), new point(500, 500)));

		this._initializeMainLoop();
	}

	private _initializeMainLoop() {
		// 生成新加入玩家的基础协议
		let generateNewPlayersBasicPROTs = () => {
			let newPlayersBasicPROTs = this._playerManager.getAndClearNewPlayersCache().
				map(p => p.getPlayerBasicPROT());
			return newPlayersBasicPROTs;
		}

		// 生成射击协议
		let generateShootPROTs: () => [toClientPROT.shootPROT[], toClientPROT.duringShootingPROT[]] = () => {
			let shootPROTs: toClientPROT.shootPROT[] = [];
			let duringShootingPROTs: toClientPROT.duringShootingPROT[] = [];

			for (let i = this._shootingCache.length - 1; i >= 0; i--) {
				let shootingCache = this._shootingCache[i];
				// 如果是初次加入到射击缓存中
				if (shootingCache.timeCount == shootingCache.shootingPlayer.getGun().shootingSightTimeOut / serverConfig.tickrate) {
					shootPROTs.push({
						id: shootingCache.id,
						position: shootingCache.shootingPosition,
						angle: shootingCache.angle,
						playerIdsInSight: this._playerManager
							.getPlayersInRadius(shootingCache.shootingPosition, shootingCache.shootingPlayer.getGun().shootingSightRadius)
							.map(p => p.id),
						shootingPlayerId: shootingCache.shootingPlayer.id,
						collisionPoint: shootingCache.collisionPoint,
						shootedPlayerId: shootingCache.shootedPlayer ? shootingCache.shootedPlayer.id : undefined
					});
					shootingCache.timeCount--;
				} else {
					if (--shootingCache.timeCount <= 0) {
						duringShootingPROTs.push({
							id: shootingCache.id,
							playerIdsInSight: [],
							isEnd: true
						});
						this._shootingCache.splice(i, 1);
					} else {
						duringShootingPROTs.push({
							id: shootingCache.id,
							playerIdsInSight: this._playerManager
								.getPlayersInRadius(shootingCache.shootingPosition, shootingCache.shootingPlayer.getGun().shootingSightRadius)
								.map(p => p.id),
							isEnd: false
						});
					}

				}
			}
			return [shootPROTs, duringShootingPROTs];
		}

		// 生成奔跑协议
		let generateRunningPROTs = (connectedPlayers: player[]) => {
			let runningPROTs: toClientPROT.runningPROT[] = [];
			for (let runningPlayer of connectedPlayers.filter(p => p.canMove && p.isRunning)) {
				let runningCache = this._runningCache.get(runningPlayer);
				if (!runningCache) {
					runningCache = 1;
					this._runningCache.set(runningPlayer, runningCache);
				}

				if (runningCache >= 1 && runningCache <= 5) {
					runningPROTs.push({
						position: runningPlayer.position,
						playerIdsInSight: this._playerManager
							.getPlayersInRadius(runningPlayer.position, config.player.runningSightRadius)
							.map(p => p.id)
					});
				}

				if (runningCache == 10) {
					this._runningCache.set(runningPlayer, 1);
				} else {
					this._runningCache.set(runningPlayer, runningCache + 1);
				}
			}
			return runningPROTs;
		}

		// 主计时器循环
		setInterval(() => {
			let sendingMap = new Map<number, toClientPROT.mainPROT>();
			let newPlayersBasicPROTs = generateNewPlayersBasicPROTs();
			let [shootPROTs, duringShootingPROTs] = generateShootPROTs();
			let connectedPlayers = this._playerManager.players.filter(p => p.connected);
			let runningPROTs = generateRunningPROTs(connectedPlayers);
			let propPROTs = this._propManager.getAndClearPropPROTs();

			for (let player of connectedPlayers) {
				let mainPROT = new toClientPROT.mainPROT(
					this._playerManager.getPlayersInPlayerSight(player, config.player.sightRadius).map(p => p.id));
				mainPROT.shootPROTs = shootPROTs;
				mainPROT.duringShootingPROTs = duringShootingPROTs;
				mainPROT.runningPROTs = runningPROTs;
				mainPROT.newPlayerBPROTs = newPlayersBasicPROTs.filter(p => p.id != player.id);

				mainPROT.newPropHpPROTs = propPROTs.newPropHps;
				mainPROT.removedPropHpIds = propPROTs.removedPropHpIds;
				mainPROT.newPropGunPROTs = propPROTs.newPropGuns;
				mainPROT.removedPropGunIds = propPROTs.removedPropGunIds;

				mainPROT.rankList = this._playerManager.getRankList();

				mainPROT.formatPlayerPROT(player.id, (playerId) => {
					let player = this._playerManager.findPlayerById(playerId);
					if (player)
						return player.getPlayerPROT();
					else
						return null;
				});

				sendingMap.set(player.id, mainPROT);
			}

			this.emit(gameCore.events.sendToPlayers, sendingMap);
		}, 1000 / serverConfig.tickrate);

		// 生命值道具计时器循环
		setInterval(() => {
			if (this._propManager.propHps.length < config.hp.maxNumber)
				this._addNewPropHp();
		}, config.hp.appearInterval);

		// 玩家移动计时器循环
		setInterval(() => {
			for (let player of this._playerManager.players) {
				this._playerMove(player);
			}
		}, config.player.movingInterval);
	}

	private _addNewPropHp() {
		let newPosition: point | undefined;
		while (!newPosition) {
			newPosition = new point(Math.random() * config.stage.width, Math.random() * config.stage.height);
			if (this._playerManager.players.find(p => p.didPlayerCollided(newPosition as point))) {
				newPosition = undefined;
				continue;
			}
			if (this._barricades.find(p => p.didPlayerCollided(newPosition as point))) {
				newPosition = undefined;
				continue;
			}
		}
		this._propManager.addPropHp(newPosition);
	}

	/**获取玩家的初始化协议 */
	getInitPROT(currPlayerId: number) {
		let players = this._playerManager.players;

		return new toClientPROT.initialize(currPlayerId,
			players.map(p => p.getPlayerBasicPROT()),
			this._barricades.map(p => p.getBarricadePROT()),
			this._propManager.propHps.map(p => p.getPropHpPROT()),
			this._propManager.propGuns.map(p => p.getPropGunPROT())
		);
	}

	/**玩家是否还在游戏中 */
	isPlayerOnGame(playerId: number): boolean {
		let player = this._playerManager.players.find(p => p.id == playerId);
		return player != undefined;
	}
	/**添加新玩家 */
	addNewPlayer(name: string): number {
		let newPoisition: point | undefined;
		while (!newPoisition) {
			newPoisition = new point(Math.random() * config.stage.width, Math.random() * config.stage.height);
			if (this._playerManager.players.find(p => p.didPlayerCollided(newPoisition as point))) {
				newPoisition = undefined;
				continue;
			}
			if (this._barricades.find(p => p.didPlayerCollided(newPoisition as point))) {
				newPoisition = undefined;
				continue;
			}
		}

		let newPlayer = this._playerManager.addNewPlayer(name, newPoisition);
		return newPlayer.id;
	}

	playerDisconnected(playerId: number) {
		let player = this._playerManager.findPlayerById(playerId);
		if (player)
			player.connected = false;
	}
	playerReconnected(playerId: number) {
		let player = this._playerManager.findPlayerById(playerId);
		if (player)
			player.connected = true;
	}

	startRunning(playerId: number, active: boolean) {
		let player = this._playerManager.findPlayerById(playerId);
		if (player)
			player.isRunning = active;
	}

	stopMoving(playerId: number, active: boolean) {
		let player = this._playerManager.findPlayerById(playerId);
		if (player)
			player.canMove = !active;
	}

	rotate(playerId: number, angle: number) {
		let player = this._playerManager.findPlayerById(playerId);
		if (player)
			player.setDirectionAngle(angle);
	}

	private _playerMove(player: player) {
		if (!player.connected || !player.canMove) {
			return;
		}
		let angle = player.getDirectionAngle();
		let oldPos: point = player.position;
		let step = player.isRunning ? config.player.runingStep : config.player.movingStep;
		let x = oldPos.x + Math.cos(angle) * step;
		let y = oldPos.y + Math.sin(angle) * step;
		let newPos = new point(x, y);

		this._barricades.forEach(p => {
			p.adjustPlayerCollided(oldPos, newPos);
		});

		this._playerManager.players.forEach(p => {
			if (p == player)
				return;

			p.adjustPlayerCollided(newPos);
		});

		this._propManager.tryCoverProp(player, newPos);

		player.position = newPos;
	}

	startShooting(playerId: number, active: boolean) {
		let player = this._playerManager.findPlayerById(playerId);
		if (player) {
			player.startShooting(active, () => {
				if (player)
					this._playerShoot(player);
			});
		}
	}

	private _playerShoot(player: player) {
		player.records.shootingTimes++;

		let position = player.position;
		let angle = player.getDirectionAngle();

		let playersInRay = this._playerManager.players.map(p => {
			if (p == player)
				return null;

			let collidedPoint = p.getRayCollidedPoint(position, angle);
			if (collidedPoint) {
				return {
					player: p,
					point: collidedPoint
				}
			} else {
				return null;
			}
		});

		let minDistance = Infinity;
		let minPoint: point | undefined;
		let firstshootedPlayer: player | undefined;

		for (let playerInRay of playersInRay) {
			if (playerInRay) {
				let d = utils.getTwoPointsDistance(playerInRay.point, position);
				if (d < minDistance) {
					minDistance = d;
					minPoint = playerInRay.point;
					firstshootedPlayer = playerInRay.player;
				}
			}
		}

		let collidedBarricadePoints = this._barricades.map(b => {
			return b.getRayCollidedPoint(position, angle);
		});

		for (let barricadePoint of collidedBarricadePoints) {
			if (barricadePoint) {
				let d = Math.sqrt((barricadePoint.x - position.x) ** 2
					+ (barricadePoint.y - position.y) ** 2);
				if (d < minDistance) {
					minDistance = d;
					minPoint = barricadePoint;
					firstshootedPlayer = undefined;
				}
			}
		}

		if (firstshootedPlayer) {
			player.records.shootingInAimTimes++;
			firstshootedPlayer.records.shootedTimes++;

			let hp = firstshootedPlayer.getHp();
			if (hp - 1 == 0) {
				player.records.killTimes++;
				this.emit(gameCore.events.gameOver, firstshootedPlayer.id,
					new toClientPROT.gameOver(firstshootedPlayer.records));
				this._playerManager.removePlayer(firstshootedPlayer);

				if (firstshootedPlayer.getGun().getBullet() > 0) {
					this._propManager.addPropGun(firstshootedPlayer.position, firstshootedPlayer.getGun());
				}
			} else {
				firstshootedPlayer.setHp(hp - 1);
			}
		}

		this._shootingCache.push({
			id: ++this._shootingCacheId,
			shootingPosition: player.position,
			shootingPlayer: player,
			angle: angle,
			collisionPoint: minPoint,
			shootedPlayer: firstshootedPlayer,
			timeCount: player.getGun().shootingSightTimeOut / serverConfig.tickrate
		});
	}
}