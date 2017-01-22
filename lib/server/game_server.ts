import * as websocket from 'ws';
import * as express from 'express';
import * as session from 'express-session';


import { gameCore } from './game_core';

import * as fromClientPROT from '../shared/ws_prot_from_client';
import * as toClientPROT from '../shared/ws_prot_to_client';

export class gameServer {
	readonly ip: string;
	readonly port: number;

	private _gameCore: gameCore;
	private _sessionParser: express.RequestHandler;
	/**用户Socket键值对 */
	private _socketPlayerColl: {
		userId?: string,
		sessionId: string,
		socket: websocket,
		playerId?: number
	}[] = [];

	/**
	 * 发送和接收WebSocket信息，提交和处理后台游戏逻辑
	 * 
	 * @param ip WebSocket IP地址
	 * @param port WebSocket端口号
	 * @param sessionParser Session处理器
	 * @param callback 监听成功回调函数
	 */
	constructor(ip: string, port: number, sessionParser: express.RequestHandler, callback?: () => void) {
		this.ip = ip;
		this.port = port;
		this._sessionParser = sessionParser;

		this._initializeGameCore();

		let wss = new websocket.Server({
			port: port
		}, () => {
			if (callback) callback();
		}).on('connection', socket => {
			this._onWebSocketConnection(socket);
		});
	}

	private _onWebSocketConnection(socket: websocket) {
		this._socketPlayerColl.push({
			sessionId: '',
			socket: socket
		});

		socket.on('message', message => {
			let protocol: fromClientPROT.baseProtocol = JSON.parse(message);
			switch (protocol.type) {
				case fromClientPROT.type.init:
					this._onInitialize(protocol as fromClientPROT.initialize, socket);
					break;
				case fromClientPROT.type.startRunning:
					this._onStartRunning(protocol as fromClientPROT.startRunning, socket);
					break;
				case fromClientPROT.type.stopMoving:
					this._onStopMoving(protocol as fromClientPROT.stopMoving, socket);
					break;
				case fromClientPROT.type.rotate:
					this._onRotate(protocol as fromClientPROT.rotate, socket);
					break;
				case fromClientPROT.type.shoot:
					this._onShoot(protocol as fromClientPROT.shoot, socket);
					break;
			}
		});

		socket.on('error', () => {
			onSocketClose(socket);
		});
		socket.on('close', () => {
			onSocketClose(socket);
		});

		let onSocketClose = (socket: websocket) => {
			let pair = this._socketPlayerColl.find(p => p.socket == socket);
			if (pair) {
				console.log(`player ${pair.playerId} disconnected`);
				pair.playerId = undefined;
			}
		}
	}

	private _closeSocket(socket: websocket) {
		if (socket.readyState == websocket.OPEN) {
			socket.close();
		}
	}

	private _onInitialize(protocol: fromClientPROT.initialize, socket: websocket) {
		let pair = this._socketPlayerColl.find(p => p.socket == socket);
		if (pair) {
			let [newPlayerId, initPROT] = this._gameCore.addNewPlayer(protocol.name);
			pair.playerId = newPlayerId;
			this._send(JSON.stringify(initPROT), socket);
		}
	}

	private _onStartRunning(protocol: fromClientPROT.startRunning, socket: websocket) {
		let pair = this._socketPlayerColl.find(p => p.socket == socket);
		if (pair && pair.playerId) {
			this._gameCore.startRunning(pair.playerId, protocol.active);
		}
	}

	private _onStopMoving(protocol: fromClientPROT.stopMoving, socket: websocket) {
		let pair = this._socketPlayerColl.find(p => p.socket == socket);
		if (pair && pair.playerId) {
			this._gameCore.stopMoving(pair.playerId, protocol.active);
		}
	}
	private _onRotate(protocol: fromClientPROT.rotate, socket: websocket) {
		let pair = this._socketPlayerColl.find(p => p.socket == socket);
		if (pair && pair.playerId) {
			this._gameCore.rotate(pair.playerId, protocol.angle);
		}
	}

	private _onShoot(protocol: fromClientPROT.shoot, socket: websocket) {
		let pair = this._socketPlayerColl.find(p => p.socket == socket);
		if (pair && pair.playerId) {
			this._gameCore.shoot(pair.playerId);
		}
	}

	private _send(msg: string, socket: websocket) {
		if (socket.readyState == websocket.OPEN) {
			socket.send(msg);
		}
	}

	private _initializeGameCore() {
		this._gameCore = new gameCore();
		this._gameCore.on(gameCore.events.sendToPlayers, (map: Map<number, toClientPROT.baseProtocol>) => {
			map.forEach((v, k) => {
				let spMap = this._socketPlayerColl.find(p => p.playerId == k);
				if (spMap) {
					this._send(JSON.stringify(v), spMap.socket);
				}
			});
		});
		this._gameCore.on(gameCore.events.gameOver, (playerId: number, protocol: toClientPROT.gameOver) => {
			let spMap = this._socketPlayerColl.find(p => p.playerId == playerId);
			if (spMap) {
				this._send(JSON.stringify(protocol), spMap.socket);
			}
		});
	}
}