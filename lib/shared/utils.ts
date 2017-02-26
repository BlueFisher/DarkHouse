export class point {
	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	static getNewInstance(oldPoint: point) {
		return new point(oldPoint.x, oldPoint.y);
	}

	static getFixedPoint(oldPoint: point) {
		return new point(parseFloat(oldPoint.x.toFixed(2)),
			parseFloat(oldPoint.y.toFixed(2)));
	}
}

export function didTwoCirclesCollied(dot1: point, radius1: number, dot2: point, radius2: number) {
	return getTwoPointsDistance(dot1, dot2) <= radius1 + radius2;
}

export function didDotInCircle(dot: point, circlePoint: point, radius: number, canOnCircle = false) {
	if (canOnCircle)
		return getTwoPointsDistance(dot, circlePoint) <= radius;
	else
		return getTwoPointsDistance(dot, circlePoint) < radius;
}

export function didDotOnLine(dot: point, vertex1: point, vertex2: point) {
	return dot.x >= Math.min(vertex1.x, vertex2.x) &&
		dot.x <= Math.max(vertex1.x, vertex2.x) &&
		dot.y >= Math.min(vertex1.y, vertex2.y) &&
		dot.y <= Math.max(vertex1.y, vertex2.y);
}

export function getTwoPointsDistance(point1: point, point2: point) {
	return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
}

export function getTangentialPointsOfPointToCircle(dot: point, circlePoint: point, r: number) {
	if (dot.y - circlePoint.y == 0) {
		return [new point(circlePoint.x, circlePoint.y + r), new point(circlePoint.x, circlePoint.y - r)];
	} else {
		let k = -(circlePoint.x - dot.x) / (circlePoint.y - dot.y);
		return [new point(circlePoint.x + Math.cos(Math.atan(k)) * r, circlePoint.y + Math.sin(Math.atan(k)) * r),
		new point(circlePoint.x - Math.cos(Math.atan(k)) * r, circlePoint.y - Math.sin(Math.atan(k)) * r)];
	}
}

export function didTwoLinesCross(a: point, b: point, c: point, d: point) {
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
export function getTwoLinesCrossPoint(a: point, b: point, c: point, d: point): point | null {
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
	var dx = t * (b.x - a.x),
		dy = t * (b.y - a.y);

	return new point(a.x + dx, a.y + dy);
}

export function getLineCircleCrossPoints(point1: point, point2: point, circlePoint: point, radius: number) {
	// 直线一般式
	let lineA = point2.y - point1.y;
	let lineB = -(point2.x - point1.x);
	let lineC = -lineB * point1.y - lineA * point1.x;

	// 求圆心到直线的距离，如果大于半径则一定没有交点
	let d = Math.abs(lineA * circlePoint.x + lineB * circlePoint.y + lineC) / Math.sqrt(lineA ** 2 + lineB ** 2);
	if (d > radius) {
		return [];
	}

	let r = radius;
	let a = circlePoint.x,
		b = circlePoint.y;

	let p1: point, p2: point;
	if (lineB == 0) {
		let c = -lineC / lineA;
		let tmp = Math.sqrt(r ** 2 - (c - a) ** 2)
		p1 = new point(c, b + tmp);
		p2 = new point(c, b - tmp);
	} else {
		let k = -lineA / lineB;
		let c = -lineC / lineB;
		let tmpA = 1 + k ** 2;
		let tmpB = 2 * ((c - b) * k - a);
		let tmpSqr = Math.sqrt(tmpB ** 2 - 4 * tmpA * (a ** 2 - r ** 2 + (c - b) ** 2));

		let x1 = (-tmpB + tmpSqr) / (2 * tmpA),
			x2 = (-tmpB - tmpSqr) / (2 * tmpA);
		p1 = new point(x1, k * x1 + c);
		p2 = new point(x2, k * x2 + c);
	}

	let res: point[] = [];
	if (didDotOnLine(p1, point1, point2)) {
		res.push(p1);
	}
	if (didDotOnLine(p2, point1, point2)) {
		res.push(p2);
	}
	return res;
}

// 获取p1->p2向量与X轴正方向的逆时针夹角
export function getCounterClockwiseAngleBetweenVectorAndPositiveDirectionOfX(p1: point, p2: point) {
	let x = p2.x - p1.x,
		y = p2.y - p1.y;

	let angle: number;
	if (x == 0) {
		angle = y >= 0 ? Math.PI / 2 : Math.PI * 3 / 2
	} else {
		angle = Math.atan(y / x);
		if (x > 0) {
			if (y < 0)
				angle += Math.PI * 2;
		} else {
			angle += Math.PI;
		}
	}
	return angle;
}

export function cutRectangle(oriRect: [point, point], curRects: [point, point][]) {
	let res: [point, point][] = [oriRect];
	let tmp: [point, point][] = [];
	curRects.forEach(p => {
		res.forEach(t => {
			tmp = tmp.concat(getCutRectangles(t, p));
		});
		res = tmp;
		tmp = [];
	});
	return res;
}

function getCutRectangles(oriRect: [point, point], cutRect: [point, point]) {
	let res: [point, point][] = [];
	if (cutRect[0].x < oriRect[1].x && cutRect[0].y < oriRect[1].y && cutRect[1].x > oriRect[0].x && cutRect[1].y > oriRect[0].y) {
		if (cutRect[0].x > oriRect[0].x) {
			if (cutRect[1].y < oriRect[1].y) {
				res.push([oriRect[0], { x: cutRect[0].x, y: cutRect[1].y }]);
			} else {
				res.push([oriRect[0], { x: cutRect[0].x, y: oriRect[1].y }]);
			}
		}
		if (cutRect[1].y < oriRect[1].y) {
			if (cutRect[1].x < oriRect[1].x) {
				res.push([{ x: oriRect[0].x, y: cutRect[1].y }, { x: cutRect[1].x, y: oriRect[1].y }]);
			} else {
				res.push([{ x: oriRect[0].x, y: cutRect[1].y }, oriRect[1]]);
			}
		}
		if (cutRect[1].x < oriRect[1].x) {
			if (cutRect[0].y > oriRect[0].y) {
				res.push([{ x: cutRect[1].x, y: cutRect[0].y }, oriRect[1]]);
			} else {
				res.push([{ x: cutRect[1].x, y: oriRect[0].y }, oriRect[1]]);
			}
		}
		if (cutRect[0].y > oriRect[0].y) {
			if (cutRect[0].x > oriRect[0].x) {
				res.push([{ x: cutRect[0].x, y: oriRect[0].y }, { x: oriRect[1].x, y: cutRect[0].y }]);
			} else {
				res.push([oriRect[0], { x: oriRect[1].x, y: cutRect[0].y }]);
			}
		}
	}

	if (res.length == 0) {
		res = [oriRect];
	}

	return res;
}

export function addInMap<T>(map: Map<T, T[]>, key: T, value: T) {
	let v = map.get(key);
	if (!v) {
		v = [];
		map.set(key, v);
	}
	v.push(value);
}