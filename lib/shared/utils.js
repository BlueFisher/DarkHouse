"use strict";
const EPS = 0.1;
class point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static getNewInstance(oldPoint) {
        return new point(oldPoint.x, oldPoint.y);
    }
    static getFixedPoint(oldPoint) {
        return new point(parseFloat(oldPoint.x.toFixed(2)), parseFloat(oldPoint.y.toFixed(2)));
    }
}
exports.point = point;
function didTwoCirclesCollied(dot1, radius1, dot2, radius2) {
    return getTwoPointsDistance(dot1, dot2) <= radius1 + radius2;
}
exports.didTwoCirclesCollied = didTwoCirclesCollied;
// /**判断点是否在射线的象限范围内 */
// function _didDotInRayQuadrant(rayDot: point, angle: number, dot: point) {
// 	if ((dot.y - rayDot.y) / Math.sin(angle) < 0 ||
// 		(dot.x - rayDot.x) / Math.cos(angle) < 0)
// 		return false;
// 	return true;
// }
// /**
//  * 获取射线与圆相交的点
//  */
// export function getRayCircleCollidedPoint(rayDot: point, angle: number, circlePoint: point, radius: number): point | null {
// 	let k = Math.tan(angle);
// 	let b = rayDot.y - k * rayDot.x;
// 	let d = Math.abs(k * circlePoint.x - circlePoint.y + b) / Math.sqrt(k ** 2 + 1);
// 	if (d > radius)
// 		return null;
// 	let footX = (circlePoint.x + k * circlePoint.y - k * b) / (k ** 2 + 1);
// 	let footY = (k ** 2 * circlePoint.y + k * circlePoint.x + b) / (k ** 2 + 1);
// 	if (!_didDotInRayQuadrant(rayDot, angle, new point(footX, footY)))
// 		return null;
// 	let td = Math.sqrt(radius ** 2 - d ** 2);
// 	return new point(footX + Math.cos(angle + Math.PI) * td, footY + Math.sin(angle + Math.PI) * td);
// }
// /**
//  * 获取射线与线段相交的点
//  */
// export function getRayLineCollidedPoint(rayDot: point, angle: number, vertex1: point, vertex2: point): point | null {
// 	let line1A = -Math.tan(angle);
// 	let line1B = 1;
// 	let line1C = -rayDot.y - line1A * rayDot.x;
// 	let line2A = vertex2.y - vertex1.y;
// 	let line2B = -(vertex2.x - vertex1.x);
// 	let line2C = -line2B * vertex1.y - line2A * vertex1.x;
// 	let tmp = line1A * line2B - line2A * line1B;
// 	if (tmp == 0) {
// 		if (line1A / line2A == line1C / line2C)
// 			return vertex1;
// 		else {
// 			return null;
// 		}
// 	} else {
// 		let x = Math.round((line2C * line1B - line2B * line1C) / tmp);
// 		let y = Math.round((line2A * line1C - line2C * line1A) / tmp);
// 		if (x >= Math.min(vertex1.x, vertex2.x) && x <= Math.max(vertex1.x, vertex2.x) &&
// 			y >= Math.min(vertex1.y, vertex2.y) && y <= Math.max(vertex1.y, vertex2.y)) {
// 			let collidedPoint = new point(x, y);
// 			if (_didDotInRayQuadrant(rayDot, angle, collidedPoint))
// 				return collidedPoint;
// 			else
// 				return null;
// 		}
// 		else
// 			return null;
// 	}
// }
function didDotInCircle(dot, circlePoint, radius, canOnCircle = false) {
    if (canOnCircle)
        return getTwoPointsDistance(dot, circlePoint) <= radius;
    else
        return getTwoPointsDistance(dot, circlePoint) < radius;
}
exports.didDotInCircle = didDotInCircle;
function didDotOnLine(dot, vertex1, vertex2, strict = false) {
    if (strict) {
        return dot.x >= Math.min(vertex1.x, vertex2.x) &&
            dot.x <= Math.max(vertex1.x, vertex2.x) &&
            dot.y >= Math.min(vertex1.y, vertex2.y) &&
            dot.y <= Math.max(vertex1.y, vertex2.y);
    }
    else {
        return dot.x - Math.min(vertex1.x, vertex2.x) >= -EPS &&
            dot.x - Math.max(vertex1.x, vertex2.x) <= EPS &&
            dot.y - Math.min(vertex1.y, vertex2.y) >= -EPS &&
            dot.y - Math.max(vertex1.y, vertex2.y) <= EPS;
    }
}
exports.didDotOnLine = didDotOnLine;
function getTwoPointsDistance(point1, point2) {
    return Math.sqrt(Math.pow((point1.x - point2.x), 2) + Math.pow((point1.y - point2.y), 2));
}
exports.getTwoPointsDistance = getTwoPointsDistance;
function getTwoLinesCrossPoint(a, b, c, d) {
    // 三角形abc 面积的2倍  
    var area_abc = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x);
    // 三角形abd 面积的2倍  
    var area_abd = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x);
    // 面积符号相同则两点在线段同侧,不相交 (对点在线段上的情况,本例当作不相交处理);  
    if (area_abc * area_abd >= 0) {
        return null;
    }
    // 三角形cda 面积的2倍  
    var area_cda = (c.x - a.x) * (d.y - a.y) - (c.y - a.y) * (d.x - a.x);
    // 三角形cdb 面积的2倍  
    // 注意: 这里有一个小优化.不需要再用公式计算面积,而是通过已知的三个面积加减得出.  
    var area_cdb = area_cda + area_abc - area_abd;
    if (area_cda * area_cdb >= 0) {
        return null;
    }
    //计算交点坐标  
    var t = area_cda / (area_abd - area_abc);
    var dx = t * (b.x - a.x), dy = t * (b.y - a.y);
    return new point(a.x + dx, a.y + dy);
}
exports.getTwoLinesCrossPoint = getTwoLinesCrossPoint;
function getLineCircleCrossPoints(point1, point2, circlePoint, radius) {
    let lineA = point2.y - point1.y;
    let lineB = -(point2.x - point1.x);
    let lineC = -lineB * point1.y - lineA * point1.x;
    let d = Math.abs(lineA * circlePoint.x + lineB * circlePoint.y + lineC) / Math.sqrt(Math.pow(lineA, 2) + Math.pow(lineB, 2));
    if (d > radius) {
        return [];
    }
    let footX = (Math.pow(lineB, 2) * circlePoint.x - lineA * lineB * circlePoint.y - lineA * lineC) / (Math.pow(lineA, 2) + Math.pow(lineB, 2));
    let footY = (Math.pow(lineA, 2) * circlePoint.y - lineA * lineB * circlePoint.x - lineB * lineC) / (Math.pow(lineA, 2) + Math.pow(lineB, 2));
    let angle;
    if (lineB == 0) {
        angle = Math.PI / 2;
    }
    else {
        angle = Math.atan(-lineA / lineB);
    }
    let p1 = new point(footX + Math.cos(angle) * radius, footY + Math.sin(angle) * radius), p2 = new point(footX - Math.cos(angle) * radius, footY - Math.sin(angle) * radius);
    let res = [];
    if (didDotOnLine(p1, point1, point2)) {
        res.push(p1);
    }
    if (didDotOnLine(p2, point1, point2)) {
        res.push(p2);
    }
    return res;
}
exports.getLineCircleCrossPoints = getLineCircleCrossPoints;
//# sourceMappingURL=utils.js.map