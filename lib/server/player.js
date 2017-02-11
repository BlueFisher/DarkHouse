"use strict";
const utils = require("../shared/utils");
const config = require("../shared/game_config");
const weapon_1 = require("./weapon");
const point = utils.point;
let id = 0;
class player {
    constructor(name, position) {
        this.id = ++id;
        this._angle = 0;
        this._hp = config.player.maxHp;
        this.records = {
            attackTimes: 0,
            attackInAimTimes: 0,
            attactedTimes: 0,
            killTimes: 0
        };
        this.canMove = true;
        this.isRunning = false;
        this.connected = true;
        // 是否可以继续射击
        this._canContinueShooting = false;
        // 是否可以继续近战攻击
        this._canContinueCombat = false;
        this.name = name;
        this.position = position;
        let gunSetting = config.weapon.gun.defaultSettings.get(config.weapon.gun.type.pistol);
        if (gunSetting)
            this._gun = new weapon_1.gun(config.weapon.gun.type.pistol, gunSetting);
        let meleeSetting = config.weapon.melee.defaultSettings.get(config.weapon.melee.type.fist);
        if (meleeSetting)
            this._melee = new weapon_1.melee(config.weapon.melee.type.fist, meleeSetting);
    }
    setDirectionAngle(angle) {
        angle = angle % (Math.PI * 2);
        this._angle = angle;
    }
    getDirectionAngle() {
        return this._angle;
    }
    setHp(hp) {
        if (hp <= config.player.maxHp && hp >= 0)
            this._hp = hp;
    }
    getHp() {
        return this._hp;
    }
    getGun() {
        return this._gun;
    }
    setGun(gun) {
        this._gun = gun;
    }
    getMelee() {
        return this._melee;
    }
    setMelee(melee) {
        this._melee = melee;
    }
    getPlayerPROT() {
        return {
            id: this.id,
            position: this.position,
            angle: this._angle,
            hp: this._hp,
            bullet: this._gun.getBullet(),
            maxBullet: this._gun.getMaxBullet()
        };
    }
    getPlayerBasicPROT() {
        return {
            id: this.id,
            name: this.name
        };
    }
    adjustCircleCollided(newPos, r) {
        if (utils.didTwoCirclesCollied(this.position, config.player.radius, newPos, r)) {
            let pos = this.position;
            let d = utils.getTwoPointsDistance(pos, newPos);
            let x = pos.x + (config.player.radius + r) * (newPos.x - pos.x) / d;
            let y = pos.y + (config.player.radius + r) * (newPos.y - pos.y) / d;
            newPos.x = x;
            newPos.y = y;
        }
    }
    didCircleCollided(pos, r) {
        return utils.didTwoCirclesCollied(this.position, config.player.radius, pos, r);
    }
    getLineCollidedPoint(oldPos, newPos) {
        let collidedPoints = utils.getLineCircleCrossPoints(oldPos, newPos, this.position, config.player.radius);
        if (collidedPoints.length == 0)
            return null;
        else if (collidedPoints.length == 1)
            return collidedPoints[0];
        else {
            let minPoint = collidedPoints[0];
            let minDistant = utils.getTwoPointsDistance(collidedPoints[0], oldPos);
            for (let i = 1; i < collidedPoints.length; i++) {
                let d = utils.getTwoPointsDistance(collidedPoints[i], oldPos);
                if (d < minDistant) {
                    minPoint = collidedPoints[i];
                    minDistant = d;
                }
            }
            return minPoint;
        }
    }
    startShooting(active, shootingFinishedCallback) {
        this._canContinueShooting = active;
        this._shootingFinishedCallback = shootingFinishedCallback;
        if (active)
            this._shoot();
    }
    _shoot() {
        if (this._canContinueShooting) {
            if (this._gun.shoot(this._shoot.bind(this))) {
                this._shootingFinishedCallback();
            }
        }
    }
    startCombat(active, combatFinishedCallback) {
        this._canContinueCombat = active;
        this._combatFinishedCallback = combatFinishedCallback;
        if (active)
            this._combat();
    }
    _combat() {
        if (this._canContinueCombat) {
            if (this._melee.combat(this._combat.bind(this))) {
                this._combatFinishedCallback();
            }
        }
    }
    beKilled() {
        this._canContinueShooting = false;
        this._canContinueCombat = false;
    }
}
exports.player = player;
class playerManager {
    constructor() {
        this.players = [];
        this._newPlayersCache = [];
    }
    findPlayerById(id) {
        return this.players.find(p => p.id == id);
    }
    addNewPlayer(name, position) {
        let newPlayer = new player(name, position);
        this.players.push(newPlayer);
        this._newPlayersCache.push(newPlayer);
        return newPlayer;
    }
    removePlayerById(playerId) {
        let i = this.players.findIndex(p => p.id == playerId);
        if (i != -1) {
            this.players[i].beKilled();
            this.players.splice(i, 1);
        }
    }
    removePlayer(player) {
        let i = this.players.findIndex(p => p == player);
        if (i != -1) {
            this.players[i].beKilled();
            this.players.splice(i, 1);
        }
    }
    getPlayersInPlayerSight(player, radius, withinPlayers) {
        return withinPlayers.filter(p => {
            if (p == player)
                return false;
            return utils.didTwoCirclesCollied(p.position, radius, player.position, config.player.radius);
        });
    }
    getPlayersInRadius(position, radius) {
        return this.players.filter(p => {
            return utils.didTwoCirclesCollied(p.position, radius, position, config.player.radius);
        });
    }
    getRankList() {
        return this.players.slice(0).sort((a, b) => {
            return a.records.attackInAimTimes > b.records.attackInAimTimes ? -1 : 1;
        }).map(p => {
            return {
                id: p.id,
                killTimes: p.records.attackInAimTimes
            };
        }).slice(0, 10);
    }
    /**生成新加入玩家的基础协议 */
    generateNewPlayersBasicPROTs() {
        let newPlayersBasicPROTs = this._newPlayersCache.map(p => p.getPlayerBasicPROT());
        this._newPlayersCache = [];
        return newPlayersBasicPROTs;
    }
    /**生成每个玩家视野中的玩家 */
    generatePlayersInSightMap(players, barricadeManager) {
        let _addInMap = (map, key, playerOrPlayers) => {
            let v = map.get(key);
            if (!v) {
                v = [];
                map.set(key, v);
            }
            if (playerOrPlayers instanceof player) {
                v.push(playerOrPlayers);
            }
            else {
                map.set(key, v.concat(playerOrPlayers));
            }
        };
        let playersInSightMap = new Map();
        for (let i = 0; i < players.length; i++) {
            let player = players[i];
            let restPlayersInSight = this.getPlayersInPlayerSight(player, config.player.sightRadius, players.slice(i + 1));
            barricadeManager.removeBlockedPlayers(player, restPlayersInSight);
            _addInMap(playersInSightMap, player, restPlayersInSight);
            for (let playerInSight of restPlayersInSight) {
                _addInMap(playersInSightMap, playerInSight, player);
            }
        }
        return playersInSightMap;
    }
    move(player, adjustNewPosition) {
        if (!player.connected || !player.canMove) {
            return;
        }
        let angle = player.getDirectionAngle();
        let oldPos = player.position;
        let step = player.isRunning ? config.player.runingStep : config.player.movingStep;
        let x = oldPos.x + Math.cos(angle) * step;
        let y = oldPos.y + Math.sin(angle) * step;
        let newPos = new point(x, y);
        adjustNewPosition(oldPos, newPos);
        this.players.forEach(p => {
            if (p == player)
                return;
            p.adjustCircleCollided(newPos, config.player.radius);
        });
        return player.position = newPos;
    }
}
exports.playerManager = playerManager;
//# sourceMappingURL=player.js.map