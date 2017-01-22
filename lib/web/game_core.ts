import * as fromClientPROT from '../shared/ws_prot_from_client';
import * as toClientPROT from '../shared/ws_prot_to_client';
import * as config from '../shared/game_config';

export class gameCore {
	private _isGameOn = false;
	private _sendFunc: (protocol: fromClientPROT.baseProtocol) => void;
	private _send(protocol: fromClientPROT.baseProtocol) {
		if (this._isGameOn || protocol.type == fromClientPROT.type.init) {
			this._sendFunc(protocol);
		}
	}
	private _canvas = document.querySelector('#stage') as HTMLCanvasElement;

	private _currentPlayerBasicPROT: toClientPROT.playerBasicPROT;
	private _playerBasicPROTs: toClientPROT.playerBasicPROT[] = [];
	private _barricades: toClientPROT.barricadePROT[] = [];
	private _mainPROTCache: toClientPROT.mainPROT;

	constructor(sendFunc: (protocol: fromClientPROT.baseProtocol) => void) {
		this._sendFunc = sendFunc;

		this._initlializeCanvas();
		this._send(new fromClientPROT.initialize("Fisher"));
	}

	protocolReceived(protocol: toClientPROT.baseProtocol) {
		switch (protocol.type) {
			case toClientPROT.type.init:
				this._onInitialize(protocol as toClientPROT.initialize);
				break;
			case toClientPROT.type.main:
				this._onMainPROT(protocol as toClientPROT.mainPROT);
				break;
			case toClientPROT.type.gameOver:
				console.log('gameover');
				this._isGameOn = false;
				this._send(new fromClientPROT.initialize("Fisher R"));
				break;
		}
	}

	private _initlializeCanvas() {
		this._canvas.addEventListener('mousemove', e => {
			let point = {
				x: e.pageX - this._canvas.offsetLeft,
				y: e.pageY - this._canvas.offsetTop
			};

			let x = point.x - this._canvas.width / 2;
			let y = point.y - this._canvas.height / 2;
			let angle: number | undefined;
			if (x == 0) {
				if (y >= 0) {
					angle = 1 / 2 * Math.PI;
				} else {
					angle = 3 / 2 * Math.PI;
				}
			} else {
				angle = Math.atan(y / x);
				if (x < 0) {
					angle = Math.PI + angle;
				} else if (x > 0 && y < 0) {
					angle = 2 * Math.PI + angle;
				}
			}

			let protocol = new fromClientPROT.rotate(angle);
			this._send(protocol);
		});

		this._canvas.addEventListener('keydown', e => {
			if (e.keyCode == 32) {
				let protocol = new fromClientPROT.stopMoving(true);
				this._send(protocol);
			}
			if (e.keyCode == 87) {
				let protocol = new fromClientPROT.startRunning(true);
				this._send(protocol);
			}
		});

		this._canvas.addEventListener('keyup', e => {
			if (e.keyCode == 32) {
				let protocol = new fromClientPROT.stopMoving(false);
				this._send(protocol);
			}
			if (e.keyCode == 87) {
				let protocol = new fromClientPROT.startRunning(false);
				this._send(protocol);
			}
		});

		this._canvas.addEventListener('blur', e => {
			let protocol = new fromClientPROT.stopMoving(true);
			this._send(protocol);
		});

		this._canvas.addEventListener('mouseout', e => {
			let protocol = new fromClientPROT.stopMoving(true);
			this._send(protocol);
		});

		this._canvas.addEventListener('click', e => {
			this._sendFunc(new fromClientPROT.shoot());
		});

		let reqAnimation = () => {
			window.requestAnimationFrame(() => {
				this._draw();
				reqAnimation();
			});
		}
		reqAnimation();
	}

	private _onInitialize(protocol: toClientPROT.initialize) {
		this._canvas.focus();
		this._currentPlayerBasicPROT = protocol.currPlayer;
		this._playerBasicPROTs = protocol.players;
		this._barricades = protocol.barricades;
		this._isGameOn = true;
	}

	private _onMainPROT(protocol: toClientPROT.mainPROT) {
		this._mainPROTCache = protocol;
		protocol.newPlayerBPROTs.forEach(p => {
			this._playerBasicPROTs.push(p);
		});
	}

	private _drawPlayer(ctx: CanvasRenderingContext2D,
		players: toClientPROT.playerPROT[], fillStyle: string, strokeStyle: string) {

		ctx.save();
		ctx.fillStyle = fillStyle;
		ctx.strokeStyle = strokeStyle;
		ctx.textAlign = 'center';

		for (let player of players) {
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

			let playerBasic = this._playerBasicPROTs.find(p => p.id == player.id);
			if (playerBasic) {
				ctx.fillText(playerBasic.name, player.position.x, player.position.y + config.player.radius + 15);
			}
		}

		ctx.restore();
	}

	private _draw() {
		if (!this._isGameOn || !this._mainPROTCache)
			return;

		let ctx = this._canvas.getContext('2d') as CanvasRenderingContext2D;
		ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

		let currPlayer = this._mainPROTCache.currPlayer;
		ctx.save();

		ctx.setTransform(1.5, 0, 0, 1.5,
			this._canvas.width / 2 - currPlayer.position.x * 1.5, this._canvas.height / 2 - currPlayer.position.y * 1.5);

		// 绘制障碍物
		ctx.fillStyle = '#111';
		for (let barricade of this._barricades) {
			ctx.fillRect(barricade.point1.x, barricade.point1.y,
				barricade.point2.x - barricade.point1.x, barricade.point2.y - barricade.point1.y);
		}

		ctx.fillStyle = '#f00';
		for (let propHp of this._mainPROTCache.propHpPROTs) {
			ctx.beginPath();
			ctx.arc(propHp.position.x, propHp.position.y, config.hp.radius, 0, Math.PI * 2);
			ctx.fill();
		}

		// 绘制可见区域
		ctx.save();

		// 绘制可见区域中所有玩家
		ctx.beginPath();
		ctx.arc(currPlayer.position.x, currPlayer.position.y, config.player.sightRadius - 1, 0, Math.PI * 2);
		ctx.clip();

		this._drawPlayer(ctx, this._mainPROTCache.playersInSight, '#fff', '#f00');

		// 绘制可见区域中所有障碍物
		ctx.fillStyle = '#fff';
		for (let barricade of this._barricades) {
			ctx.fillRect(barricade.point1.x, barricade.point1.y,
				barricade.point2.x - barricade.point1.x, barricade.point2.y - barricade.point1.y);
		}

		ctx.restore();

		// 绘制可见区域光线
		ctx.beginPath();
		ctx.fillStyle = 'rgba(255,255,255,0.25)';
		ctx.arc(currPlayer.position.x, currPlayer.position.y, config.player.sightRadius, 0, Math.PI * 2);
		ctx.fill();

		// 绘制本玩家
		this._drawPlayer(ctx, [currPlayer], '#333', '#f00');

		// 绘制射击
		this._mainPROTCache.shootPROTs.forEach(shootPROT => {
			ctx.save();

			// 绘制射击可见区域中所有玩家
			ctx.beginPath();
			ctx.arc(shootPROT.position.x, shootPROT.position.y, config.player.shootingSightRadius - 1, 0, Math.PI * 2);
			ctx.clip();

			this._drawPlayer(ctx, shootPROT.playersInSight, '#fff', '#f00');

			ctx.restore();

			if (shootPROT.shootedPlayer) {
				this._drawPlayer(ctx, [shootPROT.shootedPlayer], '#fff', '#f00');
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
				let d = Math.max(this._canvas.width, this._canvas.height);
				ctx.lineTo(shootPROT.position.x + d * Math.cos(shootPROT.angle),
					shootPROT.position.y + d * Math.sin(shootPROT.angle));
			}
			ctx.stroke();
		});

		this._mainPROTCache.runningPROTs.forEach(runningPROT => {
			ctx.save();

			ctx.beginPath();
			ctx.arc(runningPROT.position.x, runningPROT.position.y, config.player.runningSightRadius - 1, 0, Math.PI * 2);
			ctx.clip();

			this._drawPlayer(ctx, runningPROT.playersInSight, '#fff', '#f00');

			ctx.restore();

			ctx.beginPath();
			ctx.fillStyle = 'rgba(255,255,255,0.75)';
			ctx.arc(runningPROT.position.x, runningPROT.position.y, config.player.runningSightRadius, 0, Math.PI * 2);
			ctx.fill();
		});

		ctx.restore();
	}
}