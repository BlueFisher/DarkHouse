export enum type {
	ping,
	init,
	startRunning,
	stopMoving,
	rotate,
	startShooting,
	startCombat,
	useProp
}

export class baseProtocol {
	constructor(type: type) {
		this.type = type;
	}
	type: type;
}

export class ping extends baseProtocol {
	constructor() {
		super(type.ping);
	}
}

export class initialize extends baseProtocol {
	constructor(name: string) {
		super(type.init);
		this.name = name;
	}
	name: string;
}
export class startRunning extends baseProtocol {
	constructor(active: boolean) {
		super(type.startRunning);
		this.active = active;
	}
	active: boolean;
}
export class stopMoving extends baseProtocol {
	constructor(active: boolean) {
		super(type.stopMoving);
		this.active = active;
	}
	active: boolean;
}
export class rotate extends baseProtocol {
	constructor(angle: number) {
		super(type.rotate);
		this.angle = angle;
	}
	angle: number;
}

export class startShoot extends baseProtocol {
	constructor(active: boolean) {
		super(type.startShooting);
		this.active = active;
	}
	active: boolean;
}
export class startCombat extends baseProtocol {
	constructor(active: boolean) {
		super(type.startCombat);
		this.active = active;
	}
	active: boolean;
}
export class useProp extends baseProtocol {
	constructor() {
		super(type.useProp);
	}
}