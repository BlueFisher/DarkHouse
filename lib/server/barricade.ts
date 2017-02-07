import * as utils from '../shared/utils';
import * as config from '../shared/game_config';
import * as toClientPROT from '../shared/ws_prot_to_client';

const point = utils.point;
type point = utils.point;

export class barricade {
	readonly vertex1: point;
	readonly vertex2: point;

	constructor(vertex1: point, vertex2: point) {
		this.vertex1 = vertex1;
		this.vertex2 = vertex2;
	}

	getBarricadePROT(): toClientPROT.barricadePROT {
		return {
			point1: this.vertex1,
			point2: this.vertex2
		}
	}

	didCircleCollided(pos: point, r: number) {
		if (pos.x >= this.vertex1.x &&
			pos.y > this.vertex1.y - r &&
			pos.x <= this.vertex2.x &&
			pos.y < this.vertex2.y + r) {

			return true;
		}

		if (pos.x > this.vertex1.x - r &&
			pos.y >= this.vertex1.y &&
			pos.x < this.vertex2.x + r &&
			pos.y <= this.vertex2.y) {

			return true;
		}

		for (let vertex of [this.vertex1, new point(this.vertex2.x, this.vertex1.y),
		this.vertex2, new point(this.vertex1.x, this.vertex2.y)]) {
			if (utils.didDotInCircle(pos, vertex, r)) {
				return true;
			}
		}

		return false;
	}

	adjustCircleCollided(oldPos: point, newPos: point, r: number) {
		if (newPos.x >= this.vertex1.x &&
			newPos.y > this.vertex1.y - r &&
			newPos.x <= this.vertex2.x &&
			newPos.y < this.vertex2.y + r) {

			if (oldPos.y < this.vertex1.y)
				newPos.y = this.vertex1.y - r;
			else if (oldPos.y > this.vertex2.y) {
				newPos.y = this.vertex2.y + r;
			}
		}

		if (newPos.x > this.vertex1.x - r &&
			newPos.y >= this.vertex1.y &&
			newPos.x < this.vertex2.x + r &&
			newPos.y <= this.vertex2.y) {

			if (oldPos.x < this.vertex1.x)
				newPos.x = this.vertex1.x - r;
			else if (oldPos.x > this.vertex2.x) {
				newPos.x = this.vertex2.x + r;
			}
		}

		for (let vertex of [this.vertex1, new point(this.vertex2.x, this.vertex1.y),
		this.vertex2, new point(this.vertex1.x, this.vertex2.y)]) {
			if (utils.didDotInCircle(newPos, vertex, r)) {
				let d = utils.getTwoPointsDistance(newPos, vertex);
				newPos.x = vertex.x + r * (newPos.x - vertex.x) / d;
				newPos.y = vertex.y + r * (newPos.y - vertex.y) / d;
				break;
			}
		}
	}

	getLineCollidedPoint(oldPos: point, newPos: point) {
		let collidedPoints: point[] = [];
		let vertexes = [this.vertex1, new point(this.vertex2.x, this.vertex1.y),
		this.vertex2, new point(this.vertex1.x, this.vertex2.y)];

		for (let i = 0; i < 4; i++) {
			let collidedPoint = utils.getTwoLinesCrossPoint(oldPos, newPos, vertexes[i], vertexes[(i + 1) % 4]);
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
}

export class edge {
	readonly vertex1: point;
	readonly vertex2: point;

	constructor(vertex1: point, vertex2: point) {
		this.vertex1 = vertex1;
		this.vertex2 = vertex2;
	}

	getWidth() {
		return Math.abs(this.vertex2.x - this.vertex1.x);
	}
	getHeight() {
		return Math.abs(this.vertex2.y - this.vertex1.y);
	}

	getEdgePROT(): toClientPROT.edgePROT {
		return {
			point1: this.vertex1,
			point2: this.vertex2
		}
	}

	didCircleCollided(pos: point, r: number) {
		if (pos.x - r < this.vertex1.x ||
			pos.y - r < this.vertex1.y ||
			pos.x + r > this.vertex2.x ||
			pos.y + r > this.vertex2.y) {
			return true;
		}
		return false;
	}

	adjustCircleCollided(pos: point, r: number) {
		if (pos.x - r < this.vertex1.x) {
			pos.x = this.vertex1.x + r;
		}
		if (pos.y - r < this.vertex1.y) {
			pos.y = this.vertex1.y + r;
		}
		if (pos.x + r > this.vertex2.x) {
			pos.x = this.vertex2.x - r;
		}
		if (pos.y + r > this.vertex2.y) {
			pos.y = this.vertex2.y - r;
		}
	}

	getLineCollidedPoint(oldPos: point, newPos: point) {
		let collidedPoints: point[] = [];
		let vertexes = [this.vertex1, new point(this.vertex2.x, this.vertex1.y),
		this.vertex2, new point(this.vertex1.x, this.vertex2.y)];

		for (let i = 0; i < 4; i++) {
			let collidedPoint = utils.getTwoLinesCrossPoint(oldPos, newPos, vertexes[i], vertexes[(i + 1) % 4]);
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
}