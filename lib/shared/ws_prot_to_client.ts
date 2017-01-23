import { point } from './utils';


export interface playerBasicPROT {
	id: number,
	name: string
}
export interface playerPROT {
	id: number,
	position: point,
	angle: number,
	hp: number,
}

export interface barricadePROT {
	point1: point,
	point2: point
}

export interface propHpPROT {
	position: point
}

export interface runningPROT {
	position: point,
	playerIdsInSight: number[],
}

export interface shootPROT {
	position: point,
	angle: number,
	playerIdsInSight: number[],
	collisionPoint?: point,
	shootedPlayerId?: number
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
	constructor(currPlayer: playerBasicPROT, players: playerBasicPROT[], barricades: barricadePROT[], propHps: propHpPROT[]) {
		super(type.init);

		this.currPlayer = currPlayer;
		this.players = players;
		this.barricades = barricades;
		this.propHps = propHps;
	}
	currPlayer: playerBasicPROT;
	players: playerBasicPROT[];
	barricades: barricadePROT[];
	propHps: propHpPROT[];
}

export class mainPROT extends baseProtocol {
	constructor(currPlayer: number, playersInSight: number[]) {
		super(type.main);

		this.currPlayerId = currPlayer;
		this.playerIdsInSight = playersInSight;
	}

	formatPlayerPROT(format: (playerId: number) => playerPROT | null) {
		let arr = [this.currPlayerId];
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
					this.playerBPROTs.push(playerPROT);
			}
		}
	}

	playerBPROTs: playerPROT[] = [];
	newPlayerBPROTs: playerBasicPROT[] = [];

	currPlayerId: number;
	playerIdsInSight: number[];

	shootPROTs: shootPROT[] = [];
	runningPROTs: runningPROT[] = [];
	propHpPROTs: propHpPROT[] = [];
}

export class gameOver extends baseProtocol {
	constructor() {
		super(type.gameOver);
	}
}