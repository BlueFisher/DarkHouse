"use strict";
const fromClientPROT = require("../shared/ws_prot_from_client");
const toClientPROT = require("../shared/ws_prot_to_client");
const config = require("../shared/game_config");
const vueData = require("./vue_data");
class gameCore {
    constructor(sendFunc, domManager) {
        this._isGameOn = false;
        this._canvas = document.querySelector('#stage');
        this._playerBasicPROTs = [];
        this._barricades = [];
        this._sendFunc = sendFunc;
        this._domManager = domManager;
        this._initlializeCanvasEvents();
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
            let protocol = new fromClientPROT.rotate(angle);
            this._send(protocol);
        });
        this._canvas.addEventListener('keydown', e => {
            if (e.keyCode == 32) {
                let protocol = new fromClientPROT.stopMoving(true);
                this._send(protocol);
            }
            if (e.keyCode == 87) {
                let protocol = new fromClientPROT.startRunning(true);
                this._send(protocol);
            }
        });
        this._canvas.addEventListener('keyup', e => {
            if (e.keyCode == 32) {
                let protocol = new fromClientPROT.stopMoving(false);
                this._send(protocol);
            }
            if (e.keyCode == 87) {
                let protocol = new fromClientPROT.startRunning(false);
                this._send(protocol);
            }
        });
        this._canvas.addEventListener('blur', e => {
            let protocol = new fromClientPROT.stopMoving(true);
            this._send(protocol);
        });
        this._canvas.addEventListener('mouseout', e => {
            let protocol = new fromClientPROT.stopMoving(true);
            this._send(protocol);
        });
        this._canvas.addEventListener('click', e => {
            this._sendFunc(new fromClientPROT.shoot());
        });
        let reqAnimation = () => {
            window.requestAnimationFrame(() => {
                this._draw();
                reqAnimation();
            });
        };
        reqAnimation();
    }
    _onInitialize(protocol) {
        this._canvas.focus();
        this._currentPlayerId = protocol.currPlayerId;
        this._playerBasicPROTs = protocol.players;
        this._barricades = protocol.barricades;
        this._isGameOn = true;
        this._sendPing();
    }
    _sendPing() {
        this._pingTime = new Date();
        this._send(new fromClientPROT.pingProtocol());
    }
    _onMainPROT(protocol) {
        this._mainPROTCache = protocol;
        protocol.newPlayerBPROTs.forEach(p => {
            this._playerBasicPROTs.push(p);
        });
    }
    _getPlayerPROT(playerId) {
        return this._mainPROTCache.playerBPROTs.find(p => p.id == playerId);
    }
    _drawPlayer(ctx, playerIds, fillStyle, strokeStyle) {
        ctx.save();
        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.textAlign = 'center';
        for (let playerId of playerIds) {
            let player = this._getPlayerPROT(playerId);
            if (!player)
                continue;
            ctx.beginPath();
            ctx.arc(player.position.x, player.position.y, config.player.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(player.position.x, player.position.y);
            ctx.lineTo(config.player.radius * Math.cos(player.angle) + player.position.x, config.player.radius * Math.sin(player.angle) + player.position.y);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(0,255,0,.5)';
            ctx.lineWidth = 3;
            let gap = Math.PI / 25;
            let perimeter = Math.PI * 2 - config.player.maxHp * gap;
            for (let i = 0; i < player.hp; i++) {
                ctx.beginPath();
                ctx.arc(player.position.x, player.position.y, config.player.radius - 1.5, i * perimeter / config.player.maxHp + i * gap - Math.PI / 2, (i + 1) * perimeter / config.player.maxHp + i * gap - Math.PI / 2);
                ctx.stroke();
            }
            let playerBasic = this._playerBasicPROTs.find(p => player != null && p.id == player.id);
            if (playerBasic) {
                ctx.fillText(playerBasic.name, player.position.x, player.position.y + config.player.radius + 15);
            }
        }
        ctx.restore();
    }
    _draw() {
        if (!this._isGameOn || !this._mainPROTCache)
            return;
        let ctx = this._canvas.getContext('2d');
        ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        let currPlayer = this._getPlayerPROT(this._mainPROTCache.currPlayerId);
        ctx.save();
        if (currPlayer)
            ctx.setTransform(1.5, 0, 0, 1.5, this._canvas.width / 2 - currPlayer.position.x * 1.5, this._canvas.height / 2 - currPlayer.position.y * 1.5);
        // 绘制障碍物
        ctx.fillStyle = '#111';
        for (let barricade of this._barricades) {
            ctx.fillRect(barricade.point1.x, barricade.point1.y, barricade.point2.x - barricade.point1.x, barricade.point2.y - barricade.point1.y);
        }
        ctx.fillStyle = '#f00';
        for (let propHp of this._mainPROTCache.propHpPROTs) {
            ctx.beginPath();
            ctx.arc(propHp.position.x, propHp.position.y, config.hp.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        // 绘制可见区域
        ctx.save();
        // 绘制可见区域中所有玩家
        ctx.beginPath();
        if (currPlayer)
            ctx.arc(currPlayer.position.x, currPlayer.position.y, config.player.sightRadius - 1, 0, Math.PI * 2);
        ctx.clip();
        this._drawPlayer(ctx, this._mainPROTCache.playerIdsInSight, '#fff', '#f00');
        // 绘制可见区域中所有障碍物
        ctx.fillStyle = '#fff';
        for (let barricade of this._barricades) {
            ctx.fillRect(barricade.point1.x, barricade.point1.y, barricade.point2.x - barricade.point1.x, barricade.point2.y - barricade.point1.y);
        }
        ctx.restore();
        // 绘制可见区域光线
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        if (currPlayer)
            ctx.arc(currPlayer.position.x, currPlayer.position.y, config.player.sightRadius, 0, Math.PI * 2);
        ctx.fill();
        // 绘制本玩家
        this._drawPlayer(ctx, [this._mainPROTCache.currPlayerId], '#333', '#f00');
        // 绘制射击
        this._mainPROTCache.shootPROTs.forEach(shootPROT => {
            ctx.save();
            // 绘制射击可见区域中所有玩家
            ctx.beginPath();
            ctx.arc(shootPROT.position.x, shootPROT.position.y, config.player.shootingSightRadius - 1, 0, Math.PI * 2);
            ctx.clip();
            this._drawPlayer(ctx, shootPROT.playerIdsInSight, '#fff', '#f00');
            ctx.restore();
            if (shootPROT.shootedPlayerId) {
                this._drawPlayer(ctx, [shootPROT.shootedPlayerId], '#fff', '#f00');
            }
            // 绘制射击可见区域
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255,255,0,0.25)';
            ctx.strokeStyle = 'rgba(255,255,0,0.25)';
            ctx.lineWidth = 3;
            ctx.arc(shootPROT.position.x, shootPROT.position.y, config.player.shootingSightRadius, 0, Math.PI * 2);
            ctx.fill();
            // 绘制射击射线
            ctx.beginPath();
            ctx.moveTo(shootPROT.position.x, shootPROT.position.y);
            if (shootPROT.collisionPoint) {
                ctx.lineTo(shootPROT.collisionPoint.x, shootPROT.collisionPoint.y);
            }
            else {
                let d = Math.max(this._canvas.width, this._canvas.height);
                ctx.lineTo(shootPROT.position.x + d * Math.cos(shootPROT.angle), shootPROT.position.y + d * Math.sin(shootPROT.angle));
            }
            ctx.stroke();
        });
        // 绘制奔跑
        this._mainPROTCache.runningPROTs.forEach(runningPROT => {
            ctx.save();
            // 绘制奔跑范围视野中所有的玩家
            ctx.beginPath();
            ctx.arc(runningPROT.position.x, runningPROT.position.y, config.player.runningSightRadius - 1, 0, Math.PI * 2);
            ctx.clip();
            this._drawPlayer(ctx, runningPROT.playerIdsInSight, '#fff', '#f00');
            ctx.restore();
            // 绘制奔跑视野
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            ctx.arc(runningPROT.position.x, runningPROT.position.y, config.player.runningSightRadius, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }
}
exports.gameCore = gameCore;
//# sourceMappingURL=game_core.js.map