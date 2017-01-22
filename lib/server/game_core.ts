import * as events from 'events';

import { player } from './player';
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

	private _players: player[] = [];
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

		this._barricades.push(new barricade(new point(0, 0), new point(500, 10)));
		this._barricades.push(new barricade(new point(0, 0), new point(10, 500)));
		this._barricades.push(new barricade(new point(0, 490), new point(500, 500)));
		this._barricades.push(new barricade(new point(490, 0), new point(500, 500)));

		this._initializeMainLoop();
	}

	private _initializeMainLoop() {
		setInterval(() => {
			let sendingMap = new Map<number, toClientPROT.mainPROT>();

			let newPlayersBasicPROTs = this._newPlayersCache.map(p => p.getPlayerBasicPROT());
			this._newPlayersCache = [];

			let shootPROTs: toClientPROT.shootPROT[] = [];

			for (let i = this._shootingCache.length - 1; i >= 0; i--) {
				let shootedPlayerId: number | undefined;
				if (this._shootingCache[i].shootedPlayer) {
					shootedPlayerId = (this._shootingCache[i].shootedPlayer as player).id;
				}

				shootPROTs.push({
					position: this._shootingCache[i].shootingPosition,
					angle: this._shootingCache[i].angle,
					playerIdsInSight: this._getPlayersInRadius(this._shootingCache[i].shootingPosition, config.player.shootingSightRadius)
						.map(p => p.id),
					collisionPoint: this._shootingCache[i].collisionPoint,
					shootedPlayerId: shootedPlayerId
				});
				if (++this._shootingCache[i].timeCount > 2) {
					this._shootingCache.splice(i, 1);
				}
			}

			let connectedPlayers = this._players.filter(p => p.connected);

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
						playerIdsInSight: this._getPlayersInRadius(runningPlayer.getPosition(), config.player.runningSightRadius)
							.map(p => p.id)
					});
				}

				if (runningCache == 10) {
					this._runningCache.set(runningPlayer, 1);
				} else {
					this._runningCache.set(runningPlayer, runningCache + 1);
				}
			}

			for (let player of connectedPlayers) {
				this._playerMove(player);

				let mainPROT = new toClientPROT.mainPROT(player.id,
					this._getPlayersInPlayerSight(player, config.player.sightRadius).map(p => p.id));
				mainPROT.shootPROTs = shootPROTs;
				mainPROT.runningPROTs = runningPROTs;
				mainPROT.newPlayerBPROTs = newPlayersBasicPROTs.filter(p => p.id != player.id);
				mainPROT.propHpPROTs = this._propHps.map(p => p.getPropHpPROT());

				mainPROT.formatPlayerPROT((playerId) => {
					let player = this._players.find(p => p.id == playerId);
					if (player)
						return player.getPlayerPROT();
					else
						return null;
				});

				sendingMap.set(player.id, mainPROT);
			}
			this.emit(gameCore.events.sendToPlayers, sendingMap);
		}, 1000 / serverConfig.tickrate);

		setInterval(() => {
			if (this._propHps.length < config.hp.maxNumber)
				this._addNewPropHp();
		}, config.hp.appearInterval)
	}

	private _getPlayersInPlayerSight(player: player, radius: number) {
		return this._players.filter(p => {
			if (p != player) {
				return utils.didTwoCirclesCollied(p.getPosition(), radius, player.getPosition(), config.player.radius);
			}
			return false;
		});
	}
	private _getPlayersInRadius(position: point, radius: number) {
		return this._players.filter(p => {
			return utils.didTwoCirclesCollied(p.getPosition(), radius, position, config.player.radius);
		});
	}

	private _addNewPropHp() {
		let newPoint: point | undefined;
		while (!newPoint) {
			newPoint = new point(Math.random() * config.stage.width, Math.random() * config.stage.height);
			if (this._players.find(p => p.didPlayerCollided(newPoint as point))) {
				newPoint = undefined;
				continue;
			}
			if (this._barricades.find(p => p.didPlayerCollided(newPoint as point))) {
				newPoint = undefined;
				continue;
			}
		}
		this._propHps.push(new propHp(newPoint));
	}

	addNewPlayer(name: string): [number, toClientPROT.initialize] {
		let newPoint: point | undefined;
		while (!newPoint) {
			newPoint = new point(Math.random() * config.stage.width, Math.random() * config.stage.height);
			if (this._players.find(p => p.didPlayerCollided(newPoint as point))) {
				newPoint = undefined;
				continue;
			}
			if (this._barricades.find(p => p.didPlayerCollided(newPoint as point))) {
				newPoint = undefined;
				continue;
			}
		}

		let newPlayer = new player(name, newPoint);
		let initPROT = new toClientPROT.initialize(
			newPlayer.getPlayerBasicPROT(),
			this._players.map(p => p.getPlayerBasicPROT()),
			this._barricades.map(p => p.getBarricadePROT()),
			this._propHps.map(p => p.getPropHpPROT())
		);

		this._players.push(newPlayer);
		this._newPlayersCache.push(newPlayer);

		return [newPlayer.id, initPROT];
	}

	playerDisconnected(playerId: number) {
		let player = this._players.find(p => p.id == playerId);
		if (player) {
			player.connected = false;
		}
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

		this._players.forEach(p => {
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

	startRunning(playerId: number, active: boolean) {
		let player = this._players.find(p => p.id == playerId);
		if (player) {
			player.isRunning = active;
		}
	}

	stopMoving(playerId: number, active: boolean) {
		let player = this._players.find(p => p.id == playerId);
		if (player) {
			player.canMove = !active;
		}
	}

	rotate(playerId: number, angle: number) {
		let player = this._players.find(p => p.id == playerId);
		if (player) {
			player.setDirectionAngle(angle);
		}
	}

	shoot(playerId: number) {
		let player = this._players.find(p => p.id == playerId);
		if (player) {
			let position = player.getPosition();
			let angle = player.getDirectionAngle();

			let playersInRay = this._players.map(p => {
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

			for (let b of collidedBarricadePoints) {
				if (b) {
					let d = Math.sqrt((b.x - position.x) ** 2
						+ (b.y - position.y) ** 2);
					if (d < minDistance) {
						minDistance = d;
						minPoint = b;
						firstshootedPlayer = undefined;
					}
				}
			}

			if (firstshootedPlayer) {
				let hp = firstshootedPlayer.getHp();
				if (hp - 1 == 0) {
					this.emit(gameCore.events.gameOver, firstshootedPlayer.id, new toClientPROT.gameOver());
					let i = this._players.findIndex(p => p == firstshootedPlayer);
					if (i != -1) {
						this._players.splice(i, 1);
					}
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