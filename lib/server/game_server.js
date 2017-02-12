"use strict";
const websocket = require("ws");
const log_1 = require("./log");
const game_core_1 = require("./game_core");
const sessionParser_1 = require("./sessionParser");
const config = require("../shared/game_config");
const fromClientPROT = require("../shared/ws_prot_from_client");
const toClientPROT = require("../shared/ws_prot_to_client");
class gameServer {
    /**
     * 发送和接收WebSocket信息，提交和处理后台游戏逻辑
     *
     * @param ip WebSocket IP地址
     * @param port WebSocket端口号
     */
    constructor(ip, port) {
        /**用户Socket键值对 */
        this._socketPlayerColl = [];
        this._initializeGameCore();
        let wss = new websocket.Server({
            port: port
        }, () => {
            log_1.main.info(`WebSocket Server is listening on ${ip}:${port}`);
        }).on('connection', socket => {
            this._onWebSocketConnection(socket);
        });
    }
    _onWebSocketConnection(socket) {
        let req = socket.upgradeReq;
        sessionParser_1.sessionParser(req, {}, () => {
            // 用户登录的用户id
            let userId = req.session['userId'];
            let sessionId = req.sessionID;
            if (userId) {
            }
            else {
                let pair = this._socketPlayerColl.find(p => p.sessionId == sessionId);
                if (pair) {
                    log_1.game.info(`anonymouse user reconnected - ${req.connection.remoteAddress}`);
                    this._closeSocket(pair.socket);
                    pair.socket = socket;
                    if (pair.playerId)
                        this._gameCore.removePlayer(pair.playerId);
                }
                else {
                    log_1.game.info(`anonymouse user connected - ${req.connection.remoteAddress}`);
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
                this._gameCore.removePlayer(pair.playerId);
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
            let newPlayerId = this._gameCore.addNewPlayer(protocol.name);
            pair.playerId = newPlayerId;
            log_1.game.info(`player [${pair.playerId}]: ${protocol.name} added in game`);
            this._send(JSON.stringify(this._gameCore.getInitPROT(newPlayerId)), socket);
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
}
let args = process.argv.splice(2);
new gameServer(args[0], parseInt(args[1]));
//# sourceMappingURL=game_server.js.map