import * as toClientPROT from '../shared/ws_prot_to_client';
import * as config from '../shared/game_config';
import { point } from '../shared/utils';

export class resourcesManager {
	players: player[] = [];
	currPlayer: currPlayer;

	edge: toClientPROT.stage.edgePROT;
	barricades: toClientPROT.stage.barricadePROT[] = [];
	visableAreaBasicPROTs: toClientPROT.stage.visableAreaBasicPROT[] = [];
	props: toClientPROT.prop.allPropPROTTypes[] = [];

	shooingInAimEffect: attackInAimEffect;
	attackedEffects: attackedEffect[] = [];
	attackCaches: attackCache[] = [];
	explodes: explode[] = [];

	mainPROTCache: toClientPROT.mainPROT;

	constructor(protocol: toClientPROT.initialize) {
		protocol.players.forEach(p => {
			if (p.id == protocol.currPlayerId) {
				let curr = new currPlayer(p);
				this.currPlayer = curr;
				this.players.push(curr);
			} else {
				this.players.push(new player(p));
			}
		});
		this.edge = protocol.edge;
		this.barricades = protocol.barricades;
		this.visableAreaBasicPROTs = protocol.visableAreas;
		this.props = protocol.props;
	}

	onMainProtocol(protocol: toClientPROT.mainPROT) {
		this.mainPROTCache = protocol;

		if (protocol.attackPROTs)
			this.attackCaches = this.attackCaches.concat(protocol.attackPROTs.map(p => new attackCache(p)));

		if (protocol.duringAttackPROTs)
			protocol.duringAttackPROTs.forEach(p => {
				let cache = this.attackCaches.find(pp => pp.id == p.id);
				if (cache)
					cache.onDuringAttackPROT(p, this);
			});

		if (protocol.newPlayerBPROTs)
			protocol.newPlayerBPROTs.forEach(p => {
				this.players.push(new player(p));
			});

		protocol.playerPROTs.forEach(p => {
			let player = this.players.find(pp => pp.id == p.id);
			if (player) {
				player.onPlayerPROT(p);
			}
		});

		if (protocol.newPropPROTs)
			this.props = this.props.concat(protocol.newPropPROTs);

		if (protocol.removedPropIds)
			protocol.removedPropIds.forEach(p => {
				let i = this.props.findIndex(pp => pp.id == p);
				if (i != -1) {
					this.props.splice(i, 1);
				}
			});
	}

	private _draw(ctx: CanvasRenderingContext2D, drawHandler: () => void) {
		ctx.save();
		drawHandler();
		ctx.restore();
	}

	drawEdge(ctx: CanvasRenderingContext2D) {
		this._draw(ctx, () => {
			ctx.beginPath();
			ctx.strokeStyle = '#111';
			ctx.fillStyle = '#000';
			ctx.fillRect(this.edge.point1.x, this.edge.point1.y,
				this.edge.point2.x - this.edge.point1.x,
				this.edge.point2.y - this.edge.point1.y);
			ctx.strokeRect(this.edge.point1.x, this.edge.point1.y,
				this.edge.point2.x - this.edge.point1.x,
				this.edge.point2.y - this.edge.point1.y);
		});
	}

	drawBarricade(ctx: CanvasRenderingContext2D) {
		this._draw(ctx, () => {
			ctx.fillStyle = '#111';
			for (let barricade of this.barricades) {
				ctx.fillRect(barricade.point1.x, barricade.point1.y,
					barricade.point2.x - barricade.point1.x, barricade.point2.y - barricade.point1.y);
			}
		});
	}

	drawVisableAreas(ctx: CanvasRenderingContext2D) {
		this._draw(ctx, () => {
			this.visableAreaBasicPROTs.forEach(area => {
				if (this.mainPROTCache.visableAreas) {
					let a = this.mainPROTCache.visableAreas.find(p => p.id == area.id);
					if (a) {
						ctx.save();

						// 绘制可见区域中所有玩家
						ctx.beginPath();

						ctx.arc(area.position.x, area.position.y, area.radius, 0, Math.PI * 2);
						ctx.clip();

						this.drawPlayersById(ctx, a.playerIds, '#fff', '#f00');
						ctx.restore();
					}
				}
				ctx.beginPath();
				ctx.fillStyle = 'rgba(0,255,255,0.25)';

				ctx.arc(area.position.x, area.position.y, area.radius, 0, Math.PI * 2);
				ctx.fill();
			});
		});
	}

	drawPlayerVisableArea(ctx: CanvasRenderingContext2D, currPlayer: player) {
		this._draw(ctx, () => {
			ctx.save();

			// 绘制可见区域中所有玩家
			ctx.beginPath();

			let sightRadius = config.player.sightRadius;

			let eqptVisableSight = currPlayer.eqpts.find(p => p.type == toClientPROT.eqpt.type.visableSight)
			if (eqptVisableSight) {
				sightRadius = eqptVisableSight.radius;
			}

			ctx.arc(currPlayer.position.x, currPlayer.position.y, sightRadius - 1, 0, Math.PI * 2);
			ctx.clip();

			if (this.mainPROTCache.playerIdsInSight)
				this.drawPlayersById(ctx, this.mainPROTCache.playerIdsInSight, '#fff', '#f00');

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

			ctx.arc(currPlayer.position.x, currPlayer.position.y, sightRadius, 0, Math.PI * 2);
			ctx.fill();
		});
	}

	drawProp(ctx: CanvasRenderingContext2D) {
		this._draw(ctx, () => {
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.font = '10px 微软雅黑';

			for (let prop of this.props) {
				if (prop.type == toClientPROT.prop.type.hp) {
					let propHp = prop as toClientPROT.prop.hpPROT;

					ctx.fillStyle = '#0f0';
					ctx.beginPath();
					ctx.arc(propHp.position.x, propHp.position.y, config.prop.radius, 0, Math.PI * 2);
					ctx.fill();
					ctx.fillStyle = '#fff';
					ctx.fillText(`+${propHp.hp}`, propHp.position.x, propHp.position.y);
				} else if (prop.type == toClientPROT.prop.type.weapon) {
					let propWeapon = prop as toClientPROT.prop.weaponPROT;

					ctx.fillStyle = '#f00';
					ctx.beginPath();
					ctx.arc(propWeapon.position.x, propWeapon.position.y, config.prop.radius, 0, Math.PI * 2);
					ctx.fill();

					let weaponName = '';
					if (propWeapon.attackType == config.weapon.attackType.gun) {
						switch (propWeapon.weapontType) {
							case config.weapon.gun.type.pistol:
								weaponName = '手枪';
								break;
							case config.weapon.gun.type.rifle:
								weaponName = '步枪';
								break;
							case config.weapon.gun.type.rocket:
								weaponName = '火箭筒';
								break;
						}
					} else if (propWeapon.attackType == config.weapon.attackType.melee) {
						if (propWeapon.weapontType == config.weapon.melee.type.fist) {
							weaponName = '拳头';
						}
					}
					ctx.fillStyle = '#fff';
					ctx.fillText(weaponName, propWeapon.position.x, propWeapon.position.y);
				} else if (prop.type == toClientPROT.prop.type.silencer) {
					let propSilencer = prop as toClientPROT.prop.silencerPROT;

					ctx.fillStyle = '#00f';
					ctx.beginPath();
					ctx.arc(propSilencer.position.x, propSilencer.position.y, config.prop.radius, 0, Math.PI * 2);
					ctx.fill();
					ctx.fillStyle = '#fff';
					ctx.fillText('消音器', propSilencer.position.x, propSilencer.position.y);
				} else if (prop.type == toClientPROT.prop.type.visableSight) {
					let propVisableSight = prop as toClientPROT.prop.visableSightPROT;

					ctx.fillStyle = '#0ff';
					ctx.beginPath();
					ctx.arc(propVisableSight.position.x, propVisableSight.position.y, config.prop.radius, 0, Math.PI * 2);
					ctx.fill();
					ctx.fillStyle = '#fff';
					ctx.fillText('视野', propVisableSight.position.x, propVisableSight.position.y);
				}
			}
		});
	}

	drawRunning(ctx: CanvasRenderingContext2D) {
		if (this.mainPROTCache.runningPROTs)
			this.mainPROTCache.runningPROTs.forEach(runningPROT => {
				let player = this.players.find(p => p.id == runningPROT.playerId);
				if (player) {
					ctx.save();

					// 绘制奔跑范围视野中所有的玩家
					ctx.beginPath();
					ctx.arc(player.position.x, player.position.y, config.player.runningSightRadius - 1, 0, Math.PI * 2);
					ctx.clip();

					this.drawPlayersById(ctx, runningPROT.playerIdsInSight, '#fff', '#f00');

					ctx.restore();

					// 绘制奔跑视野
					ctx.beginPath();
					ctx.fillStyle = 'rgba(255,255,255,0.75)';
					ctx.arc(player.position.x, player.position.y, config.player.runningSightRadius, 0, Math.PI * 2);
					ctx.fill();
				}
			});
	}

	drawPlayersById(ctx: CanvasRenderingContext2D, playerIds: number[],
		fillStyle: string, strokeStyle: string) {
		this._draw(ctx, () => {
			for (let playerId of playerIds) {
				let player = this.players.find(p => p.id == playerId);
				if (player)
					player.draw(ctx, fillStyle, strokeStyle);
			}
		});
	}

	drawPlayers(ctx: CanvasRenderingContext2D, players: player[],
		fillStyle: string, strokeStyle: string) {

		this._draw(ctx, () => {
			for (let player of players) {
				player.draw(ctx, fillStyle, strokeStyle);
			}
		});
	}
}

class resource {
	protected _isDisposed = false;

	protected _dispose() {
		this._isDisposed = true;
	}

	protected _draw(ctx: CanvasRenderingContext2D, drawHandler: () => void) {
		if (this._isDisposed)
			return;

		ctx.save();
		drawHandler();
		ctx.restore();
	}
}

class player extends resource {
	constructor(basicPROT: toClientPROT.playerBasicPROT) {
		super();

		this.id = basicPROT.id;
		this.name = basicPROT.name;
		this.eqpts = basicPROT.eqpts;
	}

	onPlayerPROT(protocol: toClientPROT.playerPROT) {
		this.initialized = true;
		this.position = protocol.position;
		this.angle = protocol.angle;
		if (protocol.hp != undefined)
			this.hp = protocol.hp;
		if (protocol.bullet != undefined)
			this.bullet = protocol.bullet;
		if (protocol.maxBullet != undefined)
			this.maxBullet = protocol.maxBullet;

		if (protocol.removedEqptIds)
			for (let id of protocol.removedEqptIds) {
				let i = this.eqpts.findIndex(pp => pp.id == id);
				if (i != -1) {
					this.eqpts.splice(i, 1);
				}
			}

		if (protocol.newEqpts)
			this.eqpts = this.eqpts.concat(protocol.newEqpts);
	}

	initialized = false;
	readonly id: number;
	readonly name: string;
	eqpts: toClientPROT.eqpt.allEqptPROTTypes[];

	position: point;
	angle: number;
	hp: number;
	bullet: number;
	maxBullet: number;

	draw(ctx: CanvasRenderingContext2D, fillStyle: string, strokeStyle: string) {
		if (!this.initialized)
			return;
		this._draw(ctx, () => {
			ctx.fillStyle = fillStyle;
			ctx.strokeStyle = strokeStyle;
			ctx.textAlign = 'center';

			ctx.beginPath();
			ctx.arc(this.position.x, this.position.y, config.player.radius, 0, Math.PI * 2);
			ctx.fill();

			ctx.beginPath();
			ctx.moveTo(this.position.x, this.position.y);
			ctx.lineTo(config.player.radius * Math.cos(this.angle) + this.position.x,
				config.player.radius * Math.sin(this.angle) + this.position.y);
			ctx.stroke();

			ctx.strokeStyle = 'rgba(0,255,0,.5)';
			ctx.lineWidth = 3;
			let gap = Math.PI / 25;
			let perimeter = Math.PI * 2 - config.player.maxHp * gap;
			for (let i = 0; i < this.hp; i++) {
				ctx.beginPath();
				ctx.arc(this.position.x, this.position.y, config.player.radius - 1.5,
					i * perimeter / config.player.maxHp + i * gap - Math.PI / 2,
					(i + 1) * perimeter / config.player.maxHp + i * gap - Math.PI / 2);
				ctx.stroke();
			}

			ctx.strokeStyle = 'rgba(0,0,0,.5)';
			ctx.lineWidth = 3;
			gap = Math.PI / 50;
			perimeter = Math.PI * 2 - this.maxBullet * gap;
			for (let i = 0; i < this.maxBullet; i++) {
				ctx.beginPath();
				ctx.arc(this.position.x, this.position.y, config.player.radius + 1.5,
					i * perimeter / this.maxBullet + i * gap - Math.PI / 2,
					(i + 1) * perimeter / this.maxBullet + i * gap - Math.PI / 2);
				ctx.stroke();
			}

			ctx.strokeStyle = 'rgba(255,255,255,.5)';
			ctx.lineWidth = 3;
			for (let i = 0; i < this.bullet; i++) {
				ctx.beginPath();
				ctx.arc(this.position.x, this.position.y, config.player.radius + 1.5,
					i * perimeter / this.maxBullet + i * gap - Math.PI / 2,
					(i + 1) * perimeter / this.maxBullet + i * gap - Math.PI / 2);
				ctx.stroke();
			}

			ctx.fillText(this.name, this.position.x, this.position.y + config.player.radius + 15);
		});
	}

	dispose(manager: resourcesManager) {
		this._dispose();
		let i = manager.players.findIndex(p => p == this);
		if (i != -1)
			manager.explodes.splice(i);
	}
}

class currPlayer extends player {
	isMoving = true;
	isRunning = false;
	constructor(basicPROT: toClientPROT.playerBasicPROT) {
		super(basicPROT);

		setInterval(() => {
			if (this.initialized) {
				if (this.isMoving) {
					let step = this.isRunning ? config.player.runingStep : config.player.movingStep;
					let x = this.position.x + Math.cos(this.angle) * step;
					let y = this.position.y + Math.sin(this.angle) * step;
					this.position = new point(x, y);
				}
			}
		}, 1000 / 60);
	}

	setAngle(angle: number) {
		this.angle = angle;
	}
}

/**攻击缓存 */
class attackCache extends resource {
	readonly id: number;
	private _bulletPosition: point;
	private _attackPROT: toClientPROT.attackPROT;

	private _attackedPlayerIds: number[] = [];
	private _isSightEnd: boolean = false;
	private _isEnd: boolean = false;

	private _fadeOutTime = 20;

	constructor(p: toClientPROT.attackPROT) {
		super();

		this.id = p.id;
		this._bulletPosition = p.bulletPosition;
		this._attackPROT = p;
	}

	onDuringAttackPROT(protocol: toClientPROT.duringAttackPROT, manager: resourcesManager) {
		protocol.killedPlayerIds.forEach(p => {
			let player = manager.players.find(pp => pp.id == p);
			if (player) {
				player.dispose(manager);
			}
		});

		this._isSightEnd = protocol.isSightEnd;

		if (!this._isEnd && protocol.isEnd) {
			if (this._attackPROT.attackPlayerId == manager.currPlayer.id) {
				if (protocol.attackedPlayerIds.length > 0)
					manager.shooingInAimEffect = new attackInAimEffect('击中', '#fff');
				if (protocol.killedPlayerIds.length > 0)
					manager.shooingInAimEffect = new attackInAimEffect('击杀', '#FF5433');
			}
			if (protocol.attackedPlayerIds.find(p => p == manager.currPlayer.id)) {
				manager.attackedEffects.push(new attackedEffect(this._attackPROT.angle + Math.PI));
			}
			if (this._attackPROT.attackType == config.weapon.attackType.gun && this._attackPROT.weaponType == config.weapon.gun.type.rocket) {
				manager.explodes.push(new explode(protocol.bulletPosition));
			}
			this._isEnd = true;
		}

		this._bulletPosition = protocol.bulletPosition;

		this._attackPROT.playerIdsInSight = protocol.playerIdsInSight;
		this._attackedPlayerIds = protocol.attackedPlayerIds;
	}

	draw(ctx: CanvasRenderingContext2D, manager: resourcesManager) {
		this._draw(ctx, () => {
			if (this._isEnd && this._fadeOutTime <= 0) {
				this.dispose(manager);
			}
			if (!this._isSightEnd && this._attackPROT.sightRadius > 0) {
				ctx.save();

				// 绘制射击可见区域中所有玩家
				ctx.beginPath();
				ctx.arc(this._attackPROT.position.x, this._attackPROT.position.y,
					this._attackPROT.sightRadius - 1, 0, Math.PI * 2);
				ctx.clip();

				manager.drawPlayersById(ctx, this._attackPROT.playerIdsInSight, '#fff', '#f00');

				ctx.restore();

				// 绘制射击可见区域
				ctx.beginPath();
				ctx.fillStyle = 'rgba(255,255,0,0.25)';
				ctx.strokeStyle = 'rgba(255,255,0,0.25)';
				ctx.lineWidth = 3;
				ctx.arc(this._attackPROT.position.x, this._attackPROT.position.y,
					this._attackPROT.sightRadius, 0, Math.PI * 2);
				ctx.fill();
			}

			if (this._fadeOutTime >= 15) {
				// 绘制子弹
				ctx.beginPath();
				if (this._attackPROT.attackType == config.weapon.attackType.gun) {
					ctx.strokeStyle = '#fff';
				} else if (this._attackPROT.attackType == config.weapon.attackType.melee) {
					ctx.strokeStyle = '#00f';
				}

				ctx.lineWidth = 4;
				ctx.moveTo(this._bulletPosition.x - 10 * Math.cos(this._attackPROT.angle),
					this._bulletPosition.y - 10 * Math.sin(this._attackPROT.angle));
				ctx.lineTo(this._bulletPosition.x + 10 * Math.cos(this._attackPROT.angle),
					this._bulletPosition.y + 10 * Math.sin(this._attackPROT.angle));
				ctx.stroke();
			}

			ctx.beginPath();
			if (this._isEnd) {
				ctx.strokeStyle = `rgba(255,255,255,${--this._fadeOutTime / 80})`;
			} else {
				ctx.strokeStyle = 'rgba(255,255,255,.25)';
			}

			ctx.lineWidth = 4;
			ctx.moveTo(this._attackPROT.position.x, this._attackPROT.position.y);
			ctx.lineTo(this._bulletPosition.x, this._bulletPosition.y);
			ctx.stroke();
		});
	}

	dispose(manager: resourcesManager) {
		this._dispose();

		let i = manager.attackCaches.findIndex(pp => pp == this);
		if (i != -1)
			manager.attackCaches.splice(i, 1);
	}
}

class explode extends resource {
	private _position: point;
	private _timeout = 20;

	constructor(position: point) {
		super();

		this._position = position;
	}

	draw(ctx: CanvasRenderingContext2D, manager: resourcesManager) {
		this._draw(ctx, () => {
			ctx.fillStyle = `rgba(255,0,0,${this._timeout / 20})`;

			ctx.beginPath();
			let setting = config.weapon.gun.defaultSettings.get(config.weapon.gun.type.rocket);
			if (setting) {
				ctx.arc(this._position.x, this._position.y, setting.damageRanges[setting.damageRanges.length - 1].radius, 0, Math.PI * 2);
			}

			ctx.fill();
		});

		if (--this._timeout <= 0) {
			this.dispose(manager);
		}
	}

	dispose(manager: resourcesManager) {
		this._dispose();
		let i = manager.explodes.findIndex(p => p == this);
		if (i != -1)
			manager.explodes.splice(i);
	}
}

/**被击中效果 */
class attackedEffect extends resource {
	private _angle: number;
	private _timeout = 10;

	constructor(angle: number) {
		super();

		this._angle = angle;
	}
	draw(ctx: CanvasRenderingContext2D) {
		this._draw(ctx, () => {
			ctx.strokeStyle = '#f00';
			ctx.lineWidth = 5;
			ctx.beginPath();
			ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, 50, this._angle - Math.PI / 32, this._angle + Math.PI / 32);
			ctx.stroke();
		});

		if (--this._timeout <= 0) {
			this._dispose();
		}
	}
}

/**击中效果 */
class attackInAimEffect extends resource {
	private _fontsize = 40;
	private _timeout = 50;
	private _text: string;
	private _color: string;

	constructor(text: string, color: string) {
		super();

		this._text = text;
		this._color = color;
	}

	draw(ctx: CanvasRenderingContext2D) {

		this._draw(ctx, () => {
			console.log(this._text)
			ctx.font = `${this._fontsize}px 微软雅黑`;
			ctx.textAlign = 'center';
			ctx.fillStyle = this._color;
			ctx.fillText(this._text, ctx.canvas.width / 2, 50);
		});

		if (--this._timeout <= 0) {
			this._dispose();
		}
	}
}