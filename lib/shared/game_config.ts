export namespace player {
	export let movingStep = 2;
	export let runingStep = 5;
	export let movingInterval = 33;

	export let maxHp = 3;
	export let radius = 20;
	export let sightRadius = 100;
	export let runningSightRadius = 80;
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
		shootingSightTimeOut: number, // 射击视野停留时间
		bullet: number,
		maxBullet: number
	}

	export let defaultSettings = new Map<type, defaultSetting>();
	defaultSettings.set(type.pistol, {
		shootingInterval: 500,
		shootingSightRadius: 130,
		shootingSightTimeOut: 100,
		bullet: 15,
		maxBullet: 30
	});
	defaultSettings.set(type.rifle, {
		shootingInterval: 200,
		shootingSightRadius: 200,
		shootingSightTimeOut: 100,
		bullet: 30,
		maxBullet: 60
	});
}

export namespace stage {
	export let width = 500;
	export let height = 500;
}