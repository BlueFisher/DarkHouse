"use strict";
let activeWebSocket;
let webSockets = [];
exports.indexCommon = {
    name: 'Default Player',
    activeWebSocket: activeWebSocket,
    webSockets: webSockets,
};
let rankList = [];
exports.index = {
    ping: 0,
    rankList: rankList
};
exports.gameInitModal = {
    common: exports.indexCommon,
    resumeGame: true,
    email: '',
    password: '',
    showAccount: false,
};
let records = {
    shootingTimes: 0,
    shootingInAimTimes: 0,
    shootedTimes: 0,
    killTimes: 0
};
exports.gameOverModal = {
    common: exports.indexCommon,
    records: records
};
//# sourceMappingURL=vue_data.js.map