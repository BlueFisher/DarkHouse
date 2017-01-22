import * as toastr from 'toastr';


import * as fromClientPROT from '../shared/ws_prot_from_client';
import * as toClientPROT from '../shared/ws_prot_to_client';

import { gameCore } from './game_core';

class main {
	private _ws: WebSocket;
	private _gameCore: gameCore;

	constructor() {
		this._connectWebSocket();
		

		adjustCanvasSize();
		window.onresize = () => {
			adjustCanvasSize();
		}

		function adjustCanvasSize() {
			let canvas = document.querySelector('#stage') as HTMLCanvasElement;
			canvas.height = window.innerHeight
			canvas.width = window.innerWidth;
		}
	}

	private _connectWebSocket() {
		let url = `ws://localhost:8080/`;
		this._connect(url);
	}
	private _connect(url: string) {
		this._ws = new WebSocket(url);
		toastr.info('正在连接服务器...');

		this._ws.onopen = () => {
			toastr.clear();
			toastr.success('服务器连接成功');
			this._gameCore = new gameCore(this._send.bind(this));
		};

		this._ws.onmessage = (e) => {
			let protocol = JSON.parse(e.data);
			this._gameCore.protocolReceived(protocol);
		};

		this._ws.onclose = this._ws.onerror = () => {
			toastr.error('服务器断开连接');
		};
	}

	private _send(protocol: fromClientPROT.baseProtocol) {
		this._ws.send(JSON.stringify(protocol));
	}
}

new main();