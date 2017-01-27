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
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
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
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var toastr = __webpack_require__(1);
	var fromClientPROT = __webpack_require__(2);
	var vueData = __webpack_require__(3);
	var dom_manager_1 = __webpack_require__(4);
	var game_core_1 = __webpack_require__(7);
	
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

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = window.toastr;

/***/ },
/* 2 */
/***/ function(module, exports) {

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
	    type[type["shoot"] = 5] = "shoot";
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
	
	var shoot = function (_baseProtocol6) {
	    _inherits(shoot, _baseProtocol6);
	
	    function shoot() {
	        _classCallCheck(this, shoot);
	
	        return _possibleConstructorReturn(this, (shoot.__proto__ || Object.getPrototypeOf(shoot)).call(this, type.shoot));
	    }
	
	    return shoot;
	}(baseProtocol);
	
	exports.shoot = shoot;

/***/ },
/* 3 */
/***/ function(module, exports) {

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

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var $ = __webpack_require__(5);
	var vue = __webpack_require__(6);
	var vueData = __webpack_require__(3);
	
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

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = window.$;

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = window.Vue;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var fromClientPROT = __webpack_require__(2);
	var toClientPROT = __webpack_require__(8);
	var config = __webpack_require__(9);
	var vueData = __webpack_require__(3);
	
	var gameCore = function () {
	    function gameCore(sendFunc, domManager) {
	        _classCallCheck(this, gameCore);
	
	        this._isGameOn = false;
	        this._canvas = document.querySelector('#stage');
	        this._playerBasicPROTs = [];
	        this._barricades = [];
	        this._sendFunc = sendFunc;
	        this._domManager = domManager;
	        this._initlializeCanvasEvents();
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
	            var _this = this;
	
	            switch (protocol.type) {
	                case toClientPROT.type.pong:
	                    var now = new Date();
	                    var ping = now.getTime() - this._pingTime.getTime();
	                    vueData.index.ping = ping;
	                    setTimeout(function () {
	                        _this._sendPing();
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
	            var _this2 = this;
	
	            this._canvas.addEventListener('mousemove', function (e) {
	                var point = {
	                    x: e.pageX - _this2._canvas.offsetLeft,
	                    y: e.pageY - _this2._canvas.offsetTop
	                };
	                var x = point.x - _this2._canvas.width / 2;
	                var y = point.y - _this2._canvas.height / 2;
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
	                var protocol = new fromClientPROT.rotate(angle);
	                _this2._send(protocol);
	            });
	            this._canvas.addEventListener('keydown', function (e) {
	                if (e.keyCode == 32) {
	                    var protocol = new fromClientPROT.stopMoving(true);
	                    _this2._send(protocol);
	                }
	                if (e.keyCode == 87) {
	                    var _protocol = new fromClientPROT.startRunning(true);
	                    _this2._send(_protocol);
	                }
	            });
	            this._canvas.addEventListener('keyup', function (e) {
	                if (e.keyCode == 32) {
	                    var protocol = new fromClientPROT.stopMoving(false);
	                    _this2._send(protocol);
	                }
	                if (e.keyCode == 87) {
	                    var _protocol2 = new fromClientPROT.startRunning(false);
	                    _this2._send(_protocol2);
	                }
	            });
	            this._canvas.addEventListener('blur', function (e) {
	                var protocol = new fromClientPROT.stopMoving(true);
	                _this2._send(protocol);
	            });
	            this._canvas.addEventListener('mouseout', function (e) {
	                var protocol = new fromClientPROT.stopMoving(true);
	                _this2._send(protocol);
	            });
	            this._canvas.addEventListener('click', function (e) {
	                _this2._sendFunc(new fromClientPROT.shoot());
	            });
	            var reqAnimation = function reqAnimation() {
	                window.requestAnimationFrame(function () {
	                    _this2._draw();
	                    reqAnimation();
	                });
	            };
	            reqAnimation();
	        }
	    }, {
	        key: "_onInitialize",
	        value: function _onInitialize(protocol) {
	            this._canvas.focus();
	            this._currentPlayerId = protocol.currPlayerId;
	            this._playerBasicPROTs = protocol.players;
	            this._barricades = protocol.barricades;
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
	            var _this3 = this;
	
	            vueData.index.rankList = [];
	            protocol.rankList.forEach(function (p) {
	                var player = _this3._playerBasicPROTs.find(function (pp) {
	                    return pp.id == p.id;
	                });
	                if (player) vueData.index.rankList.push({
	                    name: player.name,
	                    killTimes: p.killTimes
	                });
	            });
	            this._mainPROTCache = protocol;
	            protocol.newPlayerBPROTs.forEach(function (p) {
	                _this3._playerBasicPROTs.push(p);
	            });
	        }
	    }, {
	        key: "_getPlayerPROT",
	        value: function _getPlayerPROT(playerId) {
	            return this._mainPROTCache.playerBPROTs.find(function (p) {
	                return p.id == playerId;
	            });
	        }
	    }, {
	        key: "_drawPlayer",
	        value: function _drawPlayer(ctx, playerIds, fillStyle, strokeStyle) {
	            var _this4 = this;
	
	            ctx.save();
	            ctx.fillStyle = fillStyle;
	            ctx.strokeStyle = strokeStyle;
	            ctx.textAlign = 'center';
	            var _iteratorNormalCompletion = true;
	            var _didIteratorError = false;
	            var _iteratorError = undefined;
	
	            try {
	                var _loop = function _loop() {
	                    var playerId = _step.value;
	
	                    var player = _this4._getPlayerPROT(playerId);
	                    if (!player) return "continue";
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
	                    var playerBasic = _this4._playerBasicPROTs.find(function (p) {
	                        return player != null && p.id == player.id;
	                    });
	                    if (playerBasic) {
	                        ctx.fillText(playerBasic.name, player.position.x, player.position.y + config.player.radius + 15);
	                    }
	                };
	
	                for (var _iterator = playerIds[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	                    var _ret = _loop();
	
	                    if (_ret === "continue") continue;
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
	
	            ctx.restore();
	        }
	    }, {
	        key: "_draw",
	        value: function _draw() {
	            var _this5 = this;
	
	            if (!this._isGameOn || !this._mainPROTCache) return;
	            var ctx = this._canvas.getContext('2d');
	            ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
	            var currPlayer = this._getPlayerPROT(this._mainPROTCache.currPlayerId);
	            ctx.save();
	            if (currPlayer) ctx.setTransform(1.5, 0, 0, 1.5, this._canvas.width / 2 - currPlayer.position.x * 1.5, this._canvas.height / 2 - currPlayer.position.y * 1.5);
	            // 绘制障碍物
	            ctx.fillStyle = '#111';
	            var _iteratorNormalCompletion2 = true;
	            var _didIteratorError2 = false;
	            var _iteratorError2 = undefined;
	
	            try {
	                for (var _iterator2 = this._barricades[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	                    var barricade = _step2.value;
	
	                    ctx.fillRect(barricade.point1.x, barricade.point1.y, barricade.point2.x - barricade.point1.x, barricade.point2.y - barricade.point1.y);
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
	
	            ctx.fillStyle = '#f00';
	            var _iteratorNormalCompletion3 = true;
	            var _didIteratorError3 = false;
	            var _iteratorError3 = undefined;
	
	            try {
	                for (var _iterator3 = this._mainPROTCache.propHpPROTs[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
	                    var propHp = _step3.value;
	
	                    ctx.beginPath();
	                    ctx.arc(propHp.position.x, propHp.position.y, config.hp.radius, 0, Math.PI * 2);
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
	            this._drawPlayer(ctx, this._mainPROTCache.playerIdsInSight, '#fff', '#f00');
	            // 绘制可见区域中所有障碍物
	            ctx.fillStyle = '#fff';
	            var _iteratorNormalCompletion4 = true;
	            var _didIteratorError4 = false;
	            var _iteratorError4 = undefined;
	
	            try {
	                for (var _iterator4 = this._barricades[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
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
	            this._drawPlayer(ctx, [this._mainPROTCache.currPlayerId], '#333', '#f00');
	            // 绘制射击
	            this._mainPROTCache.shootPROTs.forEach(function (shootPROT) {
	                ctx.save();
	                // 绘制射击可见区域中所有玩家
	                ctx.beginPath();
	                ctx.arc(shootPROT.position.x, shootPROT.position.y, config.player.shootingSightRadius - 1, 0, Math.PI * 2);
	                ctx.clip();
	                _this5._drawPlayer(ctx, shootPROT.playerIdsInSight, '#fff', '#f00');
	                ctx.restore();
	                if (shootPROT.shootedPlayerId) {
	                    _this5._drawPlayer(ctx, [shootPROT.shootedPlayerId], '#fff', '#f00');
	                }
	                // 绘制射击可见区域
	                ctx.beginPath();
	                ctx.fillStyle = 'rgba(255,255,0,0.25)';
	                ctx.strokeStyle = 'rgba(255,255,0,0.25)';
	                ctx.lineWidth = 3;
	                ctx.arc(shootPROT.position.x, shootPROT.position.y, config.player.shootingSightRadius, 0, Math.PI * 2);
	                ctx.fill();
	                // 绘制射击射线
	                ctx.beginPath();
	                ctx.moveTo(shootPROT.position.x, shootPROT.position.y);
	                if (shootPROT.collisionPoint) {
	                    ctx.lineTo(shootPROT.collisionPoint.x, shootPROT.collisionPoint.y);
	                } else {
	                    var d = Math.max(_this5._canvas.width, _this5._canvas.height);
	                    ctx.lineTo(shootPROT.position.x + d * Math.cos(shootPROT.angle), shootPROT.position.y + d * Math.sin(shootPROT.angle));
	                }
	                ctx.stroke();
	            });
	            // 绘制奔跑
	            this._mainPROTCache.runningPROTs.forEach(function (runningPROT) {
	                ctx.save();
	                // 绘制奔跑范围视野中所有的玩家
	                ctx.beginPath();
	                ctx.arc(runningPROT.position.x, runningPROT.position.y, config.player.runningSightRadius - 1, 0, Math.PI * 2);
	                ctx.clip();
	                _this5._drawPlayer(ctx, runningPROT.playerIdsInSight, '#fff', '#f00');
	                ctx.restore();
	                // 绘制奔跑视野
	                ctx.beginPath();
	                ctx.fillStyle = 'rgba(255,255,255,0.75)';
	                ctx.arc(runningPROT.position.x, runningPROT.position.y, config.player.runningSightRadius, 0, Math.PI * 2);
	                ctx.fill();
	            });
	            ctx.restore();
	        }
	    }]);
	
	    return gameCore;
	}();
	
	exports.gameCore = gameCore;

/***/ },
/* 8 */
/***/ function(module, exports) {

	"use strict";
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
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
	
	    function initialize(currPlayerId, players, barricades, propHps) {
	        _classCallCheck(this, initialize);
	
	        var _this2 = _possibleConstructorReturn(this, (initialize.__proto__ || Object.getPrototypeOf(initialize)).call(this, type.init));
	
	        _this2.currPlayerId = currPlayerId;
	        _this2.players = players;
	        _this2.barricades = barricades;
	        _this2.propHps = propHps;
	        return _this2;
	    }
	
	    return initialize;
	}(baseProtocol);
	
	exports.initialize = initialize;
	
	var mainPROT = function (_baseProtocol3) {
	    _inherits(mainPROT, _baseProtocol3);
	
	    function mainPROT(currPlayer, playersInSight) {
	        _classCallCheck(this, mainPROT);
	
	        var _this3 = _possibleConstructorReturn(this, (mainPROT.__proto__ || Object.getPrototypeOf(mainPROT)).call(this, type.main));
	
	        _this3.playerBPROTs = [];
	        _this3.newPlayerBPROTs = [];
	        _this3.shootPROTs = [];
	        _this3.runningPROTs = [];
	        _this3.propHpPROTs = [];
	        _this3.rankList = [];
	        _this3.currPlayerId = currPlayer;
	        _this3.playerIdsInSight = playersInSight;
	        return _this3;
	    }
	
	    _createClass(mainPROT, [{
	        key: "formatPlayerPROT",
	        value: function formatPlayerPROT(format) {
	            var arr = [this.currPlayerId];
	            arr = arr.concat(this.playerIdsInSight);
	            var _iteratorNormalCompletion = true;
	            var _didIteratorError = false;
	            var _iteratorError = undefined;
	
	            try {
	                for (var _iterator = this.shootPROTs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	                    var shootPROT = _step.value;
	
	                    arr = arr.concat(shootPROT.playerIdsInSight);
	                    if (shootPROT.shootedPlayerId) arr.push(shootPROT.shootedPlayerId);
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
	
	            var _iteratorNormalCompletion2 = true;
	            var _didIteratorError2 = false;
	            var _iteratorError2 = undefined;
	
	            try {
	                for (var _iterator2 = this.runningPROTs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	                    var runningPROT = _step2.value;
	
	                    arr = arr.concat(runningPROT.playerIdsInSight);
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
	
	            var json = {};
	            var _iteratorNormalCompletion3 = true;
	            var _didIteratorError3 = false;
	            var _iteratorError3 = undefined;
	
	            try {
	                for (var _iterator3 = arr[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
	                    var i = _step3.value;
	
	                    if (!json[i]) {
	                        json[i] = 1;
	                        var playerPROT = format(i);
	                        if (playerPROT) this.playerBPROTs.push(playerPROT);
	                    }
	                }
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

/***/ },
/* 9 */
/***/ function(module, exports) {

	"use strict";
	
	var player;
	(function (player) {
	    player.movingStep = 2;
	    player.runingStep = 5;
	    player.movingInterval = 33;
	    player.maxHp = 3;
	    player.radius = 20;
	    player.sightRadius = 100;
	    player.runningSightRadius = 80;
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
	var stage;
	(function (stage) {
	    stage.width = 500;
	    stage.height = 500;
	})(stage = exports.stage || (exports.stage = {}));

/***/ }
/******/ ]);
//# sourceMappingURL=bundle.js.map