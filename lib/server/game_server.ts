import * as websocket from 'ws';
import * as express from 'express';

import { main as mainLogger, game as gameLogger } from './log';
import { gameCore } from './game_core';
import { sessionParser } from './sessionParser';

import * as config from '../shared/game_config';
import * as fromClientPROT from '../shared/ws_prot_from_client';
import * as toClientPROT from '../shared/ws_prot_to_client';

class gameServer {
	private _gameCore: gameCore;
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
	 */
	constructor(ip: string, port: number) {
		this._initializeGameCore();

		let wss = new websocket.Server({
			port: port
		}, () => {
			mainLogger.info(`WebSocket Server is listening on ${ip}:${port}`);
		}).on('connection', socket => {
			this._onWebSocketConnection(socket);
		});
	}

	private _onWebSocketConnection(socket: websocket) {
		let req = socket.upgradeReq as express.Request;

		sessionParser(req, <express.Response>{}, () => {
			// 用户登录的用户id
			let userId: string = (req.session as Express.Session)['userId'];
			let sessionId: string = req.sessionID as string;

			if (userId) {
				// TODO 等有用户登录注册功能加入
			} else {
				let pair = this._socketPlayerColl.find(p => p.sessionId == sessionId);
				if (pair) {
					gameLogger.info(`anonymouse user reconnected - ${req.connection.remoteAddress}`);
					this._closeSocket(pair.socket);
					pair.socket = socket;
					if (pair.playerId)
						this._gameCore.removePlayer(pair.playerId);
					// this._socketPlayerColl.push({
					// 	sessionId: sessionId,
					// 	socket: socket
					// });
				} else {
					gameLogger.info(`anonymouse user connected - ${req.connection.remoteAddress}`);
					this._socketPlayerColl.push({
						sessionId: sessionId,
						socket: socket
					});
				}
			}
		});

		socket.on('message', message => {
			let protocol: fromClientPROT.baseProtocol = JSON.parse(message);
			switch (protocol.type) {
				case fromClientPROT.type.ping:
					this._send(JSON.stringify(new toClientPROT.pongProtocol()), socket);
					break;
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
				case fromClientPROT.type.startShooting:
					this._onShoot(protocol as fromClientPROT.startShoot, socket);
					break;
				case fromClientPROT.type.startCombat:
					this._onCombat(protocol as fromClientPROT.startCombat, socket);
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
			if (pair && pair.playerId) {
				console.log(`player ${pair.playerId} disconnected`);
				this._gameCore.removePlayer(pair.playerId);
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
			let newPlayerId = this._gameCore.addNewPlayer(protocol.name);
			pair.playerId = newPlayerId;
			gameLogger.info(`player [${pair.playerId}]: ${protocol.name} added in game`);

			this._send(JSON.stringify(this._gameCore.getInitPROT(newPlayerId)), socket);
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

	private _onShoot(protocol: fromClientPROT.startShoot, socket: websocket) {
		let pair = this._socketPlayerColl.find(p => p.socket == socket);
		if (pair && pair.playerId) {
			this._gameCore.startShooting(pair.playerId, protocol.active);
		}
	}
	private _onCombat(protocol: fromClientPROT.startCombat, socket: websocket) {
		let pair = this._socketPlayerColl.find(p => p.socket == socket);
		if (pair && pair.playerId) {
			this._gameCore.startCombat(pair.playerId, protocol.active);
		}
	}

	private _send(msg: string, socket: websocket) {
		if (socket.readyState == websocket.OPEN) {
			socket.send(msg);
		}
	}

	private _initializeGameCore() {
		this._gameCore = new gameCore(config.stage.width, config.stage.height);
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

let args = process.argv.splice(2);
new gameServer(args[0], parseInt(args[1]));