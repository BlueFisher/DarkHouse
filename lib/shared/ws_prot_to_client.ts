import { point } from './utils';
import * as config from '../shared/game_config';

export interface playerBasicPROT {
	id: number,
	name: string,
	position: point,
	angle: number,
	hp: number,
	bullet: number,
	maxBullet: number,
	eqpts: eqpt.allEqptPROTTypes[]
}
export interface playerPROT {
	id: number,
	position: point,
	angle: number,
	hp?: number,
	bullet?: number,
	maxBullet?: number,

	newEqpts?: eqpt.allEqptPROTTypes[],
	removedEqptIds?: number[]
}

export namespace stage {
	export interface edgePROT {
		point1: point,
		point2: point
	}

	export interface barricadePROT {
		point1: point,
		point2: point
	}

	export interface visableAreaBasicPROT {
		id: number,
		position: point,
		radius: number
	}
	export interface visableAreaPROT {
		id: number,
		playerIds: number[]
	}
}

export namespace prop {
	export type allPropPROTTypes = hpPROT | weaponPROT | silencerPROT | visableSightPROT;
	export enum type {
		hp,
		weapon,
		silencer,
		visableSight
	}
	interface propPROT {
		type: type
		id: number,
		position: point
	}
	export interface hpPROT extends propPROT {
		hp: number
	}
	export interface weaponPROT extends propPROT {
		weapontType: config.weapon.weaponType,
		attackType: config.weapon.attackType
	}
	export interface silencerPROT extends propPROT { }
	export interface visableSightPROT extends propPROT {
		radius: number
	}
}

export namespace eqpt {
	export type allEqptPROTTypes = visableSightPROT;
	export enum type {
		visableSight
	}

	export interface playerNewAndRemovedEqptPROTs {
		playerId: number,
		newEqptPROTs: allEqptPROTTypes[],
		removedEqptIds: number[]
	}
	interface eqptPROT {
		type: type,
		id: number
	}
	export interface visableSightPROT extends eqptPROT {
		radius: number,
		lastTime: number
	}
}

export interface runningPROT {
	playerId: number,
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
	aimTimes: number // 击中次数
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

/**ping pong协议 */
export class pong extends baseProtocol {
	constructor() {
		super(type.pong);
	}
}

export class initialize extends baseProtocol {
	constructor(currPlayerId: number, players: playerBasicPROT[],
		edge: stage.edgePROT,
		barricades: stage.barricadePROT[],
		visableAreas: stage.visableAreaBasicPROT[],
		allPropPROTTypes: prop.allPropPROTTypes[]) {
		super(type.init);

		this.currPlayerId = currPlayerId;
		this.players = players;
		this.edge = edge;
		this.barricades = barricades;
		this.visableAreas = visableAreas;
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
	edge: stage.edgePROT;
	barricades: stage.barricadePROT[];
	visableAreas: stage.visableAreaBasicPROT[];
	props: prop.allPropPROTTypes[];
}

export class mainPROT extends baseProtocol {
	constructor() {
		super(type.main);
	}

	formatPlayerPROT(currPlayerId: number, playerPROTs: playerPROT[]) {
		let arr: number[] = [currPlayerId];
		if (this.playerIdsInSight)
			arr = arr.concat(this.playerIdsInSight);
		if (this.attackPROTs)
			this.attackPROTs.forEach(p => {
				arr = arr.concat(p.playerIdsInSight);
			});
		if (this.duringAttackPROTs)
			this.duringAttackPROTs.forEach(p => {
				arr = arr.concat(p.playerIdsInSight);
			});
		if (this.runningPROTs)
			this.runningPROTs.forEach(p => {
				arr = arr.concat(p.playerIdsInSight);
			});
		if (this.visableAreas)
			this.visableAreas.forEach(p => {
				arr = arr.concat(p.playerIds);
			});

		let json = {};
		for (let i of arr) {
			if (!json[i]) {
				json[i] = 1;
				let playerPROT = playerPROTs.find(p => p.id == i);
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
		if (this.attackPROTs)
			this.attackPROTs.forEach(p => {
				p.angle = parseFloat(p.angle.toFixed(2));
				p.bulletPosition = point.getFixedPoint(p.bulletPosition);
				p.position = point.getFixedPoint(p.position);
			});
		if (this.duringAttackPROTs)
			this.duringAttackPROTs.forEach(p => {
				p.bulletPosition = point.getFixedPoint(p.bulletPosition);
			});
		if (this.newPropPROTs)
			this.newPropPROTs.forEach(p => {
				p.position = point.getFixedPoint(p.position);
			});
	}

	playerPROTs: playerPROT[] = [];
	newPlayerBPROTs?: playerBasicPROT[];

	playerIdsInSight?: number[];

	visableAreas?: stage.visableAreaPROT[];

	attackPROTs?: attackPROT[];
	duringAttackPROTs?: duringAttackPROT[];
	runningPROTs?: runningPROT[];

	newPropPROTs?: prop.allPropPROTTypes[];
	removedPropIds?: number[];

	rankList: rankPROT[];
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