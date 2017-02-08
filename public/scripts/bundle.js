/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 12);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var activeWebSocket = void 0;
var webSockets = [];
exports.indexCommon = {
    name: 'Default Player',
    activeWebSocket: activeWebSocket,
    webSockets: webSockets
};
var rankList = [];
exports.index = {
    ping: 0,
    rankList: rankList
};
exports.gameInitModal = {
    common: exports.indexCommon,
    resumeGame: true,
    email: '',
    password: '',
    showAccount: false
};
var records = {
    shootingTimes: 0,
    shootingInAimTimes: 0,
    shootedTimes: 0,
    killTimes: 0
};
exports.gameOverModal = {
    common: exports.indexCommon,
    records: records
};

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var type;
(function (type) {
    type[type["ping"] = 0] = "ping";
    type[type["init"] = 1] = "init";
    type[type["startRunning"] = 2] = "startRunning";
    type[type["stopMoving"] = 3] = "stopMoving";
    type[type["rotate"] = 4] = "rotate";
    type[type["startShooting"] = 5] = "startShooting";
})(type = exports.type || (exports.type = {}));

var baseProtocol = function baseProtocol(type) {
    _classCallCheck(this, baseProtocol);

    this.type = type;
};

exports.baseProtocol = baseProtocol;

var pingProtocol = function (_baseProtocol) {
    _inherits(pingProtocol, _baseProtocol);

    function pingProtocol() {
        _classCallCheck(this, pingProtocol);

        return _possibleConstructorReturn(this, (pingProtocol.__proto__ || Object.getPrototypeOf(pingProtocol)).call(this, type.ping));
    }

    return pingProtocol;
}(baseProtocol);

exports.pingProtocol = pingProtocol;

var initialize = function (_baseProtocol2) {
    _inherits(initialize, _baseProtocol2);

    function initialize(name, resumeGame) {
        _classCallCheck(this, initialize);

        var _this2 = _possibleConstructorReturn(this, (initialize.__proto__ || Object.getPrototypeOf(initialize)).call(this, type.init));

        _this2.name = name;
        _this2.resumeGame = resumeGame;
        return _this2;
    }

    return initialize;
}(baseProtocol);

exports.initialize = initialize;

var startRunning = function (_baseProtocol3) {
    _inherits(startRunning, _baseProtocol3);

    function startRunning(active) {
        _classCallCheck(this, startRunning);

        var _this3 = _possibleConstructorReturn(this, (startRunning.__proto__ || Object.getPrototypeOf(startRunning)).call(this, type.startRunning));

        _this3.active = active;
        return _this3;
    }

    return startRunning;
}(baseProtocol);

exports.startRunning = startRunning;

var stopMoving = function (_baseProtocol4) {
    _inherits(stopMoving, _baseProtocol4);

    function stopMoving(active) {
        _classCallCheck(this, stopMoving);

        var _this4 = _possibleConstructorReturn(this, (stopMoving.__proto__ || Object.getPrototypeOf(stopMoving)).call(this, type.stopMoving));

        _this4.active = active;
        return _this4;
    }

    return stopMoving;
}(baseProtocol);

exports.stopMoving = stopMoving;

var rotate = function (_baseProtocol5) {
    _inherits(rotate, _baseProtocol5);

    function rotate(angle) {
        _classCallCheck(this, rotate);

        var _this5 = _possibleConstructorReturn(this, (rotate.__proto__ || Object.getPrototypeOf(rotate)).call(this, type.rotate));

        _this5.angle = angle;
        return _this5;
    }

    return rotate;
}(baseProtocol);

exports.rotate = rotate;

var startShoot = function (_baseProtocol6) {
    _inherits(startShoot, _baseProtocol6);

    function startShoot(active) {
        _classCallCheck(this, startShoot);

        var _this6 = _possibleConstructorReturn(this, (startShoot.__proto__ || Object.getPrototypeOf(startShoot)).call(this, type.startShooting));

        _this6.active = active;
        return _this6;
    }

    return startShoot;
}(baseProtocol);

exports.startShoot = startShoot;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $ = __webpack_require__(10);
var vue = __webpack_require__(11);
var vueData = __webpack_require__(0);

var domManager = function () {
    function domManager(connectWebSocketServer) {
        _classCallCheck(this, domManager);

        this._connectWebSocketServer = connectWebSocketServer;
        this._initializeVue();
        this._initializeCanvas();
        this._initializeGame();
    }

    _createClass(domManager, [{
        key: "_initializeVue",
        value: function _initializeVue() {
            var _this = this;

            new vue({
                el: '#modal-gameinit',
                data: vueData.gameInitModal,
                methods: {
                    startGame: function startGame() {
                        vueData.gameInitModal.resumeGame = false;
                        $('#modal-gameinit').modal('hide');
                        gameOn();
                    },
                    resumeGame: function resumeGame() {
                        vueData.gameInitModal.resumeGame = true;
                        $('#modal-gameinit').modal('hide');
                        gameOn();
                    }
                }
            });
            new vue({
                el: '#modal-gameover',
                data: vueData.gameOverModal,
                methods: {
                    startGameFromGameOver: function startGameFromGameOver() {
                        $('#modal-gameover').modal('hide');
                        gameOn();
                    }
                }
            });
            new vue({
                el: '#ranklist',
                data: vueData.index
            });
            var gameOn = function gameOn() {
                _this._connectWebSocketServer();
            };
            new vue({
                el: '#ping',
                data: vueData.index
            });
        }
    }, {
        key: "_initializeCanvas",
        value: function _initializeCanvas() {
            var adjustCanvasSize = function adjustCanvasSize() {
                var canvas = document.querySelector('#stage');
                canvas.height = window.innerHeight;
                canvas.width = window.innerWidth;
            };
            adjustCanvasSize();
            window.onresize = function () {
                adjustCanvasSize();
            };
        }
    }, {
        key: "gameOver",
        value: function gameOver(protocol) {
            vueData.gameOverModal.records = protocol.records;
            $('#modal-gameover').on('shown.bs.modal', function () {
                $('#modal-gameover').find('.form-control').focus();
            }).modal({
                backdrop: 'static',
                keyboard: false
            });
        }
    }, {
        key: "_initializeGame",
        value: function _initializeGame() {
            $.getJSON('/websockets').then(function (protocol) {
                vueData.indexCommon.webSockets = protocol;
                vueData.indexCommon.activeWebSocket = protocol[0];
                $('#modal-gameinit').find('.form-control').focus();
            });
            $('#modal-gameinit').modal({
                backdrop: 'static',
                keyboard: false
            });
        }
    }]);

    return domManager;
}();

exports.domManager = domManager;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fromClientPROT = __webpack_require__(1);
var toClientPROT = __webpack_require__(8);
var render_1 = __webpack_require__(9);
var vueData = __webpack_require__(0);

var gameCore = function () {
    function gameCore(sendFunc, domManager) {
        var _this = this;

        _classCallCheck(this, gameCore);

        this._isGameOn = false;
        this._canvas = document.querySelector('#stage');
        this._sendFunc = sendFunc;
        this._domManager = domManager;
        this._initlializeCanvasEvents();
        var ctx = this._canvas.getContext('2d');
        var reqAnimation = function reqAnimation() {
            window.requestAnimationFrame(function () {
                if (_this._isGameOn) _this._render.draw(ctx);
                reqAnimation();
            });
        };
        reqAnimation();
    }

    _createClass(gameCore, [{
        key: "_send",
        value: function _send(protocol) {
            if (this._isGameOn || protocol.type == fromClientPROT.type.ping) {
                this._sendFunc(protocol);
            }
        }
    }, {
        key: "protocolReceived",
        value: function protocolReceived(protocol) {
            var _this2 = this;

            switch (protocol.type) {
                case toClientPROT.type.pong:
                    var now = new Date();
                    var ping = now.getTime() - this._pingTime.getTime();
                    vueData.index.ping = ping;
                    setTimeout(function () {
                        _this2._sendPing();
                    }, 1000);
                    break;
                case toClientPROT.type.init:
                    this._onInitialize(protocol);
                    break;
                case toClientPROT.type.main:
                    this._onMainPROT(protocol);
                    break;
                case toClientPROT.type.gameOver:
                    this._isGameOn = false;
                    this._domManager.gameOver(protocol);
                    break;
            }
        }
    }, {
        key: "_initlializeCanvasEvents",
        value: function _initlializeCanvasEvents() {
            var _this3 = this;

            this._canvas.addEventListener('mousemove', function (e) {
                var point = {
                    x: e.pageX - _this3._canvas.offsetLeft,
                    y: e.pageY - _this3._canvas.offsetTop
                };
                var x = point.x - _this3._canvas.width / 2;
                var y = point.y - _this3._canvas.height / 2;
                var angle = void 0;
                if (x == 0) {
                    if (y >= 0) {
                        angle = 1 / 2 * Math.PI;
                    } else {
                        angle = 3 / 2 * Math.PI;
                    }
                } else {
                    angle = Math.atan(y / x);
                    if (x < 0) {
                        angle = Math.PI + angle;
                    } else if (x > 0 && y < 0) {
                        angle = 2 * Math.PI + angle;
                    }
                }
                _this3._send(new fromClientPROT.rotate(angle));
            });
            this._canvas.addEventListener('keydown', function (e) {
                if (e.keyCode == 32) {
                    _this3._send(new fromClientPROT.stopMoving(true));
                }
                if (e.keyCode == 87) {
                    _this3._send(new fromClientPROT.startRunning(true));
                }
            });
            this._canvas.addEventListener('keyup', function (e) {
                if (e.keyCode == 32) {
                    _this3._send(new fromClientPROT.stopMoving(false));
                }
                if (e.keyCode == 87) {
                    _this3._send(new fromClientPROT.startRunning(false));
                }
            });
            this._canvas.addEventListener('blur', function (e) {
                _this3._send(new fromClientPROT.stopMoving(true));
                _this3._send(new fromClientPROT.startShoot(false));
            });
            this._canvas.addEventListener('mouseout', function (e) {
                _this3._send(new fromClientPROT.stopMoving(true));
                _this3._send(new fromClientPROT.startShoot(false));
            });
            this._canvas.addEventListener('mouseover', function (e) {
                _this3._send(new fromClientPROT.stopMoving(false));
            });
            this._canvas.addEventListener('mousedown', function (e) {
                _this3._send(new fromClientPROT.startShoot(true));
            });
            this._canvas.addEventListener('mouseup', function (e) {
                _this3._send(new fromClientPROT.startShoot(false));
            });
        }
    }, {
        key: "_onInitialize",
        value: function _onInitialize(protocol) {
            this._canvas.focus();
            this._render = new render_1.render(protocol);
            this._isGameOn = true;
            this._sendPing();
        }
    }, {
        key: "_sendPing",
        value: function _sendPing() {
            this._pingTime = new Date();
            this._send(new fromClientPROT.pingProtocol());
        }
    }, {
        key: "_onMainPROT",
        value: function _onMainPROT(protocol) {
            var _this4 = this;

            vueData.index.rankList = [];
            protocol.rankList.forEach(function (p) {
                var player = _this4._render.getPlayerBPROT(p.id);
                if (player) vueData.index.rankList.push({
                    name: player.name,
                    killTimes: p.killTimes
                });
            });
            this._render.onMainProtocol(protocol);
        }
    }]);

    return gameCore;
}();

exports.gameCore = gameCore;

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = window.toastr;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.sessionAge = 7 * 24 * 60 * 60 * 1000;
exports.httpPort = 80;
exports.useCDN = true;
var tickrate = 60;
exports.mainInterval = 1000 / tickrate;
exports.webSockets = [{
        ip: 'localhost',
        port: 8080
}];

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var serverConfig = __webpack_require__(5);
var player;
(function (player) {
    player.movingStep = 0.08 * serverConfig.mainInterval; // 每循环移动前进距离
    player.runingStep = 0.2 * serverConfig.mainInterval; // 每循环跑步前进距离
    player.maxHp = 6;
    player.radius = 20;
    player.sightRadius = 100;
    player.runningSightRadius = 80;
    player.runningSightRemainsTime = 1; // 玩家跑步视野出现持续时间 (ms)
    player.runningSightDisapperTime = 2; // 玩家跑步视野消失持续时间 (ms)
    player.shootingSightRadius = 130;
})(player = exports.player || (exports.player = {}));
var hp;
(function (hp) {
    hp.radius = 10;
    // 血包触发的半径
    hp.activeRadius = 5;
    // 血包存在最大数量
    hp.maxNumber = 5;
    // 血包出现时间间隔
    hp.appearInterval = 10000;
})(hp = exports.hp || (exports.hp = {}));
var gun;
(function (gun) {
    var type;
    (function (type) {
        type[type["pistol"] = 0] = "pistol";
        type[type["rifle"] = 1] = "rifle";
    })(type = gun.type || (gun.type = {}));
    gun.defaultSettings = new Map();
    gun.defaultSettings.set(type.pistol, {
        shootingInterval: 500,
        shootingSightRadius: 130,
        shootingSightRemainsTime: 70,
        bullet: 15,
        bulletFlyStep: 3 * serverConfig.mainInterval,
        maxBullet: 30
    });
    gun.defaultSettings.set(type.rifle, {
        shootingInterval: 200,
        shootingSightRadius: 200,
        shootingSightRemainsTime: 60,
        bullet: 30,
        bulletFlyStep: 0.8 * serverConfig.mainInterval,
        maxBullet: 60
    });
})(gun = exports.gun || (exports.gun = {}));
var stage;
(function (stage) {
    stage.width = 500;
    stage.height = 500;
})(stage = exports.stage || (exports.stage = {}));

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EPS = 0.1;

var point = function () {
    function point(x, y) {
        _classCallCheck(this, point);

        this.x = x;
        this.y = y;
    }

    _createClass(point, null, [{
        key: "getNewInstance",
        value: function getNewInstance(oldPoint) {
            return new point(oldPoint.x, oldPoint.y);
        }
    }, {
        key: "getFixedPoint",
        value: function getFixedPoint(oldPoint) {
            return new point(parseFloat(oldPoint.x.toFixed(2)), parseFloat(oldPoint.y.toFixed(2)));
        }
    }]);

    return point;
}();

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
function didDotInCircle(dot, circlePoint, radius) {
    var canOnCircle = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    if (canOnCircle) return getTwoPointsDistance(dot, circlePoint) <= radius;else return getTwoPointsDistance(dot, circlePoint) < radius;
}
exports.didDotInCircle = didDotInCircle;
function didDotOnLine(dot, vertex1, vertex2) {
    var strict = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    if (strict) {
        return dot.x >= Math.min(vertex1.x, vertex2.x) && dot.x <= Math.max(vertex1.x, vertex2.x) && dot.y >= Math.min(vertex1.y, vertex2.y) && dot.y <= Math.max(vertex1.y, vertex2.y);
    } else {
        return dot.x - Math.min(vertex1.x, vertex2.x) >= -EPS && dot.x - Math.max(vertex1.x, vertex2.x) <= EPS && dot.y - Math.min(vertex1.y, vertex2.y) >= -EPS && dot.y - Math.max(vertex1.y, vertex2.y) <= EPS;
    }
}
exports.didDotOnLine = didDotOnLine;
function getTwoPointsDistance(point1, point2) {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
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
    var dx = t * (b.x - a.x),
        dy = t * (b.y - a.y);
    return new point(a.x + dx, a.y + dy);
}
exports.getTwoLinesCrossPoint = getTwoLinesCrossPoint;
function getLineCircleCrossPoints(point1, point2, circlePoint, radius) {
    var lineA = point2.y - point1.y;
    var lineB = -(point2.x - point1.x);
    var lineC = -lineB * point1.y - lineA * point1.x;
    var d = Math.abs(lineA * circlePoint.x + lineB * circlePoint.y + lineC) / Math.sqrt(Math.pow(lineA, 2) + Math.pow(lineB, 2));
    if (d > radius) {
        return [];
    }
    var footX = (Math.pow(lineB, 2) * circlePoint.x - lineA * lineB * circlePoint.y - lineA * lineC) / (Math.pow(lineA, 2) + Math.pow(lineB, 2));
    var footY = (Math.pow(lineA, 2) * circlePoint.y - lineA * lineB * circlePoint.x - lineB * lineC) / (Math.pow(lineA, 2) + Math.pow(lineB, 2));
    var angle = void 0;
    if (lineB == 0) {
        angle = Math.PI / 2;
    } else {
        angle = Math.atan(-lineA / lineB);
    }
    var p1 = new point(footX + Math.cos(angle) * radius, footY + Math.sin(angle) * radius),
        p2 = new point(footX - Math.cos(angle) * radius, footY - Math.sin(angle) * radius);
    var res = [];
    if (didDotOnLine(p1, point1, point2)) {
        res.push(p1);
    }
    if (didDotOnLine(p2, point1, point2)) {
        res.push(p2);
    }
    return res;
}
exports.getLineCircleCrossPoints = getLineCircleCrossPoints;

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var utils_1 = __webpack_require__(7);
var type;
(function (type) {
    type[type["pong"] = 0] = "pong";
    type[type["init"] = 1] = "init";
    type[type["main"] = 2] = "main";
    type[type["shoot"] = 3] = "shoot";
    type[type["gameOver"] = 4] = "gameOver";
})(type = exports.type || (exports.type = {}));

var baseProtocol = function baseProtocol(type) {
    _classCallCheck(this, baseProtocol);

    this.type = type;
};

exports.baseProtocol = baseProtocol;

var pongProtocol = function (_baseProtocol) {
    _inherits(pongProtocol, _baseProtocol);

    function pongProtocol() {
        _classCallCheck(this, pongProtocol);

        return _possibleConstructorReturn(this, (pongProtocol.__proto__ || Object.getPrototypeOf(pongProtocol)).call(this, type.pong));
    }

    return pongProtocol;
}(baseProtocol);

exports.pongProtocol = pongProtocol;

var initialize = function (_baseProtocol2) {
    _inherits(initialize, _baseProtocol2);

    function initialize(currPlayerId, players, edge, barricades, propHps, propGuns) {
        _classCallCheck(this, initialize);

        var _this2 = _possibleConstructorReturn(this, (initialize.__proto__ || Object.getPrototypeOf(initialize)).call(this, type.init));

        _this2.currPlayerId = currPlayerId;
        _this2.players = players;
        _this2.edge = edge;
        _this2.barricades = barricades;
        _this2.propHps = propHps;
        _this2.propGuns = propGuns;
        edge.point1 = utils_1.point.getFixedPoint(edge.point1);
        edge.point2 = utils_1.point.getFixedPoint(edge.point2);
        barricades.forEach(function (p) {
            p.point1 = utils_1.point.getFixedPoint(p.point1);
            p.point2 = utils_1.point.getFixedPoint(p.point2);
        });
        propHps.forEach(function (p) {
            p.position = utils_1.point.getFixedPoint(p.position);
        });
        propGuns.forEach(function (p) {
            p.position = utils_1.point.getFixedPoint(p.position);
        });
        return _this2;
    }

    return initialize;
}(baseProtocol);

exports.initialize = initialize;

var mainPROT = function (_baseProtocol3) {
    _inherits(mainPROT, _baseProtocol3);

    function mainPROT(playersInSight) {
        _classCallCheck(this, mainPROT);

        var _this3 = _possibleConstructorReturn(this, (mainPROT.__proto__ || Object.getPrototypeOf(mainPROT)).call(this, type.main));

        _this3.playerPROTs = [];
        _this3.newPlayerBPROTs = [];
        _this3.shootPROTs = [];
        _this3.duringShootingPROTs = [];
        _this3.runningPROTs = [];
        _this3.rankList = [];
        _this3.newPropGunPROTs = [];
        _this3.removedPropGunIds = [];
        _this3.newPropHpPROTs = [];
        _this3.removedPropHpIds = [];
        _this3.playerIdsInSight = playersInSight;
        return _this3;
    }

    _createClass(mainPROT, [{
        key: "formatPlayerPROT",
        value: function formatPlayerPROT(currPlayerId, format) {
            var arr = [currPlayerId];
            arr = arr.concat(this.playerIdsInSight);
            this.shootPROTs.forEach(function (p) {
                arr = arr.concat(p.playerIdsInSight);
            });
            this.duringShootingPROTs.forEach(function (p) {
                arr = arr.concat(p.playerIdsInSight);
            });
            this.runningPROTs.forEach(function (p) {
                arr = arr.concat(p.playerIdsInSight);
            });
            var json = {};
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = arr[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var i = _step.value;

                    if (!json[i]) {
                        json[i] = 1;
                        var playerPROT = format(i);
                        if (playerPROT) this.playerPROTs.push(playerPROT);
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
    }, {
        key: "fixNumbers",
        value: function fixNumbers() {
            this.playerPROTs.forEach(function (p) {
                p.angle = parseFloat(p.angle.toFixed(2));
                p.position = utils_1.point.getFixedPoint(p.position);
            });
            this.shootPROTs.forEach(function (p) {
                p.angle = parseFloat(p.angle.toFixed(2));
                p.bulletPosition = utils_1.point.getFixedPoint(p.bulletPosition);
                p.position = utils_1.point.getFixedPoint(p.position);
            });
            this.duringShootingPROTs.forEach(function (p) {
                p.bulletPosition = utils_1.point.getFixedPoint(p.bulletPosition);
            });
            this.runningPROTs.forEach(function (p) {
                p.position = utils_1.point.getFixedPoint(p.position);
            });
            this.newPropGunPROTs.forEach(function (p) {
                p.position = utils_1.point.getFixedPoint(p.position);
            });
            this.newPropHpPROTs.forEach(function (p) {
                p.position = utils_1.point.getFixedPoint(p.position);
            });
        }
    }]);

    return mainPROT;
}(baseProtocol);

exports.mainPROT = mainPROT;

var gameOver = function (_baseProtocol4) {
    _inherits(gameOver, _baseProtocol4);

    function gameOver(records) {
        _classCallCheck(this, gameOver);

        var _this4 = _possibleConstructorReturn(this, (gameOver.__proto__ || Object.getPrototypeOf(gameOver)).call(this, type.gameOver));

        _this4.records = records;
        return _this4;
    }

    return gameOver;
}(baseProtocol);

exports.gameOver = gameOver;

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var config = __webpack_require__(6);

var render = function () {
    function render(protocol) {
        _classCallCheck(this, render);

        this._resourceManager = new resourcesManager();
        this._resourceManager.currentPlayerId = protocol.currPlayerId;
        this._resourceManager.playerBasicPROTs = protocol.players;
        this._resourceManager.edge = protocol.edge;
        this._resourceManager.barricades = protocol.barricades;
        this._resourceManager.propHps = protocol.propHps;
        this._resourceManager.propGuns = protocol.propGuns;
    }

    _createClass(render, [{
        key: "getPlayerBPROT",
        value: function getPlayerBPROT(id) {
            return this._resourceManager.getPlayerBPROT(id);
        }
    }, {
        key: "onMainProtocol",
        value: function onMainProtocol(protocol) {
            var _this = this;

            this._resourceManager.mainPROTCache = protocol;
            protocol.shootPROTs.forEach(function (p) {
                _this._resourceManager.shootingCaches.push(new shootingCache(p));
            });
            protocol.duringShootingPROTs.forEach(function (p) {
                var cache = _this._resourceManager.shootingCaches.find(function (pp) {
                    return pp.id == p.id;
                });
                if (cache) cache.onDuringShootingPROT(p, _this._resourceManager);
            });
            protocol.newPlayerBPROTs.forEach(function (p) {
                _this._resourceManager.playerBasicPROTs.push(p);
            });
            protocol.newPropHpPROTs.forEach(function (p) {
                _this._resourceManager.propHps.push(p);
            });
            protocol.newPropGunPROTs.forEach(function (p) {
                _this._resourceManager.propGuns.push(p);
            });
            protocol.removedPropHpIds.forEach(function (p) {
                var i = _this._resourceManager.propHps.findIndex(function (pp) {
                    return pp.id == p;
                });
                if (i != -1) _this._resourceManager.propHps.splice(i, 1);
            });
            protocol.removedPropGunIds.forEach(function (p) {
                var i = _this._resourceManager.propGuns.findIndex(function (pp) {
                    return pp.id == p;
                });
                if (i != -1) _this._resourceManager.propGuns.splice(i, 1);
            });
        }
    }, {
        key: "draw",
        value: function draw(ctx) {
            var _this2 = this;

            if (!this._resourceManager.mainPROTCache) return;
            var canvas = ctx.canvas;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            var currPlayer = this._resourceManager.getPlayerPROT(this._resourceManager.currentPlayerId);
            if (!currPlayer) return;
            ctx.save();
            if (currPlayer) ctx.setTransform(1.5, 0, 0, 1.5, canvas.width / 2 - currPlayer.position.x * 1.5, canvas.height / 2 - currPlayer.position.y * 1.5);
            this._resourceManager.drawEdge(ctx);
            // 绘制障碍物
            ctx.fillStyle = '#111';
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this._resourceManager.barricades[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var barricade = _step.value;

                    ctx.fillRect(barricade.point1.x, barricade.point1.y, barricade.point2.x - barricade.point1.x, barricade.point2.y - barricade.point1.y);
                }
                // 绘制道具
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            ctx.fillStyle = '#f00';
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this._resourceManager.propHps[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var propHp = _step2.value;

                    ctx.beginPath();
                    ctx.arc(propHp.position.x, propHp.position.y, config.hp.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            ctx.fillStyle = '#0f0';
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this._resourceManager.propGuns[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var _propHp = _step3.value;

                    ctx.beginPath();
                    ctx.arc(_propHp.position.x, _propHp.position.y, config.hp.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                // 绘制可见区域
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            ctx.save();
            // 绘制可见区域中所有玩家
            ctx.beginPath();
            if (currPlayer) ctx.arc(currPlayer.position.x, currPlayer.position.y, config.player.sightRadius - 1, 0, Math.PI * 2);
            ctx.clip();
            this._resourceManager.drawPlayer(ctx, this._resourceManager.mainPROTCache.playerIdsInSight, '#fff', '#f00');
            // 绘制可见区域中所有障碍物
            ctx.fillStyle = '#fff';
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = this._resourceManager.barricades[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var _barricade = _step4.value;

                    ctx.fillRect(_barricade.point1.x, _barricade.point1.y, _barricade.point2.x - _barricade.point1.x, _barricade.point2.y - _barricade.point1.y);
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }

            ctx.restore();
            // 绘制可见区域光线
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            if (currPlayer) ctx.arc(currPlayer.position.x, currPlayer.position.y, config.player.sightRadius, 0, Math.PI * 2);
            ctx.fill();
            // 绘制本玩家
            this._resourceManager.drawPlayer(ctx, [this._resourceManager.currentPlayerId], '#333', '#f00');
            // 绘制射击
            this._resourceManager.shootingCaches.forEach(function (cache) {
                cache.draw(ctx, _this2._resourceManager);
            });
            // 绘制奔跑
            this._resourceManager.mainPROTCache.runningPROTs.forEach(function (runningPROT) {
                ctx.save();
                // 绘制奔跑范围视野中所有的玩家
                ctx.beginPath();
                ctx.arc(runningPROT.position.x, runningPROT.position.y, config.player.runningSightRadius - 1, 0, Math.PI * 2);
                ctx.clip();
                _this2._resourceManager.drawPlayer(ctx, runningPROT.playerIdsInSight, '#fff', '#f00');
                ctx.restore();
                // 绘制奔跑视野
                ctx.beginPath();
                ctx.fillStyle = 'rgba(255,255,255,0.75)';
                ctx.arc(runningPROT.position.x, runningPROT.position.y, config.player.runningSightRadius, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
            if (this._resourceManager.shooingInAimEffect) this._resourceManager.shooingInAimEffect.draw(ctx);
            this._resourceManager.shootedEffects.forEach(function (p) {
                return p.draw(ctx);
            });
        }
    }]);

    return render;
}();

exports.render = render;

var resourcesManager = function () {
    function resourcesManager() {
        _classCallCheck(this, resourcesManager);

        this.playerBasicPROTs = [];
        this.barricades = [];
        this.propHps = [];
        this.propGuns = [];
        this.shootedEffects = [];
        this.shootingCaches = [];
    }

    _createClass(resourcesManager, [{
        key: "getPlayerPROT",
        value: function getPlayerPROT(playerId) {
            return this.mainPROTCache.playerPROTs.find(function (p) {
                return p.id == playerId;
            });
        }
    }, {
        key: "getPlayerBPROT",
        value: function getPlayerBPROT(playerId) {
            return this.playerBasicPROTs.find(function (p) {
                return p.id == playerId;
            });
        }
    }, {
        key: "drawEdge",
        value: function drawEdge(ctx) {
            ctx.beginPath();
            ctx.strokeStyle = '#111';
            ctx.fillStyle = '#000';
            ctx.fillRect(this.edge.point1.x, this.edge.point1.y, this.edge.point2.x - this.edge.point1.x, this.edge.point2.y - this.edge.point1.y);
            ctx.strokeRect(this.edge.point1.x, this.edge.point1.y, this.edge.point2.x - this.edge.point1.x, this.edge.point2.y - this.edge.point1.y);
        }
    }, {
        key: "drawPlayer",
        value: function drawPlayer(ctx, playerIds, fillStyle, strokeStyle) {
            ctx.save();
            ctx.fillStyle = fillStyle;
            ctx.strokeStyle = strokeStyle;
            ctx.textAlign = 'center';
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = playerIds[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var playerId = _step5.value;

                    var player = this.getPlayerPROT(playerId);
                    if (!player) continue;
                    ctx.beginPath();
                    ctx.arc(player.position.x, player.position.y, config.player.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(player.position.x, player.position.y);
                    ctx.lineTo(config.player.radius * Math.cos(player.angle) + player.position.x, config.player.radius * Math.sin(player.angle) + player.position.y);
                    ctx.stroke();
                    ctx.strokeStyle = 'rgba(0,255,0,.5)';
                    ctx.lineWidth = 3;
                    var gap = Math.PI / 25;
                    var perimeter = Math.PI * 2 - config.player.maxHp * gap;
                    for (var i = 0; i < player.hp; i++) {
                        ctx.beginPath();
                        ctx.arc(player.position.x, player.position.y, config.player.radius - 1.5, i * perimeter / config.player.maxHp + i * gap - Math.PI / 2, (i + 1) * perimeter / config.player.maxHp + i * gap - Math.PI / 2);
                        ctx.stroke();
                    }
                    ctx.strokeStyle = 'rgba(0,0,0,.5)';
                    ctx.lineWidth = 3;
                    gap = Math.PI / 50;
                    perimeter = Math.PI * 2 - player.maxBullet * gap;
                    for (var _i = 0; _i < player.maxBullet; _i++) {
                        ctx.beginPath();
                        ctx.arc(player.position.x, player.position.y, config.player.radius + 1.5, _i * perimeter / player.maxBullet + _i * gap - Math.PI / 2, (_i + 1) * perimeter / player.maxBullet + _i * gap - Math.PI / 2);
                        ctx.stroke();
                    }
                    ctx.strokeStyle = 'rgba(255,255,255,.5)';
                    ctx.lineWidth = 3;
                    for (var _i2 = 0; _i2 < player.bullet; _i2++) {
                        ctx.beginPath();
                        ctx.arc(player.position.x, player.position.y, config.player.radius + 1.5, _i2 * perimeter / player.maxBullet + _i2 * gap - Math.PI / 2, (_i2 + 1) * perimeter / player.maxBullet + _i2 * gap - Math.PI / 2);
                        ctx.stroke();
                    }
                    var playerBasic = this.getPlayerBPROT(player.id);
                    if (playerBasic) {
                        ctx.fillText(playerBasic.name, player.position.x, player.position.y + config.player.radius + 15);
                    }
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            ctx.restore();
        }
    }]);

    return resourcesManager;
}();

var resource = function () {
    function resource() {
        _classCallCheck(this, resource);

        this._isDisposed = false;
    }

    _createClass(resource, [{
        key: "dispose",
        value: function dispose() {
            var manager = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            this._isDisposed = true;
        }
    }]);

    return resource;
}();

var shootingCache = function (_resource) {
    _inherits(shootingCache, _resource);

    function shootingCache(p) {
        _classCallCheck(this, shootingCache);

        var _this3 = _possibleConstructorReturn(this, (shootingCache.__proto__ || Object.getPrototypeOf(shootingCache)).call(this));

        _this3._isSightEnd = false;
        _this3._isEnd = false;
        _this3._fadeOutTime = 20;
        _this3.id = p.id;
        _this3._shootingPosition = p.position;
        _this3._angle = p.angle;
        _this3._playerIdsInSight = p.playerIdsInSight;
        _this3._shootingPlayerId = p.shootingPlayerId;
        _this3._bulletPosition = p.bulletPosition;
        return _this3;
    }

    _createClass(shootingCache, [{
        key: "onDuringShootingPROT",
        value: function onDuringShootingPROT(p, manager) {
            this._isSightEnd = p.isSightEnd;
            if (p.isEnd) {
                if (this._shootingPlayerId == manager.currentPlayerId && p.shootedPlayerId) {
                    manager.shooingInAimEffect = new shootingInAimEffect('击中');
                }
                if (p.shootedPlayerId == manager.currentPlayerId) {
                    manager.shootedEffects.push(new shootedEffect(this._angle + Math.PI));
                }
                this._isEnd = true;
            }
            this._bulletPosition = p.bulletPosition;
            this._playerIdsInSight = p.playerIdsInSight;
        }
    }, {
        key: "draw",
        value: function draw(ctx, manager) {
            if (this._isEnd && this._fadeOutTime <= 0) {
                this.dispose(manager);
            }
            if (!this._isSightEnd) {
                ctx.save();
                // 绘制射击可见区域中所有玩家
                ctx.beginPath();
                ctx.arc(this._shootingPosition.x, this._shootingPosition.y, config.player.shootingSightRadius - 1, 0, Math.PI * 2);
                ctx.clip();
                manager.drawPlayer(ctx, this._playerIdsInSight, '#fff', '#f00');
                ctx.restore();
                // 绘制射击可见区域
                ctx.beginPath();
                ctx.fillStyle = 'rgba(255,255,0,0.25)';
                ctx.strokeStyle = 'rgba(255,255,0,0.25)';
                ctx.lineWidth = 3;
                ctx.arc(this._shootingPosition.x, this._shootingPosition.y, config.player.shootingSightRadius, 0, Math.PI * 2);
                ctx.fill();
            }
            if (!this._isEnd) {
                // 绘制子弹
                ctx.beginPath();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 4;
                ctx.moveTo(this._bulletPosition.x - 10 * Math.cos(this._angle), this._bulletPosition.y - 10 * Math.sin(this._angle));
                ctx.lineTo(this._bulletPosition.x + 10 * Math.cos(this._angle), this._bulletPosition.y + 10 * Math.sin(this._angle));
                ctx.stroke();
            }
            ctx.beginPath();
            if (this._isEnd) {
                ctx.strokeStyle = "rgba(255,255,255," + --this._fadeOutTime / 80 + ")";
            } else {
                ctx.strokeStyle = 'rgba(255,255,255,.25)';
            }
            ctx.lineWidth = 4;
            ctx.moveTo(this._shootingPosition.x, this._shootingPosition.y);
            ctx.lineTo(this._bulletPosition.x, this._bulletPosition.y);
            ctx.stroke();
        }
    }, {
        key: "dispose",
        value: function dispose(manager) {
            var _this4 = this;

            _get(shootingCache.prototype.__proto__ || Object.getPrototypeOf(shootingCache.prototype), "dispose", this).call(this, manager);
            var i = manager.shootingCaches.findIndex(function (pp) {
                return pp == _this4;
            });
            if (i != -1) manager.shootingCaches.splice(i, 1);
        }
    }]);

    return shootingCache;
}(resource);

var shootedEffect = function (_resource2) {
    _inherits(shootedEffect, _resource2);

    function shootedEffect(angle) {
        _classCallCheck(this, shootedEffect);

        var _this5 = _possibleConstructorReturn(this, (shootedEffect.__proto__ || Object.getPrototypeOf(shootedEffect)).call(this));

        _this5._timeout = 10;
        _this5._angle = angle;
        return _this5;
    }

    _createClass(shootedEffect, [{
        key: "draw",
        value: function draw(ctx) {
            if (this._isDisposed) return;
            ctx.save();
            ctx.strokeStyle = '#f00';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, 50, this._angle - Math.PI / 32, this._angle + Math.PI / 32);
            ctx.stroke();
            ctx.restore();
            if (--this._timeout <= 0) {
                this.dispose();
            }
        }
    }]);

    return shootedEffect;
}(resource);

var shootingInAimEffect = function (_resource3) {
    _inherits(shootingInAimEffect, _resource3);

    function shootingInAimEffect(text) {
        _classCallCheck(this, shootingInAimEffect);

        var _this6 = _possibleConstructorReturn(this, (shootingInAimEffect.__proto__ || Object.getPrototypeOf(shootingInAimEffect)).call(this));

        _this6._fontsize = 20;
        _this6._text = text;
        return _this6;
    }

    _createClass(shootingInAimEffect, [{
        key: "draw",
        value: function draw(ctx) {
            if (this._isDisposed) return;
            ctx.save();
            ctx.font = this._fontsize + "px \u5FAE\u8F6F\u96C5\u9ED1";
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.fillText(this._text, ctx.canvas.width / 2, 50);
            ctx.restore();
            if (++this._fontsize > 50) {
                this.dispose();
            }
        }
    }]);

    return shootingInAimEffect;
}(resource);

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = window.$;

/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = window.Vue;

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var toastr = __webpack_require__(4);
var fromClientPROT = __webpack_require__(1);
var vueData = __webpack_require__(0);
var dom_manager_1 = __webpack_require__(2);
var game_core_1 = __webpack_require__(3);

var main = function () {
    function main() {
        var _this = this;

        _classCallCheck(this, main);

        this._dataLengthPerSec = 0;
        var dm = new dom_manager_1.domManager(this._connectWebSocketServer.bind(this));
        this._gameCore = new game_core_1.gameCore(this._send.bind(this), dm);
        setInterval(function () {
            console.log(_this._dataLengthPerSec / 1024 + " KB/s");
            _this._dataLengthPerSec = 0;
        }, 1000);
    }

    _createClass(main, [{
        key: "_connectWebSocketServer",
        value: function _connectWebSocketServer() {
            if (vueData.indexCommon.activeWebSocket) {
                var url = "ws://" + vueData.indexCommon.activeWebSocket.ip + ":" + vueData.indexCommon.activeWebSocket.port + "/";
                if (this._ws == null) {
                    this._connect(url);
                } else if (this._ws.url != url) {
                    this._ws.close();
                    this._connect(url);
                } else {
                    this._send(new fromClientPROT.initialize(vueData.indexCommon.name, vueData.gameInitModal.resumeGame));
                }
            }
        }
    }, {
        key: "_connect",
        value: function _connect(url) {
            var _this2 = this;

            this._ws = new WebSocket(url);
            toastr.info('正在连接服务器...');
            this._ws.onopen = function () {
                toastr.clear();
                toastr.success('服务器连接成功');
                _this2._send(new fromClientPROT.initialize(vueData.gameInitModal.common.name, vueData.gameInitModal.resumeGame));
            };
            this._ws.onmessage = function (e) {
                _this2._dataLengthPerSec += e.data.length;
                var protocol = JSON.parse(e.data);
                _this2._gameCore.protocolReceived(protocol);
            };
            this._ws.onclose = this._ws.onerror = function () {
                toastr.error('服务器断开连接');
            };
        }
    }, {
        key: "_send",
        value: function _send(protocol) {
            if (this._ws && this._ws.readyState == WebSocket.OPEN) this._ws.send(JSON.stringify(protocol));
        }
    }]);

    return main;
}();

new main();

/***/ })
/******/ ]);
//# sourceMappingURL=bundle.js.map