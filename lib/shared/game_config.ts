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

export namespace stage {
	export let width = 500;
	export let height = 500;
}