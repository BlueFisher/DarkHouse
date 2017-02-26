import * as config from '../../shared/game_config';
import * as utils from '../../shared/utils';
import * as toClientPROT from '../../shared/ws_prot_to_client';

import { player } from './player';

let id = 0;

export abstract class equipment {
	readonly id = ++id;

	abstract getEqptPROT(): toClientPROT.eqpt.allEqptPROTTypes;
	abstract equip(player: player);
	abstract dispose(player: player);
}

export class eqptVisableSight extends equipment {
	readonly lastTime: number;
	readonly radius: number;

	constructor(lastTIme: number, radius: number) {
		super();

		this.lastTime = lastTIme;
		this.radius = radius;
	}

	getEqptPROT(): toClientPROT.eqpt.visableSightPROT {
		return {
			type: toClientPROT.eqpt.type.visableSight,
			id: this.id,
			radius: this.radius,
			lastTime: this.lastTime
		}
	}

	private timer: NodeJS.Timer;
	equip(player: player) {
		let i = player.eqpts.findIndex(p => p instanceof eqptVisableSight);
		if (i != -1) {
			player.eqpts[i].dispose(player);
		}

		player.eqpts.push(this);
		player.newEqptsCache.push(this);
		player.setSightRadius(this.radius);
		this.timer = setTimeout(() => {
			this.dispose(player);
		}, this.lastTime);
	}

	dispose(player: player) {
		clearTimeout(this.timer);
		player.setSightRadius(config.player.sightRadius);
		let i = player.eqpts.findIndex(p => p == this);
		if (i != -1) {
			player.removedEqptsCache.push(player.eqpts[i]);
			player.eqpts.splice(i, 1);
		}
	}
}