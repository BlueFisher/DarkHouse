"use strict";
const config = require("../shared/game_config");
class resourcesManager {
    constructor(protocol) {
        this.playerBasicPROTs = [];
        this.barricades = [];
        this.propHps = [];
        this.propWeapons = [];
        this.attackedEffects = [];
        this.attackCaches = [];
        this.bloodSplashs = [];
        this.currentPlayerId = protocol.currPlayerId;
        this.playerBasicPROTs = protocol.players;
        this.edge = protocol.edge;
        this.barricades = protocol.barricades;
        this.propHps = protocol.propHps;
        this.propWeapons = protocol.propWeapons;
    }
    onMainProtocol(protocol) {
        this.mainPROTCache = protocol;
        this.attackCaches = this.attackCaches.concat(protocol.attackPROTs.map(p => new attackCache(p)));
        protocol.duringAttackPROTs.forEach(p => {
            let cache = this.attackCaches.find(pp => pp.id == p.id);
            if (cache)
                cache.onDuringAttackPROT(p, this);
        });
        this.playerBasicPROTs = this.playerBasicPROTs.concat(protocol.newPlayerBPROTs);
        this.propHps = this.propHps.concat(protocol.newPropHpPROTs);
        this.propWeapons = this.propWeapons.concat(protocol.newPropWeaponPROTs);
        protocol.removedPropHpIds.forEach(p => {
            let i = this.propHps.findIndex(pp => pp.id == p);
            if (i != -1)
                this.propHps.splice(i, 1);
        });
        protocol.removedPropWeaponIds.forEach(p => {
            let i = this.propWeapons.findIndex(pp => pp.id == p);
            if (i != -1)
                this.propWeapons.splice(i, 1);
        });
    }
    getPlayerPROT(playerId) {
        if (this.mainPROTCache)
            return this.mainPROTCache.playerPROTs.find(p => p.id == playerId);
    }
    getPlayerBPROT(playerId) {
        return this.playerBasicPROTs.find(p => p.id == playerId);
    }
    _draw(ctx, drawHandler) {
        ctx.save();
        drawHandler();
        ctx.restore();
    }
    drawEdge(ctx) {
        this._draw(ctx, () => {
            ctx.beginPath();
            ctx.strokeStyle = '#111';
            ctx.fillStyle = '#000';
            ctx.fillRect(this.edge.point1.x, this.edge.point1.y, this.edge.point2.x - this.edge.point1.x, this.edge.point2.y - this.edge.point1.y);
            ctx.strokeRect(this.edge.point1.x, this.edge.point1.y, this.edge.point2.x - this.edge.point1.x, this.edge.point2.y - this.edge.point1.y);
        });
    }
    drawBarricade(ctx) {
        this._draw(ctx, () => {
            ctx.fillStyle = '#111';
            for (let barricade of this.barricades) {
                ctx.fillRect(barricade.point1.x, barricade.point1.y, barricade.point2.x - barricade.point1.x, barricade.point2.y - barricade.point1.y);
            }
        });
    }
    drawVisableArea(ctx, currPlayer) {
        this._draw(ctx, () => {
            ctx.save();
            // 绘制可见区域中所有玩家
            ctx.beginPath();
            ctx.arc(currPlayer.position.x, currPlayer.position.y, config.player.sightRadius - 1, 0, Math.PI * 2);
            ctx.clip();
            this.drawPlayer(ctx, this.mainPROTCache.playerIdsInSight, '#fff', '#f00');
            // 绘制可见区域中所有障碍物
            ctx.fillStyle = '#fff';
            for (let barricade of this.barricades) {
                ctx.fillRect(barricade.point1.x, barricade.point1.y, barricade.point2.x - barricade.point1.x, barricade.point2.y - barricade.point1.y);
            }
            ctx.restore();
            // 绘制可见区域光线
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.arc(currPlayer.position.x, currPlayer.position.y, config.player.sightRadius, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    drawProp(ctx) {
        this._draw(ctx, () => {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '2px 微软雅黑';
            for (let propHp of this.propHps) {
                ctx.fillStyle = '#0f0';
                ctx.beginPath();
                ctx.arc(propHp.position.x, propHp.position.y, config.prop.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillText('血包', propHp.position.x, propHp.position.y);
            }
            for (let propWeapon of this.propWeapons) {
                ctx.fillStyle = '#f00';
                ctx.beginPath();
                ctx.arc(propWeapon.position.x, propWeapon.position.y, config.prop.radius, 0, Math.PI * 2);
                ctx.fill();
                let weaponName = '';
                if (propWeapon.attackType == config.weapon.attackType.gun) {
                    if (propWeapon.weapontType == config.weapon.gun.type.pistol) {
                        weaponName = '手枪';
                    }
                    else if (propWeapon.weapontType == config.weapon.gun.type.rifle) {
                        weaponName = '步枪';
                    }
                }
                else if (propWeapon.attackType == config.weapon.attackType.melee) {
                    if (propWeapon.weapontType == config.weapon.melee.type.fist) {
                        weaponName = '拳头';
                    }
                }
                ctx.fillStyle = '#fff';
                ctx.fillText(weaponName, propWeapon.position.x, propWeapon.position.y);
            }
            ;
        });
    }
    drawRunning(ctx) {
        this.mainPROTCache.runningPROTs.forEach(runningPROT => {
            ctx.save();
            // 绘制奔跑范围视野中所有的玩家
            ctx.beginPath();
            ctx.arc(runningPROT.position.x, runningPROT.position.y, config.player.runningSightRadius - 1, 0, Math.PI * 2);
            ctx.clip();
            this.drawPlayer(ctx, runningPROT.playerIdsInSight, '#fff', '#f00');
            ctx.restore();
            // 绘制奔跑视野
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            ctx.arc(runningPROT.position.x, runningPROT.position.y, config.player.runningSightRadius, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    drawPlayer(ctx, playerIds, fillStyle, strokeStyle) {
        this._draw(ctx, () => {
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
        });
    }
}
exports.resourcesManager = resourcesManager;
class resource {
    constructor() {
        this._isDisposed = false;
    }
    _dispose() {
        this._isDisposed = true;
    }
    _draw(ctx, drawHandler) {
        if (this._isDisposed)
            return;
        ctx.save();
        drawHandler();
        ctx.restore();
    }
}
/**攻击缓存 */
class attackCache extends resource {
    constructor(p) {
        super();
        this._isSightEnd = false;
        this._isEnd = false;
        this._fadeOutTime = 20;
        this.id = p.id;
        this._bulletPosition = p.bulletPosition;
        this._attackPROT = p;
    }
    onDuringAttackPROT(p, manager) {
        this._isSightEnd = p.isSightEnd;
        if (p.isEnd) {
            if (this._attackPROT.attackPlayerId == manager.currentPlayerId && p.attackedPlayerId) {
                manager.shooingInAimEffect = new attackInAimEffect('击中');
            }
            if (p.attackedPlayerId == manager.currentPlayerId) {
                manager.attackedEffects.push(new attackedEffect(this._attackPROT.angle + Math.PI));
            }
            // if (p.attackedPlayerId) {
            // 	manager.bloodSplashs.push(new bloodSplash(p.bulletPosition));
            // }
            this._isEnd = true;
        }
        this._bulletPosition = p.bulletPosition;
        this._attackPROT.playerIdsInSight = p.playerIdsInSight;
        this._attackedPlayerId = p.attackedPlayerId;
    }
    draw(ctx, manager) {
        this._draw(ctx, () => {
            if (this._isEnd && this._fadeOutTime <= 0) {
                this.dispose(manager);
            }
            if (!this._isSightEnd) {
                ctx.save();
                // 绘制射击可见区域中所有玩家
                ctx.beginPath();
                ctx.arc(this._attackPROT.position.x, this._attackPROT.position.y, this._attackPROT.sightRadius - 1, 0, Math.PI * 2);
                ctx.clip();
                manager.drawPlayer(ctx, this._attackPROT.playerIdsInSight, '#fff', '#f00');
                ctx.restore();
                // 绘制射击可见区域
                ctx.beginPath();
                ctx.fillStyle = 'rgba(255,255,0,0.25)';
                ctx.strokeStyle = 'rgba(255,255,0,0.25)';
                ctx.lineWidth = 3;
                ctx.arc(this._attackPROT.position.x, this._attackPROT.position.y, this._attackPROT.sightRadius, 0, Math.PI * 2);
                ctx.fill();
            }
            if (this._fadeOutTime >= 15) {
                // 绘制子弹
                ctx.beginPath();
                if (this._attackPROT.attackType == config.weapon.attackType.gun) {
                    ctx.strokeStyle = '#fff';
                }
                else if (this._attackPROT.attackType == config.weapon.attackType.melee) {
                    ctx.strokeStyle = '#00f';
                }
                ctx.lineWidth = 4;
                ctx.moveTo(this._bulletPosition.x - 10 * Math.cos(this._attackPROT.angle), this._bulletPosition.y - 10 * Math.sin(this._attackPROT.angle));
                ctx.lineTo(this._bulletPosition.x + 10 * Math.cos(this._attackPROT.angle), this._bulletPosition.y + 10 * Math.sin(this._attackPROT.angle));
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
            ctx.moveTo(this._attackPROT.position.x, this._attackPROT.position.y);
            ctx.lineTo(this._bulletPosition.x, this._bulletPosition.y);
            ctx.stroke();
        });
    }
    dispose(manager) {
        this._dispose();
        let i = manager.attackCaches.findIndex(pp => pp == this);
        if (i != -1)
            manager.attackCaches.splice(i, 1);
    }
}
class bloodSplash extends resource {
    constructor(position) {
        super();
        this._timeout = 40;
        this._position = position;
    }
    draw(ctx, manager) {
        this._draw(ctx, () => {
            if (this._timeout >= 20) {
                ctx.fillStyle = '#f00';
            }
            else {
                ctx.fillStyle = `rgba(255,0,0,${this._timeout / 20})`;
            }
            ctx.beginPath();
            ctx.arc(this._position.x, this._position.y, 20, 0, Math.PI * 2);
            ctx.fill();
        });
        if (--this._timeout <= 0) {
            this.dispose(manager);
        }
    }
    dispose(manager) {
        this._dispose();
        let i = manager.bloodSplashs.findIndex(p => p == this);
        if (i != -1)
            manager.bloodSplashs.splice(i);
    }
}
/**被击中效果 */
class attackedEffect extends resource {
    constructor(angle) {
        super();
        this._timeout = 10;
        this._angle = angle;
    }
    draw(ctx) {
        this._draw(ctx, () => {
            ctx.strokeStyle = '#f00';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, 50, this._angle - Math.PI / 32, this._angle + Math.PI / 32);
            ctx.stroke();
        });
        if (--this._timeout <= 0) {
            this._dispose();
        }
    }
}
/**击中效果 */
class attackInAimEffect extends resource {
    constructor(text) {
        super();
        this._fontsize = 20;
        this._text = text;
    }
    draw(ctx) {
        this._draw(ctx, () => {
            ctx.font = `${this._fontsize}px 微软雅黑`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.fillText(this._text, ctx.canvas.width / 2, 50);
        });
        if (++this._fontsize > 50) {
            this._dispose();
        }
    }
}
//# sourceMappingURL=resources.js.map