import * as utils from '../shared/utils';
import * as config from '../shared/game_config';
import * as toClientPROT from '../shared/ws_prot_to_client';

const point = utils.point;
type point = utils.point;

let id = 0;

export class player {
	readonly id = ++id;
	readonly name: string;
	private _angle = 0;
	private _hp = config.player.maxHp;

	position: point;
	records: toClientPROT.records = {
		shootingTimes: 0,
		shootingInAimTimes: 0,
		shootedTimes: 0,
		killTimes: 0
	};
	canMove = true;
	isRunning = false;
	connected = true;

	constructor(name: string, position: point) {
		this.name = name;
		this.position = position;
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

	getPlayerPROT(): toClientPROT.playerPROT {
		return {
			id: this.id,
			position: {
				x: parseFloat(this.position.x.toFixed(2)),
				y: parseFloat(this.position.y.toFixed(2))
			},
			angle: this._angle,
			hp: this._hp
		}
	}
	getPlayerBasicPROT(): toClientPROT.playerBasicPROT {
		return {
			id: this.id,
			name: this.name
		}
	}

	adjustPlayerCollided(newPlayerPos: point) {
		if (utils.didTwoCirclesCollied(this.position, config.player.radius, newPlayerPos, config.player.radius)) {
			let pos = this.position;
			let d = utils.getTwoPointsDistance(pos, newPlayerPos);
			let x = pos.x + 2 * config.player.radius * (newPlayerPos.x - pos.x) / d;
			let y = pos.y + 2 * config.player.radius * (newPlayerPos.y - pos.y) / d;
			newPlayerPos.x = x;
			newPlayerPos.y = y;
		}
	}

	didPlayerCollided(playerPos: point) {
		return utils.didTwoCirclesCollied(this.position, config.player.radius, playerPos, config.player.radius);
	}
	getRayCollidedPoint(point: point, angle: number) {
		return utils.getRayCircleCollidedPoint(point, angle, this.position, config.player.radius);
	}
}

export class playerManager {
	private _players: player[] = [];
	private _newPlayersCache: player[] = [];

	getPlayers() {
		return this._players;
	}

	findPlayerById(id: number) {
		return this._players.find(p => p.id == id);
	}

	addNewPlayer(name: string, position: point) {
		let newPlayer = new player(name, position);
		this._players.push(newPlayer);
		this._newPlayersCache.push(newPlayer);
		return newPlayer;
	}
	removePlayer(player: player) {
		let i = this._players.findIndex(p => p == player);
		if (i != -1) {
			this._players.splice(i, 1);
		}
	}

	getAndClearNewPlayersCache() {
		let res = this._newPlayersCache;
		this._newPlayersCache = [];
		return res;
	}

	getPlayersInPlayerSight(player: player, radius: number) {
		return this._players.filter(p => {
			if (p != player) {
				return utils.didTwoCirclesCollied(p.position, radius, player.position, config.player.radius);
			}
			return false;
		});
	}
	getPlayersInRadius(position: point, radius: number) {
		return this._players.filter(p => {
			return utils.didTwoCirclesCollied(p.position, radius, position, config.player.radius);
		});
	}
}