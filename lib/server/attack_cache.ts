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

let id = 0;

export class attackCache {
	id = ++id;
	weapon: weapon;
	attackPosition: point;
	attackPlayer: player;
	angle: number;
	bulletPosition: point;
	collisionPoint?: point;
	attacktedPlayers: player[] = [];
	killedPlayers: player[] = [];
	sightTimeCount: number;
	isEnd: boolean = false;

	constructor(weapon: weapon, attackPlayer: player) {
		let angle = attackPlayer.getDirectionAngle();

		this.weapon = weapon,
			this.attackPosition = point.getNewInstance(attackPlayer.position);
		this.attackPlayer = attackPlayer;
		this.angle = angle;
		this.bulletPosition = new point(attackPlayer.position.x + config.player.radius * Math.cos(angle),
			attackPlayer.position.y + config.player.radius * Math.sin(angle));
		this.sightTimeCount = weapon.attackSightTimeOut;
	}
}

export class attackCacheManager {
	private _attackCaches: attackCache[] = [];

	addAttackCache(weapon: weapon, attackPlayer: player) {
		this._attackCaches.push(new attackCache(weapon, attackPlayer));
	}

	generateAttackPROTs(playerManager: playerManager): [toClientPROT.attackPROT[] | undefined, toClientPROT.duringAttackPROT[] | undefined] {
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
					playerIdsInAttackSight = playerManager.getPlayersInRadius(cache.attackPosition, attackSightRadius)
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

	handleAttackCache(edge: edge, barricadeManager: barricadeManager, playerManager: playerManager,
		playerAttacked: (attacktedPlayer: player, attackPlayer: player, damage: number) => void) {
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

			let collidedPlayers = playerManager.players.map(p => {
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

			let collidedBarricadePoints = barricadeManager.barricades.map(b => {
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
				let collidedEdgePoint = edge.getLineCollidedPoint(oldPos, newPos);
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
						for (let player of playerManager.players) {
							let distance = utils.getTwoPointsDistance(minAttackPosition, player.position) - config.player.radius;
							if (distance > gun.damageRanges[gun.damageRanges.length - 1].radius) {
								continue;
							}
							if (barricadeManager.didPlayerBlocked(minAttackPosition, player)) {
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
					playerAttacked(p.player, cache.attackPlayer, p.damage);
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
}