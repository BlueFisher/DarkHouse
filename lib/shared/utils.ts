export class point {
	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
}

export function didTwoCirclesCollied(dot1: point, radius1: number, dot2: point, radius2: number) {
	return getTwoPointsDistance(dot1, dot2) <= radius1 + radius2;
}

/**
 * 线段与圆是否相交
 */
/* export function tryAdjustCirleTowardsLineCollided(point1: point, point2: point, circlePoint: point, radius: number, towardsAngle: number) {
	let lineA = point2.y - point1.y;
	let lineB = -(point2.x - point1.x);
	let lineC = -lineB * point1.y - lineA * point1.x;

	let footX = (lineB ** 2 * circlePoint.x - lineA * lineB * circlePoint.y - lineA * lineC) / (lineA ** 2 + lineB ** 2);
	let footY = (lineA ** 2 * circlePoint.y - lineA * lineB * circlePoint.x - lineB * lineC) / (lineA ** 2 + lineB ** 2);

	if (footX >= Math.min(point1.x, point2.x) && footX <= Math.max(point1.x, point2.x) &&
		footY >= Math.min(point1.y, point2.y) && footY <= Math.max(point1.y, point2.y)) {
		let d3 = Math.abs(lineA * circlePoint.x + lineB * circlePoint.y + lineC) / Math.sqrt(lineA ** 2 + lineB ** 2);

		if (d3 <= radius) {
			let angle: number;
			if (lineB == 0) {
				angle = Math.PI / 2;
			} else {
				angle = Math.atan(-lineA / lineB);
			}

			if ((towardsAngle == Math.PI * 3 / 2 || towardsAngle == Math.PI / 2) && angle == Math.PI / 2) {
				return true;
			}

			if (towardsAngle >= 0 && towardsAngle < Math.PI / 2) {
				if (angle >= 0 && angle < towardsAngle) {
					angle -= Math.PI / 2;
				} else {
					angle += Math.PI / 2;
				}
			} else if (towardsAngle >= Math.PI / 2 && towardsAngle < Math.PI) {
				if (angle >= towardsAngle - Math.PI && angle < 0) {
					angle += Math.PI / 2;
				} else {
					angle -= Math.PI / 2;
				}
			} else if (towardsAngle >= Math.PI && towardsAngle < Math.PI * 3 / 2) {
				if (angle >= 0 && angle < towardsAngle - Math.PI) {
					angle += Math.PI / 2;
				} else {
					angle -= Math.PI / 2;
				}
			} else {
				if (angle > towardsAngle - Math.PI && angle <= 0) {
					angle -= Math.PI / 2;
				} else {
					angle += Math.PI / 2;
				}
			}

			circlePoint.x = footX + Math.cos(angle) * radius;
			circlePoint.y = footY + Math.sin(angle) * radius;
		}
		return true;
	} else {
		let d1 = Math.sqrt((point1.x - circlePoint.x) ** 2 + (point1.y - circlePoint.y) ** 2);
		let d2 = Math.sqrt((point2.x - circlePoint.x) ** 2 + (point2.y - circlePoint.y) ** 2);
		return Math.min(d1, d2) >= radius;
	}
} */


/**判断点是否在射线的象限范围内 */
function _didDotInRayQuadrant(rayDot: point, angle: number, dot: point) {
	if ((dot.y - rayDot.y) / Math.sin(angle) < 0 ||
		(dot.x - rayDot.x) / Math.cos(angle) < 0)
		return false;

	return true;
}

/**
 * 获取射线与圆相交的点
 */
export function getRayCircleCollidedPoint(rayDot: point, angle: number, circlePoint: point, radius: number): point | null {
	let k = Math.tan(angle);
	let b = rayDot.y - k * rayDot.x;

	let d = Math.abs(k * circlePoint.x - circlePoint.y + b) / Math.sqrt(k ** 2 + 1);
	if (d > radius)
		return null;

	let footX = (circlePoint.x + k * circlePoint.y - k * b) / (k ** 2 + 1);
	let footY = (k ** 2 * circlePoint.y + k * circlePoint.x + b) / (k ** 2 + 1);

	if (!_didDotInRayQuadrant(rayDot, angle, new point(footX, footY)))
		return null;

	let td = Math.sqrt(radius ** 2 - d ** 2);
	return new point(footX + Math.cos(angle + Math.PI) * td, footY + Math.sin(angle + Math.PI) * td);
}

/**
 * 获取射线与线段相交的点
 */
export function getRayLineCollidedPoint(rayDot: point, angle: number, vertex1: point, vertex2: point): point | null {
	let line1A = -Math.tan(angle);
	let line1B = 1;
	let line1C = -rayDot.y - line1A * rayDot.x;

	let line2A = vertex2.y - vertex1.y;
	let line2B = -(vertex2.x - vertex1.x);
	let line2C = -line2B * vertex1.y - line2A * vertex1.x;

	let tmp = line1A * line2B - line2A * line1B;
	if (tmp == 0) {
		if (line1A / line2A == line1C / line2C)
			return vertex1;
		else {
			return null;
		}
	} else {
		let x = Math.round((line2C * line1B - line2B * line1C) / tmp);
		let y = Math.round((line2A * line1C - line2C * line1A) / tmp);

		if (x >= Math.min(vertex1.x, vertex2.x) && x <= Math.max(vertex1.x, vertex2.x) &&
			y >= Math.min(vertex1.y, vertex2.y) && y <= Math.max(vertex1.y, vertex2.y)) {

			let collidedPoint = new point(x, y);
			if (_didDotInRayQuadrant(rayDot, angle, collidedPoint))
				return collidedPoint;
			else
				return null;
		}
		else
			return null;
	}
}

export function didDotInCircle(dot: point, circlePoint: point, radius: number, canOnCircle = false) {
	if (canOnCircle)
		return getTwoPointsDistance(dot, circlePoint) <= radius;
	else
		return getTwoPointsDistance(dot, circlePoint) < radius;
}

export function getTwoPointsDistance(point1: point, point2: point) {
	return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
}