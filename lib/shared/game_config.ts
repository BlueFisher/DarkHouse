import * as serverConfig from '../../config';
import { point } from '../shared/utils';

export namespace player {
	export let movingStep = 0.08 * serverConfig.mainInterval; // 每循环移动前进距离
	export let runingStep = 0.18 * serverConfig.mainInterval;  // 每循环跑步前进距离

	export let maxHp = 12; // 最大生命值
	export let radius = 20; // 碰撞、绘制半径
	export let sightRadius = 100; // 视野半径
	export let runningSightRadius = 80; // 奔跑时视野半径
	export let runningSightRemainsTime = 200; // 玩家跑步视野出现持续时间 (ms)
	export let runningSightDisapperTime = 400; // 玩家跑步视野消失持续时间 (ms)
}

export namespace prop {
	export let radius = 10; // 道具显示的半径

	export namespace hp {
		export let smallHp = 2; // 小血包增加生命值
		export let bigHp = 4; // 大血包增加生命值
		export let activeRadius = 5; // 道具触发的半径
		export let smallHpAppearInterval = 10000; // 小血包出现频率
		export let smallHpMaxNumber = 5; // 小血包存在的最大数量
		export let bigHpAppearInterval = 20000;
		export let bigHpMaxNumber = 3;
	}

	export namespace weapon {
		export let activeRadius = 5; // 道具触发的半径
		export let maxNumber = 2; // 道具存在的最大数量
		export let appearInterval = 15000; // 道具出现频率
	}

	export namespace silencer {
		export let activeRadius = 5;
		export let maxNumber = 5;
		export let appearInterval = 20000;
	}

	export namespace visableSight {
		export let lastTime = 10000; // 视野道具持续时间
		export let radius = 200; // 视野半径
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
	export let width = 400; // 场景宽度
	export let height = 400; // 场景高度

	export let barricades = [
		[new point(30, 150), new point(100, 200)],
		[new point(240, 150), new point(320, 200)],
		[new point(120, 80), new point(220, 100)],
		[new point(240, 10), new point(250, 30)],
		[new point(120, 260), new point(240, 280)],
		[new point(160, 280), new point(180, 360)],
	];

	export let visableArea = [
		{
			position: new point(200, 200),
			radius: 40
		}
	]
}