"use strict";
let activeWebSocket;
let webSockets = [];
exports.indexCommon = {
    name: 'Default Player',
    activeWebSocket: activeWebSocket,
    webSockets: webSockets,
};
exports.index = {
    ping: 0
};
exports.gameInitModal = {
    common: exports.indexCommon,
    resumeGame: true,
    email: '',
    password: '',
    showAccount: false,
};
exports.gameOverModal = {
    common: exports.indexCommon,
    historyMaxShipsCount: 0
};
//# sourceMappingURL=vue_data.js.map