import * as fromClientPROT from '../shared/ws_prot_from_client';
import * as toClientPROT from '../shared/ws_prot_to_client';
import * as config from '../shared/game_config';
import { domManager } from './dom_manager';
import { render } from './render';
import * as vueData from './vue_data';

export class gameCore {
	private _domManager: domManager;

	private _isGameOn = false;
	private _sendFunc: (protocol: fromClientPROT.baseProtocol) => void;
	private _send(protocol: fromClientPROT.baseProtocol) {
		if (this._isGameOn || protocol.type == fromClientPROT.type.ping) {
			this._sendFunc(protocol);
		}
	}

	private _canvas = document.querySelector('#stage') as HTMLCanvasElement;
	private _pingTime: Date;
	private _render: render;

	constructor(sendFunc: (protocol: fromClientPROT.baseProtocol) => void, domManager: domManager) {
		this._sendFunc = sendFunc;
		this._domManager = domManager;

		this._initlializeCanvasEvents();

		let ctx = this._canvas.getContext('2d') as CanvasRenderingContext2D;
		let reqAnimation = () => {
			window.requestAnimationFrame(() => {
				if (this._isGameOn)
					this._render.draw(ctx);
				reqAnimation();
			});
		}
		reqAnimation();
	}

	protocolReceived(protocol: toClientPROT.baseProtocol) {
		switch (protocol.type) {
			case toClientPROT.type.pong:
				let now = new Date();
				let ping = now.getTime() - this._pingTime.getTime();
				vueData.index.ping = ping;
				setTimeout(() => {
					this._sendPing();
				}, 1000);
				break;
			case toClientPROT.type.init:
				this._onInitialize(protocol as toClientPROT.initialize);
				this._domManager.gameStarted();
				break;
			case toClientPROT.type.main:
				this._onMainPROT(protocol as toClientPROT.mainPROT);
				break;
			case toClientPROT.type.gameOver:
				this._isGameOn = false;
				this._domManager.gameOver(protocol as toClientPROT.gameOver);
				break;
		}
	}

	private _initlializeCanvasEvents() {
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

			this._send(new fromClientPROT.rotate(angle));
		});

		let isRunning = false,
			isCombatting = false;
		this._canvas.addEventListener('keydown', e => {
			if (e.keyCode == 32) {
				this._send(new fromClientPROT.stopMoving(true));
			}
			if (!isRunning && e.keyCode == 87) {
				isRunning = true;
				this._send(new fromClientPROT.startRunning(true));
			}
			if (!isCombatting && e.keyCode == 70) {
				isCombatting = true;
				this._send(new fromClientPROT.startCombat(true));
			}
			if (e.keyCode == 88) {
				this._send(new fromClientPROT.useProp());
			}
		});

		this._canvas.addEventListener('keyup', e => {
			if (e.keyCode == 32) {
				this._send(new fromClientPROT.stopMoving(false));
			}
			if (e.keyCode == 87) {
				isRunning = false;
				this._send(new fromClientPROT.startRunning(false));
			}
			if (e.keyCode == 70) {
				isCombatting = false;
				this._send(new fromClientPROT.startCombat(false));
			}
		});

		this._canvas.addEventListener('blur', e => {
			this._send(new fromClientPROT.stopMoving(true));
			this._send(new fromClientPROT.startShoot(false));
		});

		this._canvas.addEventListener('mouseout', e => {
			this._send(new fromClientPROT.stopMoving(true));
			this._send(new fromClientPROT.startShoot(false));
		});

		this._canvas.addEventListener('mouseover', e => {
			this._send(new fromClientPROT.stopMoving(false));
		});

		this._canvas.addEventListener('mousedown', e => {
			this._send(new fromClientPROT.startShoot(true));
		});
		this._canvas.addEventListener('mouseup', e => {
			this._send(new fromClientPROT.startShoot(false));
		});
	}

	private _onInitialize(protocol: toClientPROT.initialize) {
		this._canvas.focus();
		this._render = new render(protocol);
		this._isGameOn = true;
		this._sendPing();
	}

	private _sendPing() {
		this._pingTime = new Date();
		this._send(new fromClientPROT.pingProtocol());
	}

	private _onMainPROT(protocol: toClientPROT.mainPROT) {
		vueData.index.rankList = [];
		protocol.rankList.forEach(p => {
			let player = this._render.getPlayerBPROT(p.id);
			if (player)
				vueData.index.rankList.push({
					name: player.name,
					killTimes: p.killTimes
				});
		});

		this._render.onMainProtocol(protocol);
	}
}