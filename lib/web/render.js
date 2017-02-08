"use strict";
const config = require("../shared/game_config");
class render {
    constructor(protocol) {
        this._resourceManager = new resourcesManager();
        this._resourceManager.currentPlayerId = protocol.currPlayerId;
        this._resourceManager.playerBasicPROTs = protocol.players;
        this._resourceManager.edge = protocol.edge;
        this._resourceManager.barricades = protocol.barricades;
        this._resourceManager.propHps = protocol.propHps;
        this._resourceManager.propGuns = protocol.propGuns;
    }
    getPlayerBPROT(id) {
        return this._resourceManager.getPlayerBPROT(id);
    }
    onMainProtocol(protocol) {
        this._resourceManager.mainPROTCache = protocol;
        protocol.shootPROTs.forEach(p => {
            this._resourceManager.shootingCaches.push(new shootingCache(p));
        });
        protocol.duringShootingPROTs.forEach(p => {
            let cache = this._resourceManager.shootingCaches.find(pp => pp.id == p.id);
            if (cache)
                cache.onDuringShootingPROT(p, this._resourceManager);
        });
        protocol.newPlayerBPROTs.forEach(p => {
            this._resourceManager.playerBasicPROTs.push(p);
        });
        protocol.newPropHpPROTs.forEach(p => {
            this._resourceManager.propHps.push(p);
        });
        protocol.newPropGunPROTs.forEach(p => {
            this._resourceManager.propGuns.push(p);
        });
        protocol.removedPropHpIds.forEach(p => {
            let i = this._resourceManager.propHps.findIndex(pp => pp.id == p);
            if (i != -1)
                this._resourceManager.propHps.splice(i, 1);
        });
        protocol.removedPropGunIds.forEach(p => {
            let i = this._resourceManager.propGuns.findIndex(pp => pp.id == p);
            if (i != -1)
                this._resourceManager.propGuns.splice(i, 1);
        });
    }
    draw(ctx) {
        if (!this._resourceManager.mainPROTCache)
            return;
        let canvas = ctx.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let currPlayer = this._resourceManager.getPlayerPROT(this._resourceManager.currentPlayerId);
        if (!currPlayer)
            return;
        ctx.save();
        if (currPlayer)
            ctx.setTransform(1.5, 0, 0, 1.5, canvas.width / 2 - currPlayer.position.x * 1.5, canvas.height / 2 - currPlayer.position.y * 1.5);
        this._resourceManager.drawEdge(ctx);
        // 绘制障碍物
        ctx.fillStyle = '#111';
        for (let barricade of this._resourceManager.barricades) {
            ctx.fillRect(barricade.point1.x, barricade.point1.y, barricade.point2.x - barricade.point1.x, barricade.point2.y - barricade.point1.y);
        }
        // 绘制道具
        ctx.fillStyle = '#f00';
        for (let propHp of this._resourceManager.propHps) {
            ctx.beginPath();
            ctx.arc(propHp.position.x, propHp.position.y, config.hp.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#0f0';
        for (let propHp of this._resourceManager.propGuns) {
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
        this._resourceManager.drawPlayer(ctx, this._resourceManager.mainPROTCache.playerIdsInSight, '#fff', '#f00');
        // 绘制可见区域中所有障碍物
        ctx.fillStyle = '#fff';
        for (let barricade of this._resourceManager.barricades) {
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
        this._resourceManager.drawPlayer(ctx, [this._resourceManager.currentPlayerId], '#333', '#f00');
        // 绘制射击
        this._resourceManager.shootingCaches.forEach(cache => {
            cache.draw(ctx, this._resourceManager);
        });
        // 绘制奔跑
        this._resourceManager.mainPROTCache.runningPROTs.forEach(runningPROT => {
            ctx.save();
            // 绘制奔跑范围视野中所有的玩家
            ctx.beginPath();
            ctx.arc(runningPROT.position.x, runningPROT.position.y, config.player.runningSightRadius - 1, 0, Math.PI * 2);
            ctx.clip();
            this._resourceManager.drawPlayer(ctx, runningPROT.playerIdsInSight, '#fff', '#f00');
            ctx.restore();
            // 绘制奔跑视野
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            ctx.arc(runningPROT.position.x, runningPROT.position.y, config.player.runningSightRadius, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
        if (this._resourceManager.shooingInAimEffect)
            this._resourceManager.shooingInAimEffect.draw(ctx);
        this._resourceManager.shootedEffects.forEach(p => p.draw(ctx));
    }
}
exports.render = render;
class resourcesManager {
    constructor() {
        this.playerBasicPROTs = [];
        this.barricades = [];
        this.propHps = [];
        this.propGuns = [];
        this.shootedEffects = [];
        this.shootingCaches = [];
    }
    getPlayerPROT(playerId) {
        return this.mainPROTCache.playerPROTs.find(p => p.id == playerId);
    }
    getPlayerBPROT(playerId) {
        return this.playerBasicPROTs.find(p => p.id == playerId);
    }
    drawEdge(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = '#111';
        ctx.fillStyle = '#000';
        ctx.fillRect(this.edge.point1.x, this.edge.point1.y, this.edge.point2.x - this.edge.point1.x, this.edge.point2.y - this.edge.point1.y);
        ctx.strokeRect(this.edge.point1.x, this.edge.point1.y, this.edge.point2.x - this.edge.point1.x, this.edge.point2.y - this.edge.point1.y);
    }
    drawPlayer(ctx, playerIds, fillStyle, strokeStyle) {
        ctx.save();
        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.textAlign = 'center';
        for (let playerId of playerIds) {
            let player = this.getPlayerPROT(playerId);
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
            ctx.strokeStyle = 'rgba(0,0,0,.5)';
            ctx.lineWidth = 3;
            gap = Math.PI / 50;
            perimeter = Math.PI * 2 - player.maxBullet * gap;
            for (let i = 0; i < player.maxBullet; i++) {
                ctx.beginPath();
                ctx.arc(player.position.x, player.position.y, config.player.radius + 1.5, i * perimeter / player.maxBullet + i * gap - Math.PI / 2, (i + 1) * perimeter / player.maxBullet + i * gap - Math.PI / 2);
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(255,255,255,.5)';
            ctx.lineWidth = 3;
            for (let i = 0; i < player.bullet; i++) {
                ctx.beginPath();
                ctx.arc(player.position.x, player.position.y, config.player.radius + 1.5, i * perimeter / player.maxBullet + i * gap - Math.PI / 2, (i + 1) * perimeter / player.maxBullet + i * gap - Math.PI / 2);
                ctx.stroke();
            }
            let playerBasic = this.getPlayerBPROT(player.id);
            if (playerBasic) {
                ctx.fillText(playerBasic.name, player.position.x, player.position.y + config.player.radius + 15);
            }
        }
        ctx.restore();
    }
}
class resource {
    constructor() {
        this._isDisposed = false;
    }
    dispose(manager = null) {
        this._isDisposed = true;
    }
}
class shootingCache extends resource {
    constructor(p) {
        super();
        this._isSightEnd = false;
        this._isEnd = false;
        this._fadeOutTime = 20;
        this.id = p.id;
        this._shootingPosition = p.position;
        this._angle = p.angle;
        this._playerIdsInSight = p.playerIdsInSight;
        this._shootingPlayerId = p.shootingPlayerId;
        this._bulletPosition = p.bulletPosition;
    }
    onDuringShootingPROT(p, manager) {
        this._isSightEnd = p.isSightEnd;
        if (p.isEnd) {
            if (this._shootingPlayerId == manager.currentPlayerId && p.shootedPlayerId) {
                manager.shooingInAimEffect = new shootingInAimEffect('击中');
            }
            if (p.shootedPlayerId == manager.currentPlayerId) {
                manager.shootedEffects.push(new shootedEffect(this._angle + Math.PI));
            }
            this._isEnd = true;
        }
        this._bulletPosition = p.bulletPosition;
        this._playerIdsInSight = p.playerIdsInSight;
    }
    draw(ctx, manager) {
        if (this._isEnd && this._fadeOutTime <= 0) {
            this.dispose(manager);
        }
        if (!this._isSightEnd) {
            ctx.save();
            // 绘制射击可见区域中所有玩家
            ctx.beginPath();
            ctx.arc(this._shootingPosition.x, this._shootingPosition.y, config.player.shootingSightRadius - 1, 0, Math.PI * 2);
            ctx.clip();
            manager.drawPlayer(ctx, this._playerIdsInSight, '#fff', '#f00');
            ctx.restore();
            // 绘制射击可见区域
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255,255,0,0.25)';
            ctx.strokeStyle = 'rgba(255,255,0,0.25)';
            ctx.lineWidth = 3;
            ctx.arc(this._shootingPosition.x, this._shootingPosition.y, config.player.shootingSightRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        if (!this._isEnd) {
            // 绘制子弹
            ctx.beginPath();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.moveTo(this._bulletPosition.x - 10 * Math.cos(this._angle), this._bulletPosition.y - 10 * Math.sin(this._angle));
            ctx.lineTo(this._bulletPosition.x + 10 * Math.cos(this._angle), this._bulletPosition.y + 10 * Math.sin(this._angle));
            ctx.stroke();
        }
        ctx.beginPath();
        if (this._isEnd) {
            ctx.strokeStyle = `rgba(255,255,255,${--this._fadeOutTime / 80})`;
        }
        else {
            ctx.strokeStyle = 'rgba(255,255,255,.25)';
        }
        ctx.lineWidth = 4;
        ctx.moveTo(this._shootingPosition.x, this._shootingPosition.y);
        ctx.lineTo(this._bulletPosition.x, this._bulletPosition.y);
        ctx.stroke();
    }
    dispose(manager) {
        super.dispose(manager);
        let i = manager.shootingCaches.findIndex(pp => pp == this);
        if (i != -1)
            manager.shootingCaches.splice(i, 1);
    }
}
class shootedEffect extends resource {
    constructor(angle) {
        super();
        this._timeout = 10;
        this._angle = angle;
    }
    draw(ctx) {
        if (this._isDisposed)
            return;
        ctx.save();
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, 50, this._angle - Math.PI / 32, this._angle + Math.PI / 32);
        ctx.stroke();
        ctx.restore();
        if (--this._timeout <= 0) {
            this.dispose();
        }
    }
}
class shootingInAimEffect extends resource {
    constructor(text) {
        super();
        this._fontsize = 20;
        this._text = text;
    }
    draw(ctx) {
        if (this._isDisposed)
            return;
        ctx.save();
        ctx.font = `${this._fontsize}px 微软雅黑`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(this._text, ctx.canvas.width / 2, 50);
        ctx.restore();
        if (++this._fontsize > 50) {
            this.dispose();
        }
    }
}
//# sourceMappingURL=render.js.map