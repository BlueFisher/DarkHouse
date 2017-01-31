"use strict";
const utils = require("../shared/utils");
const config = require("../shared/game_config");
const gun_1 = require("./gun");
const point = utils.point;
let id = 0;
class player {
    constructor(name, position) {
        this.id = ++id;
        this._angle = 0;
        this._hp = config.player.maxHp;
        this.records = {
            shootingTimes: 0,
            shootingInAimTimes: 0,
            shootedTimes: 0,
            killTimes: 0
        };
        this.canMove = true;
        this.isRunning = false;
        this.connected = true;
        this._canContinueShooting = false;
        this.name = name;
        this.position = position;
        let gunSetting = config.gun.defaultSetting.get(config.gun.type.pistol);
        if (gunSetting)
            this._gun = new gun_1.gun(config.gun.type.pistol, gunSetting);
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
    getPlayerPROT() {
        return {
            id: this.id,
            position: {
                x: parseFloat(this.position.x.toFixed(2)),
                y: parseFloat(this.position.y.toFixed(2))
            },
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
    adjustPlayerCollided(newPlayerPos) {
        if (utils.didTwoCirclesCollied(this.position, config.player.radius, newPlayerPos, config.player.radius)) {
            let pos = this.position;
            let d = utils.getTwoPointsDistance(pos, newPlayerPos);
            let x = pos.x + 2 * config.player.radius * (newPlayerPos.x - pos.x) / d;
            let y = pos.y + 2 * config.player.radius * (newPlayerPos.y - pos.y) / d;
            newPlayerPos.x = x;
            newPlayerPos.y = y;
        }
    }
    didPlayerCollided(playerPos) {
        return utils.didTwoCirclesCollied(this.position, config.player.radius, playerPos, config.player.radius);
    }
    getRayCollidedPoint(point, angle) {
        return utils.getRayCircleCollidedPoint(point, angle, this.position, config.player.radius);
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
    removePlayer(player) {
        let i = this.players.findIndex(p => p == player);
        if (i != -1) {
            this.players.splice(i, 1);
        }
    }
    getAndClearNewPlayersCache() {
        let res = this._newPlayersCache;
        this._newPlayersCache = [];
        return res;
    }
    getPlayersInPlayerSight(player, radius) {
        return this.players.filter(p => {
            if (p != player) {
                return utils.didTwoCirclesCollied(p.position, radius, player.position, config.player.radius);
            }
            return false;
        });
    }
    getPlayersInRadius(position, radius) {
        return this.players.filter(p => {
            return utils.didTwoCirclesCollied(p.position, radius, position, config.player.radius);
        });
    }
    getRankList() {
        return this.players.sort((a, b) => {
            return a.records.killTimes > b.records.killTimes ? -1 : 1;
        }).map(p => {
            return {
                id: p.id,
                killTimes: p.records.killTimes
            };
        }).slice(0, 10);
    }
}
exports.playerManager = playerManager;
//# sourceMappingURL=player.js.map