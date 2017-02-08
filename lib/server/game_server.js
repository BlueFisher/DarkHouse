"use strict";
const websocket = require("ws");
const log_1 = require("./log");
const game_core_1 = require("./game_core");
const config = require("../shared/game_config");
const fromClientPROT = require("../shared/ws_prot_from_client");
const toClientPROT = require("../shared/ws_prot_to_client");
class gameServer {
    /**
     * 发送和接收WebSocket信息，提交和处理后台游戏逻辑
     *
     * @param ip WebSocket IP地址
     * @param port WebSocket端口号
     * @param sessionParser Session处理器
     * @param callback 监听成功回调函数
     */
    constructor(ip, port, sessionParser, callback) {
        /**用户Socket键值对 */
        this._socketPlayerColl = [];
        this.ip = ip;
        this.port = port;
        this._sessionParser = sessionParser;
        this._initializeGameCore();
        let wss = new websocket.Server({
            port: port
        }, () => {
            if (callback)
                callback();
        }).on('connection', socket => {
            this._onWebSocketConnection(socket);
        });
    }
    _onWebSocketConnection(socket) {
        let req = socket.upgradeReq;
        this._sessionParser(req, {}, () => {
            // 用户登录的用户id
            let userId = req.session['userId'];
            let sessionId = req.sessionID;
            if (userId) {
                let pairUser = this._socketPlayerColl.find(p => p.userId == userId);
                if (pairUser) {
                    log_1.logger.info(`user ${userId} reconnected`);
                    this._closeSocket(pairUser.socket);
                    pairUser.sessionId = sessionId;
                    pairUser.socket = socket;
                }
                else {
                    let pairSession = this._socketPlayerColl.find(p => p.sessionId == sessionId);
                    if (pairSession) {
                        log_1.logger.info(`user ${userId} connected in existed session ${sessionId}`);
                        this._closeSocket(pairSession.socket);
                        if (pairSession.userId != userId) {
                            delete pairSession.userId;
                        }
                        pairSession.userId = userId;
                        pairSession.socket = socket;
                    }
                    else {
                        log_1.logger.info(`user ${userId} connected`);
                        this._socketPlayerColl.push({
                            userId: userId,
                            sessionId: sessionId,
                            socket: socket
                        });
                    }
                }
            }
            else {
                let pair = this._socketPlayerColl.find(p => p.sessionId == sessionId);
                if (pair) {
                    if (pair.userId) {
                        log_1.logger.info(`anonymouse user reconnected in existed user ${pair.userId}`);
                        this._closeSocket(pair.socket);
                        delete pair.userId;
                        pair.socket = socket;
                        delete pair.playerId;
                    }
                    else {
                        log_1.logger.info(`anonymouse user reconnected`);
                        this._closeSocket(pair.socket);
                        pair.socket = socket;
                    }
                }
                else {
                    log_1.logger.info(`anonymouse user connected`);
                    this._socketPlayerColl.push({
                        sessionId: sessionId,
                        socket: socket
                    });
                }
            }
        });
        socket.on('message', message => {
            let protocol = JSON.parse(message);
            switch (protocol.type) {
                case fromClientPROT.type.ping:
                    this._send(JSON.stringify(new toClientPROT.pongProtocol()), socket);
                    break;
                case fromClientPROT.type.init:
                    this._onInitialize(protocol, socket);
                    break;
                case fromClientPROT.type.startRunning:
                    this._onStartRunning(protocol, socket);
                    break;
                case fromClientPROT.type.stopMoving:
                    this._onStopMoving(protocol, socket);
                    break;
                case fromClientPROT.type.rotate:
                    this._onRotate(protocol, socket);
                    break;
                case fromClientPROT.type.startShooting:
                    this._onShoot(protocol, socket);
                    break;
                case fromClientPROT.type.startCombat:
                    this._onCombat(protocol, socket);
                    break;
            }
        });
        socket.on('error', () => {
            onSocketClose(socket);
        });
        socket.on('close', () => {
            onSocketClose(socket);
        });
        let onSocketClose = (socket) => {
            let pair = this._socketPlayerColl.find(p => p.socket == socket);
            if (pair && pair.playerId) {
                console.log(`player ${pair.playerId} disconnected`);
                this._gameCore.playerDisconnected(pair.playerId);
            }
        };
    }
    _closeSocket(socket) {
        if (socket.readyState == websocket.OPEN) {
            socket.close();
        }
    }
    _onInitialize(protocol, socket) {
        let pair = this._socketPlayerColl.find(p => p.socket == socket);
        if (pair) {
            let currPlayerId;
            if (pair.playerId && protocol.resumeGame && this._gameCore.isPlayerOnGame(pair.playerId)) {
                currPlayerId = pair.playerId;
                this._gameCore.playerReconnected(currPlayerId);
                log_1.logger.info(`player ${pair.playerId} resume game`);
            }
            else {
                let newPlayerId = this._gameCore.addNewPlayer(protocol.name);
                currPlayerId = pair.playerId = newPlayerId;
                log_1.logger.info(`player ${pair.playerId} added in game`);
            }
            this._send(JSON.stringify(this._gameCore.getInitPROT(currPlayerId)), socket);
        }
    }
    _onStartRunning(protocol, socket) {
        let pair = this._socketPlayerColl.find(p => p.socket == socket);
        if (pair && pair.playerId) {
            this._gameCore.startRunning(pair.playerId, protocol.active);
        }
    }
    _onStopMoving(protocol, socket) {
        let pair = this._socketPlayerColl.find(p => p.socket == socket);
        if (pair && pair.playerId) {
            this._gameCore.stopMoving(pair.playerId, protocol.active);
        }
    }
    _onRotate(protocol, socket) {
        let pair = this._socketPlayerColl.find(p => p.socket == socket);
        if (pair && pair.playerId) {
            this._gameCore.rotate(pair.playerId, protocol.angle);
        }
    }
    _onShoot(protocol, socket) {
        let pair = this._socketPlayerColl.find(p => p.socket == socket);
        if (pair && pair.playerId) {
            this._gameCore.startShooting(pair.playerId, protocol.active);
        }
    }
    _onCombat(protocol, socket) {
        let pair = this._socketPlayerColl.find(p => p.socket == socket);
        if (pair && pair.playerId) {
            this._gameCore.startCombat(pair.playerId, protocol.active);
        }
    }
    _send(msg, socket) {
        if (socket.readyState == websocket.OPEN) {
            socket.send(msg);
        }
    }
    _initializeGameCore() {
        this._gameCore = new game_core_1.gameCore(config.stage.width, config.stage.height);
        this._gameCore.on(game_core_1.gameCore.events.sendToPlayers, (map) => {
            map.forEach((v, k) => {
                let spMap = this._socketPlayerColl.find(p => p.playerId == k);
                if (spMap) {
                    this._send(JSON.stringify(v), spMap.socket);
                }
            });
        });
        this._gameCore.on(game_core_1.gameCore.events.gameOver, (playerId, protocol) => {
            let spMap = this._socketPlayerColl.find(p => p.playerId == playerId);
            if (spMap) {
                this._send(JSON.stringify(protocol), spMap.socket);
            }
        });
    }
    isPlayerOnGame(userId, sessionId) {
        if (userId) {
            let pairUser = this._socketPlayerColl.find(p => p.userId == userId);
            if (pairUser) {
                return pairUser.playerId != undefined && this._gameCore.isPlayerOnGame(pairUser.playerId);
            }
            else {
                let pairSession = this._socketPlayerColl.find(p => p.sessionId == sessionId);
                if (pairSession) {
                    if (pairSession.userId != userId) {
                        return false;
                    }
                    return pairSession.playerId != undefined && this._gameCore.isPlayerOnGame(pairSession.playerId);
                }
                else {
                    return false;
                }
            }
        }
        else {
            let pair = this._socketPlayerColl.find(p => p.sessionId == sessionId);
            if (pair && !pair.userId) {
                return pair.playerId != undefined && this._gameCore.isPlayerOnGame(pair.playerId);
            }
            else {
                return false;
            }
        }
    }
}
exports.gameServer = gameServer;
//# sourceMappingURL=game_server.js.map