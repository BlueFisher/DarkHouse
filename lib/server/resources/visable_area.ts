import * as utils from '../../shared/utils';
import * as config from '../../shared/game_config';
import * as toClientPROT from '../../shared/ws_prot_to_client';

import { player } from './player';

const point = utils.point;
type point = utils.point;

let id = 0;

export class visableArea {
	readonly id = ++id;
	readonly position: point;
	readonly radius: number;

	constructor(position: point, radius: number) {
		this.position = position;
		this.radius = radius;
	}

	getPlayersInSight(withinPlayers: player[]) {
		return withinPlayers.filter(p => {
			return utils.didTwoCirclesCollied(p.position, this.radius, this.position, config.player.radius);
		});
	}

	getVisableAreaPROT(): toClientPROT.visableAreaBasicPROT {
		return {
			id: this.id,
			position: this.position,
			radius: this.radius
		}
	}
}

export class visableAreaManager {
	readonly visableAreas: visableArea[] = [];

	constructor() {
		config.stage.visableArea.forEach(p => {
			this.visableAreas.push(new visableArea(p.position, p.radius));
		});
	}

	getAllVisableAreaBasicPROTs() {
		return this.visableAreas.map(p => p.getVisableAreaPROT());
	}
	getAllVisableAreaPROTs(withinPlayers: player[]): toClientPROT.visableAreaPROT[] {
		return this.visableAreas.map(p => {
			return {
				id: p.id,
				playerIds: p.getPlayersInSight(withinPlayers).map(pp => pp.id)
			}
		});
	}
}