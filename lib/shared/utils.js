"use strict";
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
function didDotInCircle(dot, circlePoint, radius, canOnCircle = false) {
    if (canOnCircle)
        return getTwoPointsDistance(dot, circlePoint) <= radius;
    else
        return getTwoPointsDistance(dot, circlePoint) < radius;
}
exports.didDotInCircle = didDotInCircle;
function didDotOnLine(dot, vertex1, vertex2) {
    return dot.x >= Math.min(vertex1.x, vertex2.x) &&
        dot.x <= Math.max(vertex1.x, vertex2.x) &&
        dot.y >= Math.min(vertex1.y, vertex2.y) &&
        dot.y <= Math.max(vertex1.y, vertex2.y);
}
exports.didDotOnLine = didDotOnLine;
function getTwoPointsDistance(point1, point2) {
    return Math.sqrt(Math.pow((point1.x - point2.x), 2) + Math.pow((point1.y - point2.y), 2));
}
exports.getTwoPointsDistance = getTwoPointsDistance;
// export function getTangentialPointsOfPointToCircle(dot: point, circlePoint: point, r: number): [point, point] {
// 	if (dot.y - circlePoint.y == 0) {
// 		return [new point(circlePoint.x, circlePoint.y + r), new point(circlePoint.x, circlePoint.y - r)];
// 	} else {
// 		let tmp = (dot.x - circlePoint.x) / (dot.y - circlePoint.x);
// 		let tmpSqr = Math.sqrt(r ** 2 - (1 + tmp ** 2));
// 		let x1 = tmpSqr + circlePoint.x;
// 		let x2 = -tmpSqr + circlePoint.x;
// 		let y1 = circlePoint.y - tmpSqr * tmp;
// 		let y2 = circlePoint.y + tmpSqr * tmp;
// 		return [new point(x1, y1), new point(x2, y2)];
// 	}
// }
function getTangentialPointsOfPointToCircle(dot, circlePoint, r) {
    if (dot.y - circlePoint.y == 0) {
        return [new point(circlePoint.x, circlePoint.y + r), new point(circlePoint.x, circlePoint.y - r)];
    }
    else {
        let k = -(circlePoint.x - dot.x) / (circlePoint.y - dot.y);
        return [new point(circlePoint.x + Math.cos(Math.atan(k)) * r, circlePoint.y + Math.sin(Math.atan(k)) * r),
            new point(circlePoint.x - Math.cos(Math.atan(k)) * r, circlePoint.y - Math.sin(Math.atan(k)) * r)];
    }
}
exports.getTangentialPointsOfPointToCircle = getTangentialPointsOfPointToCircle;
// function bbb(dot: point, circlePoint: point, r: number) {
// 	let x0 = circlePoint.x;
// 	let y0 = circlePoint.y;
// 	let a = dot.x;
// 	let b = dot.y;
// 	var A = x0 ** 2 + y0 ** 2 - b * y0 - a * x0;
// 	var delta = 4 * ((y0 - b) ** 2 + (y0 - b) ** 2) * (A ** 2 - (y0 - b) ** 2 * r ** 2);
// 	var x1 = (2 * (a - x0) * A + Math.sqrt(delta)) / (2 * ((y0 - b) ** 2 + (x0 - a) ** 2))
// 	var y1 = (A - (x0 - a) * x1) / (y0 - b);
// 	var x2 = (2 * (a - x0) * A - Math.sqrt(delta)) / (2 * ((y0 - b) ** 2 + (x0 - a) ** 2))
// 	var y2 = (A - (x0 - a) * x2) / (y0 - b);
// 	return [new point(x1, y1), new point(x2, y2)];
// }
// let dots: point[] = [];
// let circlePoints: point[] = [];
// let rs: number[] = [];
// for (let i = 0; i < 100000; i++) {
// 	dots.push(new point(Math.random() * 1000, Math.random() * 1000));
// 	circlePoints.push(new point(Math.random() * 1000, Math.random() * 1000));
// 	rs.push(Math.random() * 100);
// }
// console.time();
// for (let i = 0; i < 20; i++) {
// 	let [a, b] = getTangentialPointsOfPointToCircle(dots[i], circlePoints[i], rs[i]);
// 	let [c, d] = aaa(dots[i], circlePoints[i], rs[i]);
// 	console.log('---');
// 	console.log(getTwoPointsDistance(a, circlePoints[i]) - rs[i], getTwoPointsDistance(c, circlePoints[i]) - rs[i])
// 	console.log(getTwoPointsDistance(a, c), getTwoPointsDistance(b, d));
// }
function didTwoLinesCross(a, b, c, d) {
    // 三角形abc 面积的2倍  
    var area_abc = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x);
    // 三角形abd 面积的2倍  
    var area_abd = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x);
    // 面积符号相同则两点在线段同侧,不相交 (对点在线段上的情况,本例当作不相交处理);  
    if (area_abc * area_abd >= 0) {
        return false;
    }
    // 三角形cda 面积的2倍  
    var area_cda = (c.x - a.x) * (d.y - a.y) - (c.y - a.y) * (d.x - a.x);
    // 三角形cdb 面积的2倍  
    // 注意: 这里有一个小优化.不需要再用公式计算面积,而是通过已知的三个面积加减得出.  
    var area_cdb = area_cda + area_abc - area_abd;
    if (area_cda * area_cdb >= 0) {
        return false;
    }
    return true;
}
exports.didTwoLinesCross = didTwoLinesCross;
function getTwoLinesCrossPoint(a, b, c, d) {
    var area_abc = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x);
    var area_abd = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x);
    if (area_abc * area_abd >= 0) {
        return null;
    }
    var area_cda = (c.x - a.x) * (d.y - a.y) - (c.y - a.y) * (d.x - a.x);
    var area_cdb = area_cda + area_abc - area_abd;
    if (area_cda * area_cdb >= 0) {
        return null;
    }
    var t = area_cda / (area_abd - area_abc);
    var dx = t * (b.x - a.x), dy = t * (b.y - a.y);
    return new point(a.x + dx, a.y + dy);
}
exports.getTwoLinesCrossPoint = getTwoLinesCrossPoint;
function getLineCircleCrossPoints(point1, point2, circlePoint, radius) {
    // 直线一般式
    let lineA = point2.y - point1.y;
    let lineB = -(point2.x - point1.x);
    let lineC = -lineB * point1.y - lineA * point1.x;
    // 求圆心到直线的距离，如果大于半径则一定没有交点
    let d = Math.abs(lineA * circlePoint.x + lineB * circlePoint.y + lineC) / Math.sqrt(Math.pow(lineA, 2) + Math.pow(lineB, 2));
    if (d > radius) {
        return [];
    }
    let r = radius;
    let a = circlePoint.x, b = circlePoint.y;
    let p1, p2;
    if (lineB == 0) {
        let c = -lineC / lineA;
        let tmp = Math.sqrt(Math.pow(r, 2) - Math.pow((c - a), 2));
        p1 = new point(c, b + tmp);
        p2 = new point(c, b - tmp);
    }
    else {
        let k = -lineA / lineB;
        let c = -lineC / lineB;
        let tmpA = 1 + Math.pow(k, 2);
        let tmpB = 2 * ((c - b) * k - a);
        let tmpSqr = Math.sqrt(Math.pow(tmpB, 2) - 4 * tmpA * (Math.pow(a, 2) - Math.pow(r, 2) + Math.pow((c - b), 2)));
        let x1 = (-tmpB + tmpSqr) / (2 * tmpA), x2 = (-tmpB - tmpSqr) / (2 * tmpA);
        p1 = new point(x1, k * x1 + c);
        p2 = new point(x2, k * x2 + c);
    }
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
// 获取p1->p2向量与X轴正方向的逆时针夹角
function getCounterClockwiseAngleBetweenVectorAndPositiveDirectionOfX(p1, p2) {
    let x = p2.x - p1.x, y = p2.y - p1.y;
    let angle;
    if (x == 0) {
        angle = y >= 0 ? Math.PI / 2 : Math.PI * 3 / 2;
    }
    else {
        angle = Math.atan(y / x);
        if (x > 0) {
            if (y < 0)
                angle += Math.PI * 2;
        }
        else {
            angle += Math.PI;
        }
    }
    return angle;
}
exports.getCounterClockwiseAngleBetweenVectorAndPositiveDirectionOfX = getCounterClockwiseAngleBetweenVectorAndPositiveDirectionOfX;
//# sourceMappingURL=utils.js.map