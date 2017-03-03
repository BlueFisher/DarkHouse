import * as events from 'events';

import * as serverConfig from '../../config';
import * as config from '../shared/game_config';
import * as utils from '../shared/utils';
import * as fromClientPROT from '../shared/ws_prot_from_client';
import * as toClientPROT from '../shared/ws_prot_to_client';

import { player, playerManager } from './resources/player';
import { edge, barricade, barricadeManager } from './resources/barricade';
import { visableArea, visableAreaManager } from './resources/visable_area';
import { propManager } from './resources/prop';
import { weapon, gun, melee } from './resources/weapon';

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
	private _visableAreaManager: visableAreaManager;
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

	constructor(width: number, height: number, edgeX = 0, edgeY = 0, ) {
		super();

		this._playerManager = new playerManager();
		this._propManager = new propManager(this._generateEmptyPosition.bind(this));

		this._edge = new edge(new point(edgeX, edgeY), new point(edgeX + width, edgeY + height));
		this._barricadeManager = new barricadeManager();
		this._visableAreaManager = new visableAreaManager();

		this._initializeMainLoop();
	}

	private _initializeMainLoop() {
		/**生成攻击协议 */
		let generateAttackPROTs: () => [toClientPROT.attackPROT[] | undefined,
			toClientPROT.duringAttackPROT[] | undefined
		] = () => {
			let attackPROTs: toClientPROT.attackPROT[] | undefined = [];
			let duringAttackPROTs: toClientPROT.duringAttackPROT[] | undefined = [];

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

			if (attackPROTs.length == 0)
				attackPROTs = undefined;
			if (duringAttackPROTs.length == 0)
				duringAttackPROTs = undefined;

			return [attackPROTs, duringAttackPROTs];
		}

		/**生成奔跑协议 */
		let generateRunningPROTs = (players: player[]) => {
			let runningPROTs: toClientPROT.runningPROT[] = [];
			for (let player of players) {
				if (player.isRunningSightActive()) {
					runningPROTs.push({
						playerId: player.id,
						playerIdsInSight: this._playerManager
							.getPlayersInRadius(player.position, config.player.runningSightRadius)
							.map(p => p.id)
					});
				}
			}
			return runningPROTs.length > 0 ? runningPROTs : undefined;
		}

		// 主计时器循环
		setInterval(() => {
			let players = this._playerManager.players;
			let playerPROTs = players.map(p => p.getPlayerPROT());

			let sendingMap = new Map<number, toClientPROT.mainPROT>();

			let newPlayersBasicPROTs = this._playerManager.getAndClearNewPlayersBasicPROTs();
			let playersInSightMap = this._playerManager.generatePlayersInSightMap(players,
				this._barricadeManager);

			let visableAreaPROTs = this._visableAreaManager.getAllVisableAreaPROTs(this._playerManager.players);

			let [attackPROTs, duringAttackPROTs] = generateAttackPROTs();
			let runningPROTs = generateRunningPROTs(players);
			let [newPropsPROTs, removedPropIds] = this._propManager.getAndClearNewAndRemovedPropPROTs();

			let rankListPROT = this._playerManager.getRankListPROT();

			for (let player of players) {
				let mainPROT = new toClientPROT.mainPROT();

				let filteredNewPlayersBasicPROTs = newPlayersBasicPROTs.filter(p => p.id != player.id);
				if (filteredNewPlayersBasicPROTs.length > 0)
					mainPROT.newPlayerBPROTs = filteredNewPlayersBasicPROTs;

				let playersInSight = playersInSightMap.get(player);
				if (playersInSight && playersInSight.length > 0)
					mainPROT.playerIdsInSight = playersInSight.map(p => p.id);

				mainPROT.visableAreas = visableAreaPROTs;
				mainPROT.attackPROTs = attackPROTs;
				mainPROT.duringAttackPROTs = duringAttackPROTs;
				mainPROT.runningPROTs = runningPROTs;

				mainPROT.newPropPROTs = newPropsPROTs;
				mainPROT.removedPropIds = removedPropIds;

				mainPROT.rankList = rankListPROT;

				mainPROT.formatPlayerPROT(player.id, playerPROTs);
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

					if (gun.damageRanges[0].radius == 0) {
						if (firstAttackedPlayer) {
							attackedPlayerDamages.push({
								player: firstAttackedPlayer,
								damage: gun.damageRanges[0].damage
							});
						}
					} else {
						for (let player of this._playerManager.players) {
							let distance = utils.getTwoPointsDistance(minAttackPosition, player.position) - config.player.radius;
							if (distance > gun.damageRanges[gun.damageRanges.length - 1].radius) {
								continue;
							}
							if (this._barricadeManager.didPlayerBlocked(minAttackPosition, player)) {
								continue;
							}

							for (let damageRange of gun.damageRanges) {
								if (damageRange.radius != 0 && distance <= damageRange.radius) {
									attackedPlayerDamages.push({
										player: player,
										damage: damageRange.damage
									});
									break;
								}
							}
						}
					}
				} else if (cache.weapon instanceof melee) {
					if (firstAttackedPlayer) {
						attackedPlayerDamages.push({
							player: firstAttackedPlayer,
							damage: cache.weapon.damage
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

		let curRectangles = this._barricadeManager.barricades.map(p => {
			let res: [point, point] = [p.vertex1, p.vertex2];
			return res;
		});
		curRectangles = curRectangles.concat(this._playerManager.players.map(p => {
			let res: [point, point] = [
				new point(p.position.x - config.player.radius,
					p.position.y - config.player.radius),
				new point(p.position.x + config.player.radius,
					p.position.y + config.player.radius)
			];
			return res;
		}));

		let emptyAreas = utils.cutRectangle([this._edge.vertex1, this._edge.vertex2],
			this._barricadeManager.barricades.map(p => {
				let res: [point, point] = [p.vertex1, p.vertex2];
				return res;
			})
		);

		emptyAreas = emptyAreas.filter(p => {
			return p[1].x - p[0].x >= 2 * radius && p[1].y - p[0].y >= 2 * radius;
		});

		if (emptyAreas.length == 0) {
			return null;
		}

		let tmpArea = emptyAreas[Math.floor(Math.random() * emptyAreas.length)];

		let x = Math.random() * (tmpArea[1].x - tmpArea[0].x - 2 * radius) + tmpArea[0].x + radius,
			y = Math.random() * (tmpArea[1].y - tmpArea[0].y - 2 * radius) + tmpArea[0].y + radius;

		return new point(x, y);
	}


	/**获取玩家的初始化协议 */
	getInitPROT(currPlayerId: number) {
		return new toClientPROT.initialize(currPlayerId,
			this._playerManager.getAllPlayerPROTs(),
			this._edge.getEdgePROT(),
			this._barricadeManager.getAllBarricadePROTs(),
			this._visableAreaManager.getAllVisableAreaBasicPROTs(),
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
					setImmediate(() => {
						timer();
					});
				}
			}
			timer();
		});
	}

	startRunning(playerId: number, active: boolean) {
		let player = this._playerManager.findPlayerById(playerId);
		if (player) {
			player.startRunning(active, true);
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
		if (hp - damage <= 0) {
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