import * as events from 'events';

import { player, playerManager } from './player';
import { edge, barricade, barricadeManager } from './barricade';
import { propManager, propHp, propWeapon } from './prop';
import * as gameServer from './game_server';
import { weapon, gun, melee } from './weapon';

import * as config from '../shared/game_config';
import * as serverConfig from '../../config';
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
		attacktedPlayers: player[],
		killedPlayers: player[],
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

			for (let cache of this._attackCaches) {
				// 如果还处在视野时间中、枪没有装备上消音器则获取视野中的玩家
				let playerIdsInAttackSight: number[] = [];
				let attackSightRadius = cache.weapon.attackSightRadius;
				if (cache.weapon instanceof gun && cache.weapon.isEquippedSilencer) {
					attackSightRadius = 0;
				} else {
					if (cache.sightTimeCount > 0) {
						playerIdsInAttackSight = this._playerManager
							.getPlayersInRadius(cache.attackPosition, attackSightRadius)
							.map(p => p.id);
					}
				}

				// 如果是初次加入到射击缓存中
				if (cache.sightTimeCount == cache.weapon.attackSightTimeOut) {
					attackPROTs.push({
						id: cache.id,
						attackType: cache.weapon.attackType,
						weaponType: cache.weapon.weaponType,
						position: cache.attackPosition,
						angle: cache.angle,
						playerIdsInSight: playerIdsInAttackSight,
						attackPlayerId: cache.attackPlayer.id,
						bulletPosition: cache.bulletPosition,
						sightRadius: attackSightRadius
					});
					cache.sightTimeCount--;
				} else {
					let duringAttackPROT: toClientPROT.duringAttackPROT = {
						id: cache.id,
						bulletPosition: cache.bulletPosition,
						playerIdsInSight: [],
						attackedPlayerIds: cache.attacktedPlayers.map(p => p.id),
						killedPlayerIds: cache.killedPlayers.map(p => p.id),
						isSightEnd: false,
						isEnd: cache.isEnd
					};

					if (cache.sightTimeCount <= 0) {
						duringAttackPROT.isSightEnd = true;
					} else {
						duringAttackPROT.playerIdsInSight = playerIdsInAttackSight;
					}

					duringAttackPROTs.push(duringAttackPROT);
				}
			}
			return [attackPROTs, duringAttackPROTs];
		}

		let runningSightRemainsStep = config.player.runningSightRemainsTime / serverConfig.mainInterval,
			runningSightDisapperStep = runningSightRemainsStep + config.player.runningSightDisapperTime / serverConfig.mainInterval;
		/**生成奔跑协议 */
		let generateRunningPROTs = (players: player[]) => {
			let runningPROTs: toClientPROT.runningPROT[] = [];
			for (let runningPlayer of players.filter(p => p.canMove && p.isRunning)) {
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
			let players = this._playerManager.players;
			let sendingMap = new Map<number, toClientPROT.mainPROT>();
			let newPlayersBasicPROTs = this._playerManager.generateNewPlayersBasicPROTs();
			let [attackPROTs, duringAttackPROTs] = generateAttackPROTs();
			let runningPROTs = generateRunningPROTs(players);
			let propPROTs = this._propManager.getAndClearPropPROTs();
			let playersInSightMap = this._playerManager.generatePlayersInSightMap(players,
				this._barricadeManager);


			for (let player of players) {
				let playersInSight = playersInSightMap.get(player);
				playersInSight = playersInSight ? playersInSight : [];

				let mainPROT = new toClientPROT.mainPROT();

				mainPROT.playerIdsInSight = playersInSight.map(p => p.id);
				mainPROT.attackPROTs = attackPROTs;
				mainPROT.duringAttackPROTs = duringAttackPROTs;
				mainPROT.runningPROTs = runningPROTs;
				mainPROT.newPlayerBPROTs = newPlayersBasicPROTs.filter(p => p.id != player.id);

				mainPROT.newPropPROTs = propPROTs.newPropsCache;
				mainPROT.removedPropIds = propPROTs.removedPropIdsCache;

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

			this._handleAttackCache();
			this._handlePlayersMoving();

		}, serverConfig.mainInterval);
	}

	/**处理用户的攻击 */
	private _handleAttackCache() {
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
			let minAttackPosition: point | null = null;
			let firstAttackedPlayer: player | null = null;

			for (let collidedPlayer of collidedPlayers) {
				if (!collidedPlayer)
					continue;
				let d = utils.getTwoPointsDistance(collidedPlayer.point, cache.attackPosition);
				if (d < minDistance) {
					minDistance = d;
					minAttackPosition = collidedPlayer.point;
					firstAttackedPlayer = collidedPlayer.player;
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
						minAttackPosition = barricadePoint;
						firstAttackedPlayer = null;
					}
				}
			}

			if (!minAttackPosition) {
				let collidedEdgePoint = this._edge.getLineCollidedPoint(oldPos, newPos);
				if (collidedEdgePoint) {
					minAttackPosition = collidedEdgePoint;
				}
			}

			if (minAttackPosition) {
				let attackedPlayerDamages: {
					player: player,
					damage: number
				}[] = [];

				if (cache.weapon instanceof gun) {
					let gun = cache.weapon;

					for (let player of this._playerManager.players) {
						let distance = utils.getTwoPointsDistance(minAttackPosition, player.position) - config.player.radius;
						if (distance > gun.damageRanges[gun.damageRanges.length - 1].radius) {
							continue;
						}
						if (this._barricadeManager.didPlayerBlocked(minAttackPosition, player)) {
							continue;
						}

						for (let damageRange of gun.damageRanges) {
							if (distance <= damageRange.radius) {
								console.log(distance, damageRange)
								attackedPlayerDamages.push({
									player: player,
									damage: damageRange.damage
								});
								break;
							}
						}
					}
				} else {
					if (firstAttackedPlayer) {
						attackedPlayerDamages.push({
							player: firstAttackedPlayer,
							damage: 1
						});
					}
				}

				attackedPlayerDamages.forEach(p => {
					cache.attacktedPlayers.push(p.player);
					this._playerAttacked(p.player, cache.attackPlayer, p.damage);
					if (p.player.getHp() <= 0)
						cache.killedPlayers.push(p.player);
				});

				cache.bulletPosition = cache.collisionPoint = minAttackPosition;
				cache.isEnd = true;
			} else {
				cache.bulletPosition = newPos;
				if (cache.weapon instanceof melee) {
					cache.isEnd = true;
				}
			}
		}
	}

	/**处理所有用户的移动 */
	private _handlePlayersMoving() {
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

	private _generateEmptyPosition(radius: number) {
		let newPosition: point | undefined;

		let emptyAreas = utils.cutRectangle([this._edge.vertex1, this._edge.vertex2],
			this._barricadeManager.barricades.map(p => {
				let res: [point, point] = [p.vertex1, p.vertex2];
				return res;
			})
		);

		emptyAreas = emptyAreas.filter(p => {
			return p[1].x - p[0].x >= radius && p[1].y - p[0].y >= radius;
		});

		if (emptyAreas.length == 0) {
			return null;
		}

		let tmpArea = emptyAreas[Math.floor(Math.random() * emptyAreas.length)];

		return new point((tmpArea[0].x + tmpArea[1].x) / 2, (tmpArea[0].y + tmpArea[1].y) / 2);
	}


	/**获取玩家的初始化协议 */
	getInitPROT(currPlayerId: number) {
		return new toClientPROT.initialize(currPlayerId,
			this._playerManager.players.map(p => p.getPlayerBasicPROT()),
			this._edge.getEdgePROT(),
			this._barricadeManager.barricades.map(p => p.getBarricadePROT()),
			this._propManager.getAllPropPROTs()
		);
	}

	removePlayer(playerId: number) {
		this._playerManager.removePlayerById(playerId);
	}

	/**添加新玩家 */
	addNewPlayer(name: string) {
		return new Promise<number>((resolve, reject) => {
			let timer = () => {
				let newPoisition = this._generateEmptyPosition(config.player.radius);

				if (newPoisition) {
					let newPlayer = this._playerManager.addNewPlayer(name.slice(0, 20), newPoisition);
					resolve(newPlayer.id);
				} else {
					setTimeout(() => {
						timer();
					}, 1000);
				}
			}
			timer();
		});
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

	useProp(playerId: number) {
		let player = this._playerManager.findPlayerById(playerId);
		if (player) {
			this._propManager.tryUseProp(player, player.position);
		}
	}

	private _playerAttacked(attacktedPlayer: player, attackPlayer: player, damage: number) {
		attackPlayer.records.attackInAimTimes++;
		attacktedPlayer.records.attactedTimes++;

		let hp = attacktedPlayer.getHp();
		if (hp - damage == 0) {
			attackPlayer.records.killTimes++;
			this.emit(gameCore.events.gameOver, attacktedPlayer.id,
				new toClientPROT.gameOver(attacktedPlayer.records));
			this._playerManager.removePlayer(attacktedPlayer);

			if (attacktedPlayer.getGun().getBullet() > 0) {
				this._propManager.addPropWeapon(attacktedPlayer.position, attacktedPlayer.getGun());
			}
		}

		attacktedPlayer.setHp(hp - damage);
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
			attacktedPlayers: [],
			killedPlayers: [],
			sightTimeCount: weapon.attackSightTimeOut,
			isEnd: false
		});
	}
}