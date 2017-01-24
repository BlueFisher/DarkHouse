import * as events from 'events';

import { player, playerManager } from './player';
import { barricade } from './barricade';
import { propHp } from './prop_hp';
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
	private _propHps: propHp[] = [];
	private _newPlayersCache: player[] = [];
	private _shootingCache: {
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

		this._playerManager = new playerManager;

		this._barricades.push(new barricade(new point(0, 0), new point(500, 10)));
		this._barricades.push(new barricade(new point(0, 0), new point(10, 500)));
		this._barricades.push(new barricade(new point(0, 490), new point(500, 500)));
		this._barricades.push(new barricade(new point(490, 0), new point(500, 500)));

		this._initializeMainLoop();
	}

	private _initializeMainLoop() {
		// 生成新加入玩家的基础协议
		let generateNewPlayersBasicPROTs = () => {
			let newPlayersBasicPROTs = this._newPlayersCache.map(p => p.getPlayerBasicPROT());
			this._newPlayersCache = [];
			return newPlayersBasicPROTs;
		}

		// 生成射击协议
		let generateShootPROTs = () => {
			let shootPROTs: toClientPROT.shootPROT[] = [];
			for (let i = this._shootingCache.length - 1; i >= 0; i--) {
				let shootedPlayerId: number | undefined;
				if (this._shootingCache[i].shootedPlayer) {
					shootedPlayerId = (this._shootingCache[i].shootedPlayer as player).id;
				}

				shootPROTs.push({
					position: this._shootingCache[i].shootingPosition,
					angle: this._shootingCache[i].angle,
					playerIdsInSight: this._playerManager.getPlayersInRadius(this._shootingCache[i].shootingPosition, config.player.shootingSightRadius)
						.map(p => p.id),
					collisionPoint: this._shootingCache[i].collisionPoint,
					shootedPlayerId: shootedPlayerId
				});
				if (++this._shootingCache[i].timeCount > 2) {
					this._shootingCache.splice(i, 1);
				}
			}
			return shootPROTs;
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
						position: runningPlayer.getPosition(),
						playerIdsInSight: this._playerManager.getPlayersInRadius(runningPlayer.getPosition(), config.player.runningSightRadius)
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
			let shootPROTs = generateShootPROTs();
			let connectedPlayers = this._playerManager.getPlayers().filter(p => p.connected);
			let runningPROTs = generateRunningPROTs(connectedPlayers);

			for (let player of connectedPlayers) {
				let mainPROT = new toClientPROT.mainPROT(player.id,
					this._playerManager.getPlayersInPlayerSight(player, config.player.sightRadius).map(p => p.id));
				mainPROT.shootPROTs = shootPROTs;
				mainPROT.runningPROTs = runningPROTs;
				mainPROT.newPlayerBPROTs = newPlayersBasicPROTs.filter(p => p.id != player.id);
				mainPROT.propHpPROTs = this._propHps.map(p => p.getPropHpPROT());

				mainPROT.formatPlayerPROT((playerId) => {
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
			if (this._propHps.length < config.hp.maxNumber)
				this._addNewPropHp();
		}, config.hp.appearInterval);

		// 玩家移动计时器循环
		setInterval(() => {
			for (let player of this._playerManager.getPlayers().filter(p => p.connected)) {
				this._playerMove(player);
			}
		}, config.player.movingInterval);
	}

	private _addNewPropHp() {
		let newPosition: point | undefined;
		while (!newPosition) {
			newPosition = new point(Math.random() * config.stage.width, Math.random() * config.stage.height);
			if (this._playerManager.getPlayers().find(p => p.didPlayerCollided(newPosition as point))) {
				newPosition = undefined;
				continue;
			}
			if (this._barricades.find(p => p.didPlayerCollided(newPosition as point))) {
				newPosition = undefined;
				continue;
			}
		}
		this._propHps.push(new propHp(newPosition));
	}

	addNewPlayer(name: string): [number, toClientPROT.initialize] {
		let newPoisition: point | undefined;
		while (!newPoisition) {
			newPoisition = new point(Math.random() * config.stage.width, Math.random() * config.stage.height);
			if (this._playerManager.getPlayers().find(p => p.didPlayerCollided(newPoisition as point))) {
				newPoisition = undefined;
				continue;
			}
			if (this._barricades.find(p => p.didPlayerCollided(newPoisition as point))) {
				newPoisition = undefined;
				continue;
			}
		}

		let oldPlayers = this._playerManager.getPlayers();
		let newPlayer = this._playerManager.addNewPlayer(name, newPoisition);

		let initPROT = new toClientPROT.initialize(
			newPlayer.getPlayerBasicPROT(),
			oldPlayers.map(p => p.getPlayerBasicPROT()),
			this._barricades.map(p => p.getBarricadePROT()),
			this._propHps.map(p => p.getPropHpPROT())
		);
		this._newPlayersCache.push(newPlayer);

		return [newPlayer.id, initPROT];
	}

	playerDisconnected(playerId: number) {
		this._playerManager.playerDisconnected(playerId);
	}

	startRunning(playerId: number, active: boolean) {
		this._playerManager.startRunning(playerId, active);
	}

	stopMoving(playerId: number, active: boolean) {
		this._playerManager.stopMoving(playerId, active);
	}

	rotate(playerId: number, angle: number) {
		this._playerManager.rotate(playerId, angle);
	}

	private _playerMove(player: player) {
		if (!player.canMove) {
			return;
		}
		let angle = player.getDirectionAngle();
		let oldPos: point = player.getPosition();
		let step = player.isRunning ? config.player.runingStep : config.player.movingStep;
		let x = oldPos.x + Math.cos(angle) * step;
		let y = oldPos.y + Math.sin(angle) * step;
		let newPos = new point(x, y);

		this._barricades.forEach(p => {
			p.adjustPlayerCollided(oldPos, newPos);
		});

		this._playerManager.getPlayers().forEach(p => {
			if (p == player)
				return;

			p.adjustPlayerCollided(newPos);
		});


		for (let i = this._propHps.length - 1; i >= 0; i--) {
			let propHp = this._propHps[i];
			if (utils.didTwoCirclesCollied(propHp.position, config.hp.activeRadius, newPos, config.player.radius)) {
				player.setHp(player.getHp() + 1);
				this._propHps.splice(i, 1);
			}
		}

		player.setPosition(newPos);
	}

	shoot(playerId: number) {
		let player = this._playerManager.findPlayerById(playerId);
		if (player) {
			let position = player.getPosition();
			let angle = player.getDirectionAngle();

			let playersInRay = this._playerManager.getPlayers().map(p => {
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
				let hp = firstshootedPlayer.getHp();
				if (hp - 1 == 0) {
					this.emit(gameCore.events.gameOver, firstshootedPlayer.id, new toClientPROT.gameOver());
					this._playerManager.removePlayer(firstshootedPlayer);
				} else {
					firstshootedPlayer.setHp(hp - 1);
				}
			}

			this._shootingCache.push({
				shootingPosition: player.getPosition(),
				shootingPlayer: player,
				angle: angle,
				collisionPoint: minPoint,
				shootedPlayer: firstshootedPlayer,
				timeCount: 0
			});
		}
	}
}