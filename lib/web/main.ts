import * as toastr from 'toastr';

import * as fromClientPROT from '../shared/ws_prot_from_client';
import * as toClientPROT from '../shared/ws_prot_to_client';

import * as vueData from './vue_data';

import { domManager } from './dom_manager';
import { gameCore } from './game_core';

class main {
	private _ws: WebSocket;
	private _gameCore: gameCore;

	private _dataLengthPerSec: number = 0;

	constructor() {
		let dm = new domManager(this._connectWebSocketServer.bind(this));
		this._gameCore = new gameCore(this._send.bind(this), dm);

		setInterval(() => {
			vueData.index.dataLengthPerSec = parseFloat((this._dataLengthPerSec / 1024).toFixed(2));
			this._dataLengthPerSec = 0;
		}, 1000);
	}

	private _connectWebSocketServer() {
		if (vueData.indexCommon.activeWebSocket) {
			let url = `ws://${vueData.indexCommon.activeWebSocket.ip}:${vueData.indexCommon.activeWebSocket.port}/`;
			if (this._ws == null) {
				this._connect(url);
			} else if (this._ws.url != url) {
				this._ws.close();
				this._connect(url);
			} else {
				this._send(new fromClientPROT.initialize(vueData.indexCommon.name));
			}
		}
	}

	private _connect(url: string) {
		this._ws = new WebSocket(url);
		toastr.info('正在连接服务器...');

		this._ws.onopen = () => {
			toastr.clear();
			toastr.success('服务器连接成功');
			this._send(new fromClientPROT.initialize(vueData.gameInitModal.common.name));
		};

		this._ws.onmessage = (e) => {
			this._dataLengthPerSec += e.data.length;
			let protocol = JSON.parse(e.data);
			this._gameCore.protocolReceived(protocol);
		};

		this._ws.onclose = this._ws.onerror = () => {
			toastr.error('服务器断开连接');
		};
	}

	private _send(protocol: fromClientPROT.baseProtocol) {
		if (this._ws && this._ws.readyState == WebSocket.OPEN)
			this._ws.send(JSON.stringify(protocol));
	}
}

new main();