import * as websocket from 'ws';
import * as express from 'express';
import * as session from 'express-session';

import { logger } from './log';
import { gameCore } from './game_core';

import * as config from '../shared/game_config';
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
		let req = socket.upgradeReq as express.Request;
		this._sessionParser(req, <express.Response>{}, () => {
			// 用户登录的用户id
			let userId: string = (req.session as Express.Session)['userId'];
			let sessionId: string = req.sessionID as string;

			if (userId) {
				let pairUser = this._socketPlayerColl.find(p => p.userId == userId);
				if (pairUser) {
					logger.info(`user ${userId} reconnected`);
					this._closeSocket(pairUser.socket);
					pairUser.sessionId = sessionId;
					pairUser.socket = socket;
				} else {
					let pairSession = this._socketPlayerColl.find(p => p.sessionId == sessionId);
					if (pairSession) {
						logger.info(`user ${userId} connected in existed session ${sessionId}`);
						this._closeSocket(pairSession.socket);
						if (pairSession.userId != userId) {
							delete pairSession.userId;
						}
						pairSession.userId = userId;
						pairSession.socket = socket;
					} else {
						logger.info(`user ${userId} connected`);
						this._socketPlayerColl.push({
							userId: userId,
							sessionId: sessionId,
							socket: socket
						});
					}
				}
			} else {
				let pair = this._socketPlayerColl.find(p => p.sessionId == sessionId);
				if (pair) {
					if (pair.userId) {
						logger.info(`anonymouse user reconnected in existed user ${pair.userId}`);
						this._closeSocket(pair.socket);
						delete pair.userId;
						pair.socket = socket;
						delete pair.playerId;
					} else {
						logger.info(`anonymouse user reconnected`);
						this._closeSocket(pair.socket);
						pair.socket = socket;
					}
				} else {
					logger.info(`anonymouse user connected`);
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
				this._gameCore.playerDisconnected(pair.playerId);
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
			let currPlayerId: number;

			if (pair.playerId && protocol.resumeGame && this._gameCore.isPlayerOnGame(pair.playerId)) {
				currPlayerId = pair.playerId;
				this._gameCore.playerReconnected(currPlayerId);
				logger.info(`player ${pair.playerId} resume game`);
			} else {
				let newPlayerId = this._gameCore.addNewPlayer(protocol.name);
				currPlayerId = pair.playerId = newPlayerId;
				logger.info(`player ${pair.playerId} added in game`);
			}

			this._send(JSON.stringify(this._gameCore.getInitPROT(currPlayerId)), socket);
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
		this._gameCore = new gameCore(config.stage.height, config.stage.width);
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

	isPlayerOnGame(userId: string, sessionId: string): boolean {
		if (userId) {
			let pairUser = this._socketPlayerColl.find(p => p.userId == userId);
			if (pairUser) {
				return pairUser.playerId != undefined && this._gameCore.isPlayerOnGame(pairUser.playerId);
			} else {
				let pairSession = this._socketPlayerColl.find(p => p.sessionId == sessionId);
				if (pairSession) {
					if (pairSession.userId != userId) {
						return false;
					}
					return pairSession.playerId != undefined && this._gameCore.isPlayerOnGame(pairSession.playerId);
				} else {
					return false;
				}
			}
		} else {
			let pair = this._socketPlayerColl.find(p => p.sessionId == sessionId);
			if (pair && !pair.userId) {
				return pair.playerId != undefined && this._gameCore.isPlayerOnGame(pair.playerId);
			} else {
				return false;
			}
		}
	}
}