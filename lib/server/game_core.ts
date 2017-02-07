import * as events from 'events';

import { player, playerManager } from './player';
import { edge, barricade } from './barricade';
import { propManager, propHp, propGun } from './prop';
import * as gameServer from './game_server';
import { gun } from './gun';

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

	private _edge: edge;

	private _playerManager: playerManager;
	private _barricades: barricade[] = [];
	private _propManager: propManager;

	private _shootingCacheId = 0;
	private _shootingCaches: {
		id: number,
		gun: gun,
		shootingPosition: point,
		shootingPlayer: player,
		angle: number,
		bulletPosition: point,
		collisionPoint?: point,
		shootedPlayer?: player,
		sightTimeCount: number
	}[] = [];
	private _runningCache: Map<player, number> = new Map();

	constructor(width: number, height: number, edgeX = 0, edgeY = 0, ) {
		super();

		this._playerManager = new playerManager();
		this._propManager = new propManager();

		this._edge = new edge(new point(edgeX, edgeY), new point(edgeX + width, edgeY + height));

		this._barricades.push(new barricade(new point(400, 80), new point(420, 400)));
		this._barricades.push(new barricade(new point(80, 400), new point(400, 420)));

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

			for (let i = this._shootingCaches.length - 1; i >= 0; i--) {
				let cache = this._shootingCaches[i];
				// 如果是初次加入到射击缓存中
				if (cache.sightTimeCount == cache.shootingPlayer.getGun().shootingSightTimeOut) {
					shootPROTs.push({
						id: cache.id,
						position: cache.shootingPosition,
						angle: cache.angle,
						playerIdsInSight: this._playerManager
							.getPlayersInRadius(cache.shootingPosition, cache.shootingPlayer.getGun().shootingSightRadius)
							.map(p => p.id),
						shootingPlayerId: cache.shootingPlayer.id,
						bulletPosition: cache.bulletPosition
					});
					cache.sightTimeCount--;
				} else {
					let duringShootingPROT: toClientPROT.duringShootingPROT = {
						id: cache.id,
						bulletPosition: cache.bulletPosition,
						playerIdsInSight: [],
						isSightEnd: false,
						isEnd: false
					};
					if (--cache.sightTimeCount <= 0) {
						duringShootingPROT.isSightEnd = true;
					} else {
						duringShootingPROT.playerIdsInSight = this._playerManager
							.getPlayersInRadius(cache.shootingPosition, cache.shootingPlayer.getGun().shootingSightRadius)
							.map(p => p.id);
					}
					if (cache.collisionPoint) {
						duringShootingPROT.shootedPlayerId = cache.shootedPlayer ? cache.shootedPlayer.id : undefined;
						duringShootingPROT.isEnd = true;
						this._shootingCaches.splice(i, 1);
					}

					duringShootingPROTs.push(duringShootingPROT);
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

		let handleShootingCache = () => {
			for (let cache of this._shootingCaches.filter(p => !p.collisionPoint)) {
				let oldPos = cache.bulletPosition,
					newPos = new point(oldPos.x + cache.gun.bulletFlyStep * Math.cos(cache.angle),
						oldPos.y + cache.gun.bulletFlyStep * Math.sin(cache.angle));

				let collidedPlayers = this._playerManager.players.map(p => {
					if (p == cache.shootingPlayer)
						return null;

					let collidedPoint = p.getLineCollidedPoint(oldPos, newPos);
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
				let minPoint: point | null = null;
				let firstshootedPlayer: player | null = null;

				for (let collidedPlayer of collidedPlayers) {
					if (!collidedPlayer)
						continue;
					let d = utils.getTwoPointsDistance(collidedPlayer.point, cache.shootingPosition);
					if (d < minDistance) {
						minDistance = d;
						minPoint = collidedPlayer.point;
						firstshootedPlayer = collidedPlayer.player;
					}
				}

				let collidedBarricadePoints = this._barricades.map(b => {
					return b.getLineCollidedPoint(oldPos, newPos);
				});

				for (let barricadePoint of collidedBarricadePoints) {
					if (barricadePoint) {
						let d = utils.getTwoPointsDistance(barricadePoint, cache.shootingPosition);
						if (d < minDistance) {
							minDistance = d;
							minPoint = barricadePoint;
							firstshootedPlayer = null;
						}
					}
				}

				if (!minPoint) {
					let collidedEdgePoint = this._edge.getLineCollidedPoint(oldPos, newPos);
					if (collidedEdgePoint) {
						minPoint = collidedEdgePoint;
					}
				}

				if (firstshootedPlayer) {
					cache.shootedPlayer = firstshootedPlayer;
					this._playerShooted(firstshootedPlayer);
				}

				if (minPoint) {
					cache.bulletPosition = cache.collisionPoint = minPoint;
				} else {
					cache.bulletPosition = newPos;
				}
			}
		}

		let handlePlayerMoving = () => {
			for (let player of this._playerManager.players) {
				this._playerMove(player);
			}
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

			handleShootingCache();
			handlePlayerMoving();

		}, serverConfig.mainInterval);

		// 生命值道具计时器循环
		setInterval(() => {
			if (this._propManager.propHps.length < config.hp.maxNumber)
				this._addNewPropHp();
		}, config.hp.appearInterval);
	}

	private _addNewPropHp() {
		let newPosition: point | undefined;
		while (!newPosition) {
			newPosition = new point(Math.random() * config.stage.width, Math.random() * config.stage.height);
			if (this._edge.didCircleCollided(newPosition, config.player.radius)) {
				newPosition = undefined;
				continue;
			}
			if (this._playerManager.players.find(p => p.didCircleCollided(newPosition as point, config.player.radius))) {
				newPosition = undefined;
				continue;
			}
			if (this._barricades.find(p => p.didCircleCollided(newPosition as point, config.player.radius))) {
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
			this._edge.getEdgePROT(),
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
			newPoisition = new point(Math.random() * this._edge.getWidth() + this._edge.vertex1.x,
				Math.random() * this._edge.getHeight() + this._edge.vertex1.y);

			if (this._edge.didCircleCollided(newPoisition, config.player.radius)) {
				newPoisition = undefined;
				continue;
			}
			if (this._playerManager.players.find(p => p.didCircleCollided(newPoisition as point, config.player.radius))) {
				newPoisition = undefined;
				continue;
			}
			if (this._barricades.find(p => p.didCircleCollided(newPoisition as point, config.player.radius))) {
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

		this._edge.adjustCircleCollided(newPos, config.player.radius);
		this._barricades.forEach(p => {
			p.adjustCircleCollided(oldPos, newPos, config.player.radius);
		});

		this._playerManager.players.forEach(p => {
			if (p == player)
				return;

			p.adjustCircleCollided(newPos, config.player.radius);
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

	private _playerShooted(player: player) {
		player.records.shootingInAimTimes++;
		player.records.shootedTimes++;

		let hp = player.getHp();
		if (hp - 1 == 0) {
			player.records.killTimes++;
			this.emit(gameCore.events.gameOver, player.id,
				new toClientPROT.gameOver(player.records));
			this._playerManager.removePlayer(player);

			if (player.getGun().getBullet() > 0) {
				this._propManager.addPropGun(player.position, player.getGun());
			}
		} else {
			player.setHp(hp - 1);
		}
	}

	private _playerShoot(player: player) {
		player.records.shootingTimes++;

		let position = player.position;
		let angle = player.getDirectionAngle();

		this._shootingCaches.push({
			id: ++this._shootingCacheId,
			gun: player.getGun(),
			bulletPosition: new point(position.x + config.player.radius * Math.cos(angle),
				position.y + config.player.radius * Math.sin(angle)),
			shootingPosition: point.getNewInstance(position),
			shootingPlayer: player,
			angle: angle,
			sightTimeCount: player.getGun().shootingSightTimeOut
		});
	}
}