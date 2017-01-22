import { point } from '../shared/utils';

import * as toClientPROT from '../shared/ws_prot_to_client';

export class propHp {
	readonly position: point;

	constructor(position: point) {
		this.position = position;
	}

	getPropHpPROT(): toClientPROT.propHpPROT {
		return {
			position: this.position
		}
	}
}