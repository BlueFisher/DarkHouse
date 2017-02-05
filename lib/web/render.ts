import * as fromClientPROT from '../shared/ws_prot_from_client';
import * as toClientPROT from '../shared/ws_prot_to_client';
import * as config from '../shared/game_config';
import { point } from '../shared/utils';
import * as vueData from './vue_data';

export class render {
	currentPlayerId: number;
	playerBasicPROTs: toClientPROT.playerBasicPROT[] = [];
	barricades: toClientPROT.barricadePROT[] = [];
	propHps: toClientPROT.propHpPROT[] = [];
	propGuns: toClientPROT.propGunPROT[] = [];

	private _shootingCache: toClientPROT.shootPROT[] = [];
	private _mainPROTCache: toClientPROT.mainPROT;

	private _shooingInAimEffect: shootingInAimEffect;
	private _shootedEffects: shootedEffect[] = [];

	constructor(protocol: toClientPROT.initialize) {
		this.currentPlayerId = protocol.currPlayerId;
		this.playerBasicPROTs = protocol.players;
		this.barricades = protocol.barricades;
		this.propHps = protocol.propHps;
		this.propGuns = protocol.propGuns;
	}

	onMainProtocol(protocol: toClientPROT.mainPROT) {
		this._mainPROTCache = protocol;

		protocol.shootPROTs.forEach(p => {
			this._shootingCache.push(p);
			if (p.shootingPlayerId == this.currentPlayerId && p.shootedPlayerId) {
				this._shooingInAimEffect = new shootingInAimEffect('击中');
			}
			if (p.shootedPlayerId == this.currentPlayerId) {
				this._shootedEffects.push(new shootedEffect(p.angle + Math.PI));
			}
		});
		protocol.duringShootingPROTs.forEach(p => {
			let i = this._shootingCache.findIndex(pp => pp.id == p.id);
			if (i != -1) {
				if (p.isEnd) {
					this._shootingCache.splice(i, 1);
				} else {
					let shootingCache = this._shootingCache[i];
					shootingCache.playerIdsInSight = p.playerIdsInSight
				}
			}
		});

		protocol.newPlayerBPROTs.forEach(p => {
			this.playerBasicPROTs.push(p);
		});

		protocol.newPropHpPROTs.forEach(p => {
			this.propHps.push(p);
		});
		protocol.newPropGunPROTs.forEach(p => {
			this.propGuns.push(p);
		});
		protocol.removedPropHpIds.forEach(p => {
			let i = this.propHps.findIndex(pp => pp.id == p);
			if (i != -1)
				this.propHps.splice(i, 1);
		});
		protocol.removedPropGunIds.forEach(p => {
			let i = this.propGuns.findIndex(pp => pp.id == p);
			if (i != -1)
				this.propGuns.splice(i, 1);
		});
	}

	getPlayerPROT(playerId: number) {
		return this._mainPROTCache.playerPROTs.find(p => p.id == playerId);
	}
	getPlayerBPROT(playerId: number) {
		return this.playerBasicPROTs.find(p => p.id == playerId);
	}

	private _drawPlayer(ctx: CanvasRenderingContext2D,
		playerIds: number[], fillStyle: string, strokeStyle: string) {

		ctx.save();
		ctx.fillStyle = fillStyle;
		ctx.strokeStyle = strokeStyle;
		ctx.textAlign = 'center';

		for (let playerId of playerIds) {
			let player = this.getPlayerPROT(playerId);
			if (!player)
				continue;

			ctx.beginPath();
			ctx.arc(player.position.x, player.position.y, config.player.radius, 0, Math.PI * 2);
			ctx.fill();

			ctx.beginPath();
			ctx.moveTo(player.position.x, player.position.y);
			ctx.lineTo(config.player.radius * Math.cos(player.angle) + player.position.x,
				config.player.radius * Math.sin(player.angle) + player.position.y);
			ctx.stroke();

			ctx.strokeStyle = 'rgba(0,255,0,.5)';
			ctx.lineWidth = 3;
			let gap = Math.PI / 25;
			let perimeter = Math.PI * 2 - config.player.maxHp * gap;
			for (let i = 0; i < player.hp; i++) {
				ctx.beginPath();
				ctx.arc(player.position.x, player.position.y, config.player.radius - 1.5,
					i * perimeter / config.player.maxHp + i * gap - Math.PI / 2,
					(i + 1) * perimeter / config.player.maxHp + i * gap - Math.PI / 2);
				ctx.stroke();
			}

			ctx.strokeStyle = 'rgba(0,0,0,.5)';
			ctx.lineWidth = 3;
			gap = Math.PI / 50;
			perimeter = Math.PI * 2 - player.maxBullet * gap;
			for (let i = 0; i < player.maxBullet; i++) {
				ctx.beginPath();
				ctx.arc(player.position.x, player.position.y, config.player.radius + 1.5,
					i * perimeter / player.maxBullet + i * gap - Math.PI / 2,
					(i + 1) * perimeter / player.maxBullet + i * gap - Math.PI / 2);
				ctx.stroke();
			}

			ctx.strokeStyle = 'rgba(255,255,255,.5)';
			ctx.lineWidth = 3;
			for (let i = 0; i < player.bullet; i++) {
				ctx.beginPath();
				ctx.arc(player.position.x, player.position.y, config.player.radius + 1.5,
					i * perimeter / player.maxBullet + i * gap - Math.PI / 2,
					(i + 1) * perimeter / player.maxBullet + i * gap - Math.PI / 2);
				ctx.stroke();
			}

			let playerBasic = this.getPlayerBPROT(player.id);
			if (playerBasic) {
				ctx.fillText(playerBasic.name, player.position.x, player.position.y + config.player.radius + 15);
			}
		}

		ctx.restore();
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (!this._mainPROTCache)
			return;

		let canvas = ctx.canvas;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		let currPlayer = this.getPlayerPROT(this.currentPlayerId);

		if (!currPlayer)
			return;

		ctx.save();

		if (currPlayer)
			ctx.setTransform(1.5, 0, 0, 1.5,
				canvas.width / 2 - currPlayer.position.x * 1.5, canvas.height / 2 - currPlayer.position.y * 1.5);

		// 绘制障碍物
		ctx.fillStyle = '#111';
		for (let barricade of this.barricades) {
			ctx.fillRect(barricade.point1.x, barricade.point1.y,
				barricade.point2.x - barricade.point1.x, barricade.point2.y - barricade.point1.y);
		}

		// 绘制道具
		ctx.fillStyle = '#f00';
		for (let propHp of this.propHps) {
			ctx.beginPath();
			ctx.arc(propHp.position.x, propHp.position.y, config.hp.radius, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.fillStyle = '#0f0';
		for (let propHp of this.propGuns) {
			ctx.beginPath();
			ctx.arc(propHp.position.x, propHp.position.y, config.hp.radius, 0, Math.PI * 2);
			ctx.fill();
		}

		// 绘制可见区域
		ctx.save();

		// 绘制可见区域中所有玩家
		ctx.beginPath();
		if (currPlayer)
			ctx.arc(currPlayer.position.x, currPlayer.position.y, config.player.sightRadius - 1, 0, Math.PI * 2);
		ctx.clip();

		this._drawPlayer(ctx, this._mainPROTCache.playerIdsInSight, '#fff', '#f00');

		// 绘制可见区域中所有障碍物
		ctx.fillStyle = '#fff';
		for (let barricade of this.barricades) {
			ctx.fillRect(barricade.point1.x, barricade.point1.y,
				barricade.point2.x - barricade.point1.x, barricade.point2.y - barricade.point1.y);
		}

		ctx.restore();

		// 绘制可见区域光线
		ctx.beginPath();
		ctx.fillStyle = 'rgba(255,255,255,0.25)';
		if (currPlayer)
			ctx.arc(currPlayer.position.x, currPlayer.position.y, config.player.sightRadius, 0, Math.PI * 2);
		ctx.fill();

		// 绘制本玩家
		this._drawPlayer(ctx, [this.currentPlayerId], '#333', '#f00');

		// 绘制射击
		let isShooted = false;
		this._mainPROTCache.shootPROTs.forEach(shootPROT => {

			ctx.save();
			if (shootPROT.shootingPlayerId == this.currentPlayerId && shootPROT.shootedPlayerId) {
				isShooted = true;
			}
			// 绘制射击可见区域中所有玩家
			ctx.beginPath();
			ctx.arc(shootPROT.position.x, shootPROT.position.y, config.player.shootingSightRadius - 1, 0, Math.PI * 2);
			ctx.clip();

			this._drawPlayer(ctx, shootPROT.playerIdsInSight, '#fff', '#f00');

			ctx.restore();

			if (shootPROT.shootedPlayerId) {
				this._drawPlayer(ctx, [shootPROT.shootedPlayerId], '#fff', '#f00');
			}

			// 绘制射击可见区域
			ctx.beginPath();
			ctx.fillStyle = 'rgba(255,255,0,0.25)';
			ctx.strokeStyle = 'rgba(255,255,0,0.25)';
			ctx.lineWidth = 3;
			ctx.arc(shootPROT.position.x, shootPROT.position.y, config.player.shootingSightRadius, 0, Math.PI * 2);
			ctx.fill();

			// 绘制射击射线
			ctx.beginPath();
			ctx.moveTo(shootPROT.position.x, shootPROT.position.y);
			if (shootPROT.collisionPoint) {
				ctx.lineTo(shootPROT.collisionPoint.x, shootPROT.collisionPoint.y);
			} else {
				let d = Math.max(canvas.width, canvas.height);
				ctx.lineTo(shootPROT.position.x + d * Math.cos(shootPROT.angle),
					shootPROT.position.y + d * Math.sin(shootPROT.angle));
			}
			ctx.stroke();
		});

		// 绘制奔跑
		this._mainPROTCache.runningPROTs.forEach(runningPROT => {
			ctx.save();

			// 绘制奔跑范围视野中所有的玩家
			ctx.beginPath();
			ctx.arc(runningPROT.position.x, runningPROT.position.y, config.player.runningSightRadius - 1, 0, Math.PI * 2);
			ctx.clip();

			this._drawPlayer(ctx, runningPROT.playerIdsInSight, '#fff', '#f00');

			ctx.restore();

			// 绘制奔跑视野
			ctx.beginPath();
			ctx.fillStyle = 'rgba(255,255,255,0.75)';
			ctx.arc(runningPROT.position.x, runningPROT.position.y, config.player.runningSightRadius, 0, Math.PI * 2);
			ctx.fill();
		});

		ctx.restore();

		if (this._shooingInAimEffect)
			this._shooingInAimEffect.draw(ctx);
		this._shootedEffects.forEach(p => p.draw(ctx));
	}
}

class resource {
	protected _isDisposed = false;
	dispose() {
		this._isDisposed = true;
	}
}

class shootedEffect extends resource {
	private _angle: number;
	private _timeout = 10;

	constructor(angle: number) {
		super();

		this._angle = angle;
	}
	draw(ctx: CanvasRenderingContext2D) {
		if (this._isDisposed)
			return;

		ctx.save();

		ctx.strokeStyle = '#f00';
		ctx.lineWidth = 5;
		ctx.beginPath();
		ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, 50, this._angle - Math.PI / 32, this._angle + Math.PI / 32);
		ctx.stroke();

		ctx.restore();

		if (--this._timeout <= 0) {
			this.dispose();
		}
	}
}

class shootingInAimEffect extends resource {
	private _fontsize = 20;
	private _text: string;

	constructor(text: string) {
		super();

		this._text = text;
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (this._isDisposed)
			return;

		ctx.save();

		ctx.font = `${this._fontsize}px 微软雅黑`;
		ctx.textAlign = 'center';
		ctx.fillStyle = '#fff'
		ctx.fillText(this._text, ctx.canvas.width / 2, 50);

		ctx.restore();

		if (++this._fontsize > 50) {
			this.dispose();
		}
	}
}