import * as serverConfig from '../../config';
import { point } from '../shared/utils';

export namespace player {
	export let movingStep = 0.08 * serverConfig.mainInterval; // 每循环移动前进距离
	export let runingStep = 0.136 * serverConfig.mainInterval;  // 每循环跑步前进距离

	export let maxHp = 6;
	export let radius = 20;
	export let sightRadius = 100;
	export let runningSightRadius = 80;
	export let runningSightRemainsTime = 200; // 玩家跑步视野出现持续时间 (ms)
	export let runningSightDisapperTime = 400; // 玩家跑步视野消失持续时间 (ms)
}

export namespace prop {
	export let radius = 10; // 道具显示的半径

	export namespace hp {
		export let activeRadius = 5; // 血包触发的半径
		export let maxNumber = 5; // 血包存在最大数量
		export let appearInterval = 10000; // 血包出现时间间隔
	}

	export namespace weapon {
		export let activeRadius = 5;
		export let maxNumber = 2;
		export let appearInterval = 15000;
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
		export enum type {
			pistol,
			rifle
		}

		export interface defaultSetting extends commonSetting {
			bullet: number,
			maxBullet: number
		}

		export let defaultSettings = new Map<type, defaultSetting>();
		defaultSettings.set(type.pistol, {
			attackType: attackType.gun,
			attackInterval: 500,
			attackSightRadius: 130,
			attackSightRemainsTime: 70,
			bullet: 15,
			bulletFlyStep: 5 * serverConfig.mainInterval,
			maxBullet: 30
		});
		defaultSettings.set(type.rifle, {
			attackType: attackType.gun,
			attackInterval: 200,
			attackSightRadius: 200,
			attackSightRemainsTime: 60,
			bullet: 30,
			bulletFlyStep: 0.8 * serverConfig.mainInterval,
			maxBullet: 60
		});
	}

	export namespace melee {
		export enum type {
			fist
		}

		export interface defaultSetting extends commonSetting {
		}

		export let defaultSettings = new Map<type, defaultSetting>();
		defaultSettings.set(type.fist, {
			attackType: attackType.melee,
			attackInterval: 600,
			attackSightRadius: 50,
			attackSightRemainsTime: 60,
			bulletFlyStep: 10
		});
	}
}

export namespace stage {
	export let width = 1000;
	export let height = 500;

	export let barricades = [
		[new point(360, 50), new point(550, 90)],
		[new point(310, 130), new point(610, 160)],
		[new point(100, 160), new point(160, 410)],
		[new point(790, 160), new point(850, 410)],
		[new point(440, 220), new point(480, 450)],
	]
}