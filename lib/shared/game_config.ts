import * as serverConfig from '../config';

export namespace player {
	export let movingStep = 0.08 * serverConfig.mainInterval; // 每循环移动前进距离
	export let runingStep = 0.2 * serverConfig.mainInterval;  // 每循环跑步前进距离

	export let maxHp = 6;
	export let radius = 20;
	export let sightRadius = 100;
	export let runningSightRadius = 80;
	export let runningSightRemainsTime = 200; // 玩家跑步视野出现持续时间 (ms)
	export let runningSightDisapperTime = 400; // 玩家跑步视野消失持续时间 (ms)
}

export namespace hp {
	export let radius = 10;
	// 血包触发的半径
	export let activeRadius = 5;
	// 血包存在最大数量
	export let maxNumber = 5;
	// 血包出现时间间隔
	export let appearInterval = 10000;
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
			bulletFlyStep: 3 * serverConfig.mainInterval,
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
			attackInterval: 1000,
			attackSightRadius: 50,
			attackSightRemainsTime: 60,
			bulletFlyStep: 10
		});
	}
}

export namespace stage {
	export let width = 500;
	export let height = 500;
}