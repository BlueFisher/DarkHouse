import * as serverConfig from '../../config';
import { point } from '../shared/utils';

export namespace player {
	export let movingStep = 0.08 * serverConfig.mainInterval; // 每循环移动前进距离
	export let runingStep = 0.136 * serverConfig.mainInterval;  // 每循环跑步前进距离

	export let maxHp = 12;
	export let radius = 20;
	export let sightRadius = 100;
	export let runningSightRadius = 80;
	export let runningSightRemainsTime = 200; // 玩家跑步视野出现持续时间 (ms)
	export let runningSightDisapperTime = 400; // 玩家跑步视野消失持续时间 (ms)
}

export namespace prop {
	export let radius = 10; // 道具显示的半径

	export namespace hp {
		export let smallHp = 2;
		export let bigHp = 4;
		export let activeRadius = 5; // 血包触发的半径
		export let smallHpAppearInterval = 10000;
		export let smallHpMaxNumber = 5;
		export let bigHpAppearInterval = 20000;
		export let bigHpMaxNumber = 3;
	}

	export namespace weapon {
		export let activeRadius = 5;
		export let maxNumber = 2;
		export let appearInterval = 15000;
	}

	export namespace silencer {
		export let activeRadius = 5;
		export let maxNumber = 5;
		export let appearInterval = 20000;
	}

	export namespace visableSight {
		export let lastTime = 5000;
		export let radius = 200;
		export let activeRadius = 5;
		export let maxNumber = 3;
		export let appearInterval = 20000;
	}
}


export namespace weapon {
	export enum attackType {
		gun,
		melee
	}
	export type weaponType = gun.type | melee.type;

	export interface commonSetting {
		attackType: attackType,
		attackInterval: number,
		attackSightRadius: number,
		attackSightRemainsTime: number,
		bulletFlyStep: number
	}

	export namespace gun {
		export interface damageRange {
			damage: number,
			radius: number
		}

		export enum type {
			pistol,
			rifle,
			rocket
		}

		export interface defaultSetting extends commonSetting {
			bullet: number,
			maxBullet: number,
			damageRanges: damageRange[]
		}

		export let defaultSettings = new Map<type, defaultSetting>([
			[type.pistol, {
				attackType: attackType.gun,
				attackInterval: 500,
				attackSightRadius: 130,
				attackSightRemainsTime: 70,
				bullet: 15,
				bulletFlyStep: 5 * serverConfig.mainInterval,
				maxBullet: 30,
				damageRanges: [{ damage: 2, radius: 0 }]
			}],
			[type.rifle, {
				attackType: attackType.gun,
				attackInterval: 200,
				attackSightRadius: 160,
				attackSightRemainsTime: 60,
				bullet: 30,
				bulletFlyStep: 0.8 * serverConfig.mainInterval,
				maxBullet: 60,
				damageRanges: [{ damage: 1, radius: 0 }]
			}],
			[type.rocket, {
				attackType: attackType.gun,
				attackInterval: 1000,
				attackSightRadius: 160,
				attackSightRemainsTime: 60,
				bullet: 7,
				bulletFlyStep: 0.6 * serverConfig.mainInterval,
				maxBullet: 10,
				damageRanges: [
					{ damage: 3, radius: 20 },
					{ damage: 2, radius: 70 },
					{ damage: 1, radius: 100 }
				]
			}]
		]);
	}

	export namespace melee {
		export enum type {
			fist
		}

		export interface defaultSetting extends commonSetting {
			damage: number
		}

		export let defaultSettings = new Map<type, defaultSetting>();
		defaultSettings.set(type.fist, {
			attackType: attackType.melee,
			attackInterval: 600,
			attackSightRadius: 50,
			attackSightRemainsTime: 60,
			bulletFlyStep: 10,
			damage: 1
		});
	}
}

export namespace stage {
	export let width = 2000 / 1.5;
	export let height = 2000 / 1.5;

	export let barricades = [
		[new point(150 / 1.5, 750 / 1.5), new point(500 / 1.5, 1000 / 1.5)],
		[new point(1200 / 1.5, 750 / 1.5), new point(1600 / 1.5, 1000 / 1.5)],
		[new point(600 / 1.5, 400 / 1.5), new point(1100 / 1.5, 500 / 1.5)],
		[new point(1200 / 1.5, 150 / 1.5), new point(1250 / 1.5, 50 / 1.5)],
		[new point(600 / 1.5, 1300 / 1.5), new point(1200 / 1.5, 1400 / 1.5)],
		[new point(800 / 1.5, 1400 / 1.5), new point(900 / 1.5, 1800 / 1.5)],
	];

	export let visableArea = [
		{
			position: new point(1000 / 1.5, 1000 / 1.5),
			radius: 200 / 1.5
		}
	]
}