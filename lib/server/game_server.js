"use strict";
const websocket = require("ws");
const game_core_1 = require("./game_core");
const fromClientPROT = require("../shared/ws_prot_from_client");
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
        this._socketPlayerColl.push({
            sessionId: '',
            socket: socket
        });
        socket.on('message', message => {
            let protocol = JSON.parse(message);
            switch (protocol.type) {
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
                case fromClientPROT.type.shoot:
                    this._onShoot(protocol, socket);
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
            if (pair) {
                console.log(`player ${pair.playerId} disconnected`);
                pair.playerId = undefined;
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
            let [newPlayerId, initPROT] = this._gameCore.addNewPlayer(protocol.name);
            pair.playerId = newPlayerId;
            this._send(JSON.stringify(initPROT), socket);
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
            this._gameCore.shoot(pair.playerId);
        }
    }
    _send(msg, socket) {
        if (socket.readyState == websocket.OPEN) {
            socket.send(msg);
        }
    }
    _initializeGameCore() {
        this._gameCore = new game_core_1.gameCore();
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
exports.gameServer = gameServer;
//# sourceMappingURL=game_server.js.map