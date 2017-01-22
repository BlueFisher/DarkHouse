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
	playersInSight: playerPROT[],
}

export interface shootPROT {
	position: point,
	angle: number,
	playersInSight: playerPROT[],
	collisionPoint?: point,
	shootedPlayer?: playerPROT
}

export enum type {
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
	constructor(currPlayer: playerPROT, playersInSight: playerPROT[]) {
		super(type.main);

		this.currPlayer = currPlayer;
		this.playersInSight = playersInSight;
	}

	newPlayerBPROTs: playerBasicPROT[] = [];

	currPlayer: playerPROT;
	playersInSight: playerPROT[];

	shootPROTs: shootPROT[] = [];
	runningPROTs: runningPROT[] = [];
	propHpPROTs: propHpPROT[] = [];
}

export class gameOver extends baseProtocol {
	constructor() {
		super(type.gameOver);
	}
}