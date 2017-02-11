import * as events from 'events';

import { player, playerManager } from './player';
import { edge, barricade, barricadeManager } from './barricade';
import { propManager, propHp, propWeapon } from './prop';
import * as gameServer from './game_server';
import { weapon, gun, melee } from './weapon';

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
	private _barricadeManager: barricadeManager;
	private _propManager: propManager;

	private _attackCacheId = 0;
	private _attackCaches: {
		id: number,
		weapon: weapon,
		attackPosition: point,
		attackPlayer: player,
		angle: number,
		bulletPosition: point,
		collisionPoint?: point,
		attacktedPlayer?: player,
		sightTimeCount: number,
		isEnd: boolean
	}[] = [];

	private _runningCache: Map<player, number> = new Map();

	constructor(width: number, height: number, edgeX = 0, edgeY = 0, ) {
		super();

		this._playerManager = new playerManager();
		this._propManager = new propManager(this._generateEmptyPosition.bind(this));

		this._edge = new edge(new point(edgeX, edgeY), new point(edgeX + width, edgeY + height));
		this._barricadeManager = new barricadeManager();

		this._initializeMainLoop();
	}

	private _initializeMainLoop() {
		/**生成攻击协议 */
		let generateAttackPROTs: () => [toClientPROT.attackPROT[], toClientPROT.duringAttackPROT[]] = () => {
			let attackPROTs: toClientPROT.attackPROT[] = [];
			let duringAttackPROTs: toClientPROT.duringAttackPROT[] = [];

			for (let i = this._attackCaches.length - 1; i >= 0; i--) {
				let cache = this._attackCaches[i];

				// 如果是初次加入到射击缓存中
				if (cache.sightTimeCount == cache.weapon.attackSightTimeOut) {
					attackPROTs.push({
						id: cache.id,
						attackType: cache.weapon.attackType,
						weaponType: cache.weapon.weaponType,
						position: cache.attackPosition,
						angle: cache.angle,
						playerIdsInSight: this._playerManager
							.getPlayersInRadius(cache.attackPosition, cache.weapon.attackSightRadius)
							.map(p => p.id),
						attackPlayerId: cache.attackPlayer.id,
						bulletPosition: cache.bulletPosition,
						sightRadius: cache.weapon.attackSightRadius
					});
					cache.sightTimeCount--;
				} else {
					let duringAttackPROT: toClientPROT.duringAttackPROT = {
						id: cache.id,
						bulletPosition: cache.bulletPosition,
						playerIdsInSight: [],
						attackedPlayerId: cache.attacktedPlayer ? cache.attacktedPlayer.id : undefined,
						isSightEnd: false,
						isEnd: cache.isEnd
					};

					if (cache.sightTimeCount <= 0) {
						duringAttackPROT.isSightEnd = true;
					} else {
						duringAttackPROT.playerIdsInSight = this._playerManager
							.getPlayersInRadius(cache.attackPosition, cache.weapon.attackSightRadius)
							.map(p => p.id);
					}

					duringAttackPROTs.push(duringAttackPROT);
				}
			}
			return [attackPROTs, duringAttackPROTs];
		}

		let runningSightRemainsStep = config.player.runningSightRemainsTime / serverConfig.mainInterval,
			runningSightDisapperStep = runningSightRemainsStep + config.player.runningSightDisapperTime / serverConfig.mainInterval;
		/**生成奔跑协议 */
		let generateRunningPROTs = (connectedPlayers: player[]) => {
			let runningPROTs: toClientPROT.runningPROT[] = [];
			for (let runningPlayer of connectedPlayers.filter(p => p.canMove && p.isRunning)) {
				let runningCache = this._runningCache.get(runningPlayer);
				if (!runningCache) {
					runningCache = 1;
					this._runningCache.set(runningPlayer, runningCache);
				}

				if (runningCache >= 1 && runningCache <= runningSightRemainsStep) {
					runningPROTs.push({
						position: runningPlayer.position,
						playerIdsInSight: this._playerManager
							.getPlayersInRadius(runningPlayer.position, config.player.runningSightRadius)
							.map(p => p.id)
					});
				}

				if (runningCache >= runningSightDisapperStep) {
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
			let newPlayersBasicPROTs = this._playerManager.generateNewPlayersBasicPROTs();
			let [attackPROTs, duringAttackPROTs] = generateAttackPROTs();
			let connectedPlayers = this._playerManager.players.filter(p => p.connected);
			let runningPROTs = generateRunningPROTs(connectedPlayers);
			let propPROTs = this._propManager.getAndClearPropPROTs();
			let playersInSightMap = this._playerManager.generatePlayersInSightMap(connectedPlayers,
				this._barricadeManager);


			for (let player of connectedPlayers) {
				let playersInSight = playersInSightMap.get(player);
				playersInSight = playersInSight ? playersInSight : [];

				let mainPROT = new toClientPROT.mainPROT();

				mainPROT.playerIdsInSight = playersInSight.map(p => p.id);
				mainPROT.attackPROTs = attackPROTs;
				mainPROT.duringAttackPROTs = duringAttackPROTs;
				mainPROT.runningPROTs = runningPROTs;
				mainPROT.newPlayerBPROTs = newPlayersBasicPROTs.filter(p => p.id != player.id);

				mainPROT.newPropHpPROTs = propPROTs.newPropHps;
				mainPROT.removedPropHpIds = propPROTs.removedPropHpIds;
				mainPROT.newPropWeaponPROTs = propPROTs.newPropGuns;
				mainPROT.removedPropWeaponIds = propPROTs.removedPropGunIds;

				mainPROT.rankList = this._playerManager.getRankList();

				mainPROT.formatPlayerPROT(player.id, (playerId) => {
					let player = this._playerManager.findPlayerById(playerId);
					if (player)
						return player.getPlayerPROT();
					else
						return null;
				});
				mainPROT.fixNumbers();

				sendingMap.set(player.id, mainPROT);
			}

			this.emit(gameCore.events.sendToPlayers, sendingMap);

			handleattackCache();
			handlePlayerMoving();

		}, serverConfig.mainInterval);

		let handleattackCache = () => {
			for (let i = this._attackCaches.length - 1; i >= 0; i--) {
				let cache = this._attackCaches[i];
				if (cache.sightTimeCount <= 0) {
					if (cache.isEnd) {
						this._attackCaches.splice(i, 1);
						continue;
					}
				} else {
					cache.sightTimeCount--;
					if (cache.isEnd) {
						continue;
					}
				}

				let oldPos = cache.bulletPosition,
					newPos = new point(oldPos.x + cache.weapon.bulletFlyStep * Math.cos(cache.angle),
						oldPos.y + cache.weapon.bulletFlyStep * Math.sin(cache.angle));

				let collidedPlayers = this._playerManager.players.map(p => {
					if (p == cache.attackPlayer)
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
				let firstattackedPlayer: player | null = null;

				for (let collidedPlayer of collidedPlayers) {
					if (!collidedPlayer)
						continue;
					let d = utils.getTwoPointsDistance(collidedPlayer.point, cache.attackPosition);
					if (d < minDistance) {
						minDistance = d;
						minPoint = collidedPlayer.point;
						firstattackedPlayer = collidedPlayer.player;
					}
				}

				let collidedBarricadePoints = this._barricadeManager.barricades.map(b => {
					return b.getLineCollidedPoint(oldPos, newPos);
				});

				for (let barricadePoint of collidedBarricadePoints) {
					if (barricadePoint) {
						let d = utils.getTwoPointsDistance(barricadePoint, cache.attackPosition);
						if (d < minDistance) {
							minDistance = d;
							minPoint = barricadePoint;
							firstattackedPlayer = null;
						}
					}
				}

				if (!minPoint) {
					let collidedEdgePoint = this._edge.getLineCollidedPoint(oldPos, newPos);
					if (collidedEdgePoint) {
						minPoint = collidedEdgePoint;
					}
				}

				if (firstattackedPlayer) {
					cache.attacktedPlayer = firstattackedPlayer;
					this._playerAttacked(cache.attacktedPlayer, cache.attackPlayer, cache.weapon);
				}

				if (minPoint) {
					cache.bulletPosition = cache.collisionPoint = minPoint;
					cache.isEnd = true;
				} else {
					cache.bulletPosition = newPos;
					if (cache.weapon instanceof melee) {
						cache.isEnd = true;
					}
				}
			}
		}

		let handlePlayerMoving = () => {
			for (let player of this._playerManager.players) {
				let newPos = this._playerManager.move(player, (oldPos, newPos) => {
					this._edge.adjustCircleCollided(newPos, config.player.radius);
					this._barricadeManager.barricades.forEach(p => {
						p.adjustCircleCollided(oldPos, newPos, config.player.radius);
					});
				});

				if (!newPos)
					continue;

				this._propManager.tryCoverProp(player, newPos);
			}
		}
	}

	private _generateEmptyPosition(radius: number) {
		let newPosition: point | undefined;

		while (!newPosition) {
			newPosition = new point(Math.random() * config.stage.width, Math.random() * config.stage.height);
			if (this._edge.didCircleCollided(newPosition, radius)) {
				newPosition = undefined;
				continue;
			}
			if (this._playerManager.players.find(p => p.didCircleCollided(newPosition as point, radius))) {
				newPosition = undefined;
				continue;
			}
			if (this._barricadeManager.barricades.find(p => p.didCircleCollided(newPosition as point, radius))) {
				newPosition = undefined;
				continue;
			}
		}

		return newPosition;
	}


	/**获取玩家的初始化协议 */
	getInitPROT(currPlayerId: number) {
		let players = this._playerManager.players;

		return new toClientPROT.initialize(currPlayerId,
			players.map(p => p.getPlayerBasicPROT()),
			this._edge.getEdgePROT(),
			this._barricadeManager.barricades.map(p => p.getBarricadePROT()),
			this._propManager.propHps.map(p => p.getPropHpPROT()),
			this._propManager.propWeapons.map(p => p.getPropGunPROT())
		);
	}

	removePlayer(playerId: number) {
		this._playerManager.removePlayerById(playerId);
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
			if (this._barricadeManager.barricades.find(p => p.didCircleCollided(newPoisition as point, config.player.radius))) {
				newPoisition = undefined;
				continue;
			}
		}

		let newPlayer = this._playerManager.addNewPlayer(name.slice(0, 20), newPoisition);
		return newPlayer.id;
	}

	startRunning(playerId: number, active: boolean) {
		let player = this._playerManager.findPlayerById(playerId);
		if (player) {
			player.isRunning = active;
			if (!active)
				this._runningCache.set(player, 1);
		}
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

	}

	startShooting(playerId: number, active: boolean) {
		let player = this._playerManager.findPlayerById(playerId);
		if (player) {
			player.startShooting(active, () => {
				if (player)
					this._playerAttack(player, player.getGun());
			});
		}
	}

	startCombat(playerId: number, active: boolean) {
		let player = this._playerManager.findPlayerById(playerId);
		if (player) {
			player.startCombat(active, () => {
				if (player)
					this._playerAttack(player, player.getMelee());
			});
		}
	}

	private _playerAttacked(attacktedPlayer: player, attackPlayer: player, weapon: weapon) {
		attackPlayer.records.attackInAimTimes++;
		attacktedPlayer.records.attactedTimes++;

		let hp = attacktedPlayer.getHp();
		if (hp - 1 == 0) {
			attackPlayer.records.killTimes++;
			this.emit(gameCore.events.gameOver, attacktedPlayer.id,
				new toClientPROT.gameOver(attacktedPlayer.records));
			this._playerManager.removePlayer(attacktedPlayer);

			if (attacktedPlayer.getGun().getBullet() > 0) {
				this._propManager.addPropWeapon(attacktedPlayer.position, attacktedPlayer.getGun());
			}
		} else {
			attacktedPlayer.setHp(hp - 1);
		}
	}

	private _playerAttack(player: player, weapon: weapon) {
		player.records.attackTimes++;

		let position = player.position;
		let angle = player.getDirectionAngle();

		this._attackCaches.push({
			id: ++this._attackCacheId,
			weapon: weapon,
			bulletPosition: new point(position.x + config.player.radius * Math.cos(angle),
				position.y + config.player.radius * Math.sin(angle)),
			attackPosition: point.getNewInstance(position),
			attackPlayer: player,
			angle: angle,
			sightTimeCount: weapon.attackSightTimeOut,
			isEnd: false
		});
	}
}