"use strict";
const fromClientPROT = require("../shared/ws_prot_from_client");
const toClientPROT = require("../shared/ws_prot_to_client");
const render_1 = require("./render");
const vueData = require("./vue_data");
class gameCore {
    constructor(sendFunc, domManager) {
        this._isGameOn = false;
        this._canvas = document.querySelector('#stage');
        this._sendFunc = sendFunc;
        this._domManager = domManager;
        this._initlializeCanvasEvents();
        let ctx = this._canvas.getContext('2d');
        let reqAnimation = () => {
            window.requestAnimationFrame(() => {
                if (this._isGameOn)
                    this._render.draw(ctx);
                reqAnimation();
            });
        };
        reqAnimation();
    }
    _send(protocol) {
        if (this._isGameOn || protocol.type == fromClientPROT.type.ping) {
            this._sendFunc(protocol);
        }
    }
    protocolReceived(protocol) {
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
                this._onInitialize(protocol);
                break;
            case toClientPROT.type.main:
                this._onMainPROT(protocol);
                break;
            case toClientPROT.type.gameOver:
                this._isGameOn = false;
                this._domManager.gameOver(protocol);
                break;
        }
    }
    _initlializeCanvasEvents() {
        this._canvas.addEventListener('mousemove', e => {
            let point = {
                x: e.pageX - this._canvas.offsetLeft,
                y: e.pageY - this._canvas.offsetTop
            };
            let x = point.x - this._canvas.width / 2;
            let y = point.y - this._canvas.height / 2;
            let angle;
            if (x == 0) {
                if (y >= 0) {
                    angle = 1 / 2 * Math.PI;
                }
                else {
                    angle = 3 / 2 * Math.PI;
                }
            }
            else {
                angle = Math.atan(y / x);
                if (x < 0) {
                    angle = Math.PI + angle;
                }
                else if (x > 0 && y < 0) {
                    angle = 2 * Math.PI + angle;
                }
            }
            this._send(new fromClientPROT.rotate(angle));
        });
        this._canvas.addEventListener('keydown', e => {
            if (e.keyCode == 32) {
                this._send(new fromClientPROT.stopMoving(true));
            }
            if (e.keyCode == 87) {
                this._send(new fromClientPROT.startRunning(true));
            }
            if (e.keyCode == 70) {
                this._send(new fromClientPROT.startCombat(true));
            }
        });
        this._canvas.addEventListener('keyup', e => {
            if (e.keyCode == 32) {
                this._send(new fromClientPROT.stopMoving(false));
            }
            if (e.keyCode == 87) {
                this._send(new fromClientPROT.startRunning(false));
            }
            if (e.keyCode == 70) {
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
    _onInitialize(protocol) {
        this._canvas.focus();
        this._render = new render_1.render(protocol);
        this._isGameOn = true;
        this._sendPing();
    }
    _sendPing() {
        this._pingTime = new Date();
        this._send(new fromClientPROT.pingProtocol());
    }
    _onMainPROT(protocol) {
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
exports.gameCore = gameCore;
//# sourceMappingURL=game_core.js.map