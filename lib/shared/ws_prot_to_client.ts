import { point } from './utils';
import * as config from '../shared/game_config';

export interface playerBasicPROT {
	id: number,
	name: string
}
export interface playerPROT {
	id: number,
	position: point,
	angle: number,
	hp: number,
	bullet: number,
	maxBullet: number
}

export interface barricadePROT {
	point1: point,
	point2: point
}

export interface propPROT {
	id: number,
	position: point
}
export interface propHpPROT extends propPROT {

}
export interface propGunPROT extends propPROT {
	type: config.gun.type
}

export interface runningPROT {
	position: point,
	playerIdsInSight: number[],
}

export interface shootPROT {
	id: number,
	position: point,
	angle: number,
	playerIdsInSight: number[],
	shootingPlayerId: number,
	collisionPoint?: point,
	shootedPlayerId?: number
}
export interface duringShootingPROT {
	id: number,
	playerIdsInSight: number[],
	isEnd: boolean
}

export interface rankPROT {
	id: number,
	killTimes: number
}

export enum type {
	pong,
	init,
	main,
	shoot,
	gameOver
}

export class baseProtocol {
	constructor(type: type) {
		this.type = type;
	}
	type: type;
}

export class pongProtocol extends baseProtocol {
	constructor() {
		super(type.pong);
	}
}

export class initialize extends baseProtocol {
	constructor(currPlayerId: number, players: playerBasicPROT[],
		barricades: barricadePROT[],
		propHps: propHpPROT[], propGuns: propGunPROT[]) {
		super(type.init);

		this.currPlayerId = currPlayerId;
		this.players = players;
		this.barricades = barricades;
		this.propHps = propHps;
		this.propGuns = propGuns;
	}
	currPlayerId: number;
	players: playerBasicPROT[];
	barricades: barricadePROT[];
	propHps: propHpPROT[];
	propGuns: propGunPROT[];
}

export class mainPROT extends baseProtocol {
	constructor(playersInSight: number[]) {
		super(type.main);

		this.playerIdsInSight = playersInSight;
	}

	formatPlayerPROT(currPlayerId: number, format: (playerId: number) => playerPROT | null) {
		let arr = [currPlayerId];
		arr = arr.concat(this.playerIdsInSight);
		for (let shootPROT of this.shootPROTs) {
			arr = arr.concat(shootPROT.playerIdsInSight);
			if (shootPROT.shootedPlayerId)
				arr.push(shootPROT.shootedPlayerId)
		}
		for (let runningPROT of this.runningPROTs) {
			arr = arr.concat(runningPROT.playerIdsInSight);
		}

		let json = {};
		for (let i of arr) {
			if (!json[i]) {
				json[i] = 1;
				let playerPROT = format(i);
				if (playerPROT)
					this.playerPROTs.push(playerPROT);
			}
		}
	}

	playerPROTs: playerPROT[] = [];
	newPlayerBPROTs: playerBasicPROT[] = [];

	playerIdsInSight: number[];

	shootPROTs: shootPROT[] = [];
	duringShootingPROTs: duringShootingPROT[] = [];
	runningPROTs: runningPROT[] = [];

	rankList: rankPROT[] = [];

	newPropGunPROTs: propGunPROT[] = [];
	removedPropGunIds: number[] = [];
	newPropHpPROTs: propHpPROT[] = [];
	removedPropHpIds: number[] = [];
}

export interface records {
	shootingTimes: number,
	shootingInAimTimes: number,
	shootedTimes: number,
	killTimes: number
}
export class gameOver extends baseProtocol {
	constructor(records: records) {
		super(type.gameOver);
		this.records = records;
	}

	records: records;
}