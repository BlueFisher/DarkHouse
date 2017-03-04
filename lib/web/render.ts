import * as fromClientPROT from '../shared/ws_prot_from_client';
import * as toClientPROT from '../shared/ws_prot_to_client';
import * as config from '../shared/game_config';
import { point } from '../shared/utils';
import * as vueData from './vue_data';
import { resourcesManager } from './resources';

export class render {
	private _resourceManager: resourcesManager;

	constructor(protocol: toClientPROT.initialize) {
		this._resourceManager = new resourcesManager(protocol);
	}

	onMainProtocol(protocol: toClientPROT.mainPROT) {
		this._resourceManager.onMainProtocol(protocol);
	}

	getPlayer(playerId) {
		return this._resourceManager.players.find(p => p.id == playerId);
	}
	getCurrPlayer() {
		return this._resourceManager.currPlayer;
	}

	draw(ctx: CanvasRenderingContext2D) {
		let canvas = ctx.canvas;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		let currPlayer = this._resourceManager.currPlayer;
		if (!currPlayer.initialized)
			return;

		ctx.save();

		ctx.setTransform(1.5, 0, 0, 1.5,
			canvas.width / 2 - currPlayer.position.x * 1.5, canvas.height / 2 - currPlayer.position.y * 1.5);

		this._resourceManager.drawEdge(ctx);

		this._resourceManager.drawBarricade(ctx);

		this._resourceManager.drawProp(ctx);

		this._resourceManager.drawPlayerVisableArea(ctx, currPlayer);

		this._resourceManager.drawPlayers(ctx, [this._resourceManager.currPlayer], '#333', '#f00');

		// 绘制射击
		this._resourceManager.attackCaches.forEach(cache => {
			cache.draw(ctx, this._resourceManager);
		});

		this._resourceManager.drawRunning(ctx);

		this._resourceManager.explodes.forEach(p => p.draw(ctx, this._resourceManager));

		this._resourceManager.drawVisableAreas(ctx);

		ctx.restore();

		if (this._resourceManager.shooingInAimEffect)
			this._resourceManager.shooingInAimEffect.draw(ctx);

		this._resourceManager.attackedEffects.forEach(p => p.draw(ctx));

		this._resourceManager.currPlayer.handleMoving();
	}
}