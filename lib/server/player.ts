import * as utils from '../shared/utils';
import * as config from '../shared/game_config';
import * as toClientPROT from '../shared/ws_prot_to_client';

const point = utils.point;
type point = utils.point;

let id = 0;

export class player {
	readonly id = ++id;
	readonly name: string;
	private _position: point;
	private _angle = 0;
	private _hp = config.player.maxHp;

	canMove = true;
	isRunning = false;
	connected = true;

	constructor(name: string, position: point) {
		this.name = name;
		this._position = position;
	}

	setPosition(position: point) {
		this._position = position;
	}
	getPosition() {
		return this._position;
	}

	setDirectionAngle(angle: number) {
		angle = angle % (Math.PI * 2);
		this._angle = angle;
	}
	getDirectionAngle() {
		return this._angle;
	}

	setHp(hp: number) {
		console.log(hp);
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
				x: parseFloat(this._position.x.toFixed(2)),
				y: parseFloat(this._position.y.toFixed(2))
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
		if (utils.didTwoCirclesCollied(this._position, config.player.radius, newPlayerPos, config.player.radius)) {
			let pos = this._position;
			let d = utils.getTwoPointsDistance(pos, newPlayerPos);
			let x = pos.x + 2 * config.player.radius * (newPlayerPos.x - pos.x) / d;
			let y = pos.y + 2 * config.player.radius * (newPlayerPos.y - pos.y) / d;
			newPlayerPos.x = x;
			newPlayerPos.y = y;
		}
	}

	didPlayerCollided(playerPos: point) {
		return utils.didTwoCirclesCollied(this._position, config.player.radius, playerPos, config.player.radius);
	}
	getRayCollidedPoint(point: point, angle: number) {
		return utils.getRayCircleCollidedPoint(point, angle, this._position, config.player.radius);
	}
}