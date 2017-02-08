import * as serverConfig from '../config';

export namespace player {
	export let movingStep = 0.08 * serverConfig.mainInterval; // 每循环移动前进距离
	export let runingStep = 0.2 * serverConfig.mainInterval;  // 每循环跑步前进距离

	export let maxHp = 6;
	export let radius = 20;
	export let sightRadius = 100;
	export let runningSightRadius = 80;
	export let runningSightRemainsTime = 1; // 玩家跑步视野出现持续时间 (ms)
	export let runningSightDisapperTime = 2; // 玩家跑步视野消失持续时间 (ms)
	export let shootingSightRadius = 130;
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

export namespace gun {
	export enum type {
		pistol,
		rifle
	}

	export interface defaultSetting {
		shootingInterval: number,
		shootingSightRadius: number,
		shootingSightRemainsTime: number, // 射击视野停留时间(ms)
		bullet: number,
		bulletFlyStep: number, // 每循环子弹前进距离
		maxBullet: number
	}

	export let defaultSettings = new Map<type, defaultSetting>();
	defaultSettings.set(type.pistol, {
		shootingInterval: 500,
		shootingSightRadius: 130,
		shootingSightRemainsTime: 70,
		bullet: 15,
		bulletFlyStep: 3 * serverConfig.mainInterval,
		maxBullet: 30
	});
	defaultSettings.set(type.rifle, {
		shootingInterval: 200,
		shootingSightRadius: 200,
		shootingSightRemainsTime: 60,
		bullet: 30,
		bulletFlyStep: 0.8 * serverConfig.mainInterval,
		maxBullet: 60
	});
}

export namespace stage {
	export let width = 500;
	export let height = 500;
}