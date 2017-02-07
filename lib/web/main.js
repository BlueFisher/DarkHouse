"use strict";
const toastr = require("toastr");
const fromClientPROT = require("../shared/ws_prot_from_client");
const vueData = require("./vue_data");
const dom_manager_1 = require("./dom_manager");
const game_core_1 = require("./game_core");
class main {
    constructor() {
        this._dataLengthPerSec = 0;
        let dm = new dom_manager_1.domManager(this._connectWebSocketServer.bind(this));
        this._gameCore = new game_core_1.gameCore(this._send.bind(this), dm);
        setInterval(() => {
            console.log(`${this._dataLengthPerSec / 1024} KB/s`);
            this._dataLengthPerSec = 0;
        }, 1000);
    }
    _connectWebSocketServer() {
        if (vueData.indexCommon.activeWebSocket) {
            let url = `ws://${vueData.indexCommon.activeWebSocket.ip}:${vueData.indexCommon.activeWebSocket.port}/`;
            if (this._ws == null) {
                this._connect(url);
            }
            else if (this._ws.url != url) {
                this._ws.close();
                this._connect(url);
            }
            else {
                this._send(new fromClientPROT.initialize(vueData.indexCommon.name, vueData.gameInitModal.resumeGame));
            }
        }
    }
    _connect(url) {
        this._ws = new WebSocket(url);
        toastr.info('正在连接服务器...');
        this._ws.onopen = () => {
            toastr.clear();
            toastr.success('服务器连接成功');
            this._send(new fromClientPROT.initialize(vueData.gameInitModal.common.name, vueData.gameInitModal.resumeGame));
        };
        this._ws.onmessage = (e) => {
            this._dataLengthPerSec += e.data.length;
            let protocol = JSON.parse(e.data);
            this._gameCore.protocolReceived(protocol);
        };
        this._ws.onclose = this._ws.onerror = () => {
            toastr.error('服务器断开连接');
        };
    }
    _send(protocol) {
        if (this._ws && this._ws.readyState == WebSocket.OPEN)
            this._ws.send(JSON.stringify(protocol));
    }
}
new main();
//# sourceMappingURL=main.js.map