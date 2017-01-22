"use strict";
const utils = require("../shared/utils");
const config = require("../shared/game_config");
const point = utils.point;
let id = 0;
class player {
    constructor(name, position) {
        this.id = ++id;
        this._angle = 0;
        this._hp = config.player.maxHp;
        this.canMove = true;
        this.isRunning = false;
        this.connected = true;
        this.name = name;
        this._position = position;
    }
    setPosition(position) {
        this._position = position;
    }
    getPosition() {
        return this._position;
    }
    setDirectionAngle(angle) {
        angle = angle % (Math.PI * 2);
        this._angle = angle;
    }
    getDirectionAngle() {
        return this._angle;
    }
    setHp(hp) {
        console.log(hp);
        if (hp <= config.player.maxHp && hp >= 0)
            this._hp = hp;
    }
    getHp() {
        return this._hp;
    }
    getPlayerPROT() {
        return {
            id: this.id,
            position: {
                x: parseFloat(this._position.x.toFixed(2)),
                y: parseFloat(this._position.y.toFixed(2))
            },
            angle: this._angle,
            hp: this._hp
        };
    }
    getPlayerBasicPROT() {
        return {
            id: this.id,
            name: this.name
        };
    }
    adjustPlayerCollided(newPlayerPos) {
        if (utils.didTwoCirclesCollied(this._position, config.player.radius, newPlayerPos, config.player.radius)) {
            let pos = this._position;
            let d = utils.getTwoPointsDistance(pos, newPlayerPos);
            let x = pos.x + 2 * config.player.radius * (newPlayerPos.x - pos.x) / d;
            let y = pos.y + 2 * config.player.radius * (newPlayerPos.y - pos.y) / d;
            newPlayerPos.x = x;
            newPlayerPos.y = y;
        }
    }
    didPlayerCollided(playerPos) {
        return utils.didTwoCirclesCollied(this._position, config.player.radius, playerPos, config.player.radius);
    }
    getRayCollidedPoint(point, angle) {
        return utils.getRayCircleCollidedPoint(point, angle, this._position, config.player.radius);
    }
}
exports.player = player;
//# sourceMappingURL=player.js.map