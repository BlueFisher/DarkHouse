"use strict";
exports.sessionAge = 7 * 24 * 60 * 60 * 1000;
exports.httpPort = 80;
exports.useCDN = true;
let tickrate = 60;
exports.mainInterval = 1000 / tickrate;
exports.webSockets = [{
        ip: 'localhost',
        port: 8080
    }, {
        ip: 'localhost',
        port: 8888
    }];
//# sourceMappingURL=config.js.map