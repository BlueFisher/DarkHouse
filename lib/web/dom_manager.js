"use strict";
const $ = require("jquery");
const vue = require("vue");
const vueData = require("./vue_data");
class domManager {
    constructor(connectWebSocketServer) {
        this._connectWebSocketServer = connectWebSocketServer;
        this._initializeVue();
        this._initializeCanvas();
        this._initializeGame();
    }
    _initializeVue() {
        new vue({
            el: '#modal-gameinit',
            data: vueData.gameInitModal,
            methods: {
                startGame: () => {
                    vueData.gameInitModal.resumeGame = false;
                    $('#modal-gameinit').modal('hide');
                    gameOn();
                },
                resumeGame: () => {
                    vueData.gameInitModal.resumeGame = true;
                    $('#modal-gameinit').modal('hide');
                    gameOn();
                },
            }
        });
        new vue({
            el: '#modal-gameover',
            data: vueData.gameOverModal,
            methods: {
                startGameFromGameOver: () => {
                    $('#modal-gameover').modal('hide');
                    gameOn();
                }
            }
        });
        let gameOn = () => {
            this._connectWebSocketServer();
        };
    }
    _initializeCanvas() {
        let adjustCanvasSize = () => {
            let canvas = document.querySelector('#stage');
            canvas.height = window.innerHeight;
            canvas.width = window.innerWidth;
        };
        adjustCanvasSize();
        window.onresize = () => {
            adjustCanvasSize();
        };
    }
    gameOver(protocol) {
        $('#modal-gameover').on('shown.bs.modal', function () {
            $('#modal-gameover').find('.form-control').focus();
        }).modal({
            backdrop: 'static',
            keyboard: false
        });
    }
    _initializeGame() {
        $.getJSON('/websockets').then((protocol) => {
            vueData.indexCommon.webSockets = protocol;
            vueData.indexCommon.activeWebSocket = protocol[0];
            $('#modal-gameinit').find('.form-control').focus();
        });
        $('#modal-gameinit').modal({
            backdrop: 'static',
            keyboard: false
        });
    }
}
exports.domManager = domManager;
//# sourceMappingURL=dom_manager.js.map