import { point } from '../shared/utils';
import { gun } from './gun';
import * as config from '../shared/game_config';

import * as toClientPROT from '../shared/ws_prot_to_client';

let id = 0;

export class prop {
	readonly id = ++id;
	readonly position: point;

	constructor(position: point) {
		this.position = position;
	}
}

export class propHp extends prop {
	getPropHpPROT(): toClientPROT.propHpPROT {
		return {
			id: this.id,
			position: this.position
		}
	}
}

export class propGun extends prop {
	readonly gun: gun;

	constructor(position: point, gun: gun) {
		super(position);

		this.gun = gun;
	}

	getPropGunPROT(): toClientPROT.propGunPROT {
		return {
			id: this.id,
			position: this.position,
			type: this.gun.type
		}
	}
}