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

export interface edgePROT {
	point1: point,
	point2: point
}
export interface barricadePROT {
	point1: point,
	point2: point
}

export type allPropPROTTypes = propHpPROT | propWeaponPROT | propSilencerPROT;
export enum propType {
	hp,
	weapon,
	silencer
}
interface propPROT {
	type: propType
	id: number,
	position: point
}
export interface propHpPROT extends propPROT { }
export interface propWeaponPROT extends propPROT {
	weapontType: config.weapon.weaponType,
	attackType: config.weapon.attackType
}
export interface propSilencerPROT extends propPROT { }

export interface runningPROT {
	position: point,
	playerIdsInSight: number[],
}

export interface attackPROT {
	id: number,
	attackType: config.weapon.attackType,
	weaponType: config.weapon.weaponType,
	position: point, // 攻击地点
	angle: number,
	playerIdsInSight: number[],
	attackPlayerId: number, // 攻击的玩家id
	bulletPosition: point,
	sightRadius: number
}
export interface duringAttackPROT {
	id: number,
	bulletPosition: point,
	playerIdsInSight: number[],
	attackedPlayerIds: number[],
	killedPlayerIds: number[],
	isSightEnd: boolean,
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
		edge: edgePROT,
		barricades: barricadePROT[],
		allPropPROTTypes: allPropPROTTypes[]) {
		super(type.init);

		this.currPlayerId = currPlayerId;
		this.players = players;
		this.edge = edge;
		this.barricades = barricades;
		this.props = allPropPROTTypes;

		edge.point1 = point.getFixedPoint(edge.point1);
		edge.point2 = point.getFixedPoint(edge.point2);
		barricades.forEach(p => {
			p.point1 = point.getFixedPoint(p.point1);
			p.point2 = point.getFixedPoint(p.point2);
		});

		this.props.forEach(p => {
			p.position = point.getFixedPoint(p.position);
		})
	}
	currPlayerId: number;
	players: playerBasicPROT[];
	edge: edgePROT;
	barricades: barricadePROT[];
	props: allPropPROTTypes[];
}

export class mainPROT extends baseProtocol {
	constructor() {
		super(type.main);
	}

	formatPlayerPROT(currPlayerId: number, format: (playerId: number) => playerPROT | null) {
		let arr = [currPlayerId];
		arr = arr.concat(this.playerIdsInSight);
		this.attackPROTs.forEach(p => {
			arr = arr.concat(p.playerIdsInSight);
		});
		this.duringAttackPROTs.forEach(p => {
			arr = arr.concat(p.playerIdsInSight);
		});
		this.runningPROTs.forEach(p => {
			arr = arr.concat(p.playerIdsInSight);
		});

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
	fixNumbers() {
		this.playerPROTs.forEach(p => {
			p.angle = parseFloat(p.angle.toFixed(2));
			p.position = point.getFixedPoint(p.position);
		});
		this.attackPROTs.forEach(p => {
			p.angle = parseFloat(p.angle.toFixed(2));
			p.bulletPosition = point.getFixedPoint(p.bulletPosition);
			p.position = point.getFixedPoint(p.position);
		});
		this.duringAttackPROTs.forEach(p => {
			p.bulletPosition = point.getFixedPoint(p.bulletPosition);
		});
		this.runningPROTs.forEach(p => {
			p.position = point.getFixedPoint(p.position);
		});
		this.newPropPROTs.forEach(p => {
			p.position = point.getFixedPoint(p.position);
		});
	}

	playerPROTs: playerPROT[] = [];
	newPlayerBPROTs: playerBasicPROT[] = [];

	playerIdsInSight: number[];

	attackPROTs: attackPROT[] = [];
	duringAttackPROTs: duringAttackPROT[] = [];
	runningPROTs: runningPROT[] = [];

	rankList: rankPROT[] = [];

	newPropPROTs: allPropPROTTypes[] = [];
	removedPropIds: number[] = [];
}

export interface records {
	attackTimes: number,
	attackInAimTimes: number,
	attactedTimes: number,
	killTimes: number
}
export class gameOver extends baseProtocol {
	constructor(records: records) {
		super(type.gameOver);
		this.records = records;
	}

	records: records;
}