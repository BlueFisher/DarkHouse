"use strict";
const toastr = require("toastr");
const game_core_1 = require("./game_core");
class main {
    constructor() {
        this._lengthPerSec = 0;
        this._connectWebSocket();
        adjustCanvasSize();
        window.onresize = () => {
            adjustCanvasSize();
        };
        function adjustCanvasSize() {
            let canvas = document.querySelector('#stage');
            canvas.height = window.innerHeight;
            canvas.width = window.innerWidth;
        }
        setInterval(() => {
            console.log(`${this._lengthPerSec / 1024} KB/s`);
            this._lengthPerSec = 0;
        }, 1000);
    }
    _connectWebSocket() {
        let url = `ws://localhost:8080/`;
        this._connect(url);
    }
    _connect(url) {
        this._ws = new WebSocket(url);
        toastr.info('正在连接服务器...');
        this._ws.onopen = () => {
            toastr.clear();
            toastr.success('服务器连接成功');
            this._gameCore = new game_core_1.gameCore(this._send.bind(this));
        };
        this._ws.onmessage = (e) => {
            let data = e.data;
            this._lengthPerSec += data.length;
            let protocol = JSON.parse(e.data);
            this._gameCore.protocolReceived(protocol);
        };
        this._ws.onclose = this._ws.onerror = () => {
            toastr.error('服务器断开连接');
        };
    }
    _send(protocol) {
        this._ws.send(JSON.stringify(protocol));
    }
}
new main();
//# sourceMappingURL=main.js.map