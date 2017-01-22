"use strict";
const utils = require("../shared/utils");
const config = require("../shared/game_config");
const point = utils.point;
class barricade {
    constructor(vertex1, vertex2) {
        this.vertex1 = vertex1;
        this.vertex2 = vertex2;
    }
    getBarricadePROT() {
        return {
            point1: this.vertex1,
            point2: this.vertex2
        };
    }
    didPlayerCollided(playerPos) {
        let r = config.player.radius;
        if (playerPos.x >= this.vertex1.x &&
            playerPos.y > this.vertex1.y - r &&
            playerPos.x <= this.vertex2.x &&
            playerPos.y < this.vertex2.y + r) {
            return true;
        }
        if (playerPos.x > this.vertex1.x - r &&
            playerPos.y >= this.vertex1.y &&
            playerPos.x < this.vertex2.x + r &&
            playerPos.y <= this.vertex2.y) {
            return true;
        }
        for (let vertex of [this.vertex1, new point(this.vertex2.x, this.vertex1.y),
            this.vertex2, new point(this.vertex1.x, this.vertex2.y)]) {
            if (utils.didDotInCircle(playerPos, vertex, r)) {
                return true;
            }
        }
        return false;
    }
    adjustPlayerCollided(oldPlayerPos, newPlayerPos) {
        let r = config.player.radius;
        if (newPlayerPos.x >= this.vertex1.x &&
            newPlayerPos.y > this.vertex1.y - r &&
            newPlayerPos.x <= this.vertex2.x &&
            newPlayerPos.y < this.vertex2.y + r) {
            if (oldPlayerPos.y < this.vertex1.y)
                newPlayerPos.y = this.vertex1.y - r;
            else if (oldPlayerPos.y > this.vertex2.y) {
                newPlayerPos.y = this.vertex2.y + r;
            }
        }
        if (newPlayerPos.x > this.vertex1.x - r &&
            newPlayerPos.y >= this.vertex1.y &&
            newPlayerPos.x < this.vertex2.x + r &&
            newPlayerPos.y <= this.vertex2.y) {
            if (oldPlayerPos.x < this.vertex1.x)
                newPlayerPos.x = this.vertex1.x - r;
            else if (oldPlayerPos.x > this.vertex2.x) {
                newPlayerPos.x = this.vertex2.x + r;
            }
        }
        for (let vertex of [this.vertex1, new point(this.vertex2.x, this.vertex1.y),
            this.vertex2, new point(this.vertex1.x, this.vertex2.y)]) {
            if (utils.didDotInCircle(newPlayerPos, vertex, r)) {
                let d = utils.getTwoPointsDistance(newPlayerPos, vertex);
                newPlayerPos.x = vertex.x + r * (newPlayerPos.x - vertex.x) / d;
                newPlayerPos.y = vertex.y + r * (newPlayerPos.y - vertex.y) / d;
                break;
            }
        }
    }
    getRayCollidedPoint(rayPoint, angle) {
        let collidedPoints = [];
        let vertexes = [this.vertex1, new point(this.vertex2.x, this.vertex1.y),
            this.vertex2, new point(this.vertex1.x, this.vertex2.y)];
        for (let i = 0; i < 4; i++) {
            let collidedPoint = utils.getRayLineCollidedPoint(rayPoint, angle, vertexes[i], vertexes[(i + 1) % 4]);
            if (collidedPoint) {
                collidedPoints.push(collidedPoint);
            }
        }
        if (collidedPoints.length == 0)
            return null;
        else if (collidedPoints.length == 1)
            return collidedPoints[0];
        else {
            let minPoint = collidedPoints[0];
            let minDistant = Infinity;
            for (let i = 0; i < collidedPoints.length; i++) {
                let d = Math.sqrt(Math.pow((collidedPoints[i].x - rayPoint.x), 2) + Math.pow((collidedPoints[i].y - rayPoint.y), 2));
                if (d < minDistant) {
                    minPoint = collidedPoints[i];
                    minDistant = d;
                }
            }
            return minPoint;
        }
    }
}
exports.barricade = barricade;
//# sourceMappingURL=barricade.js.map