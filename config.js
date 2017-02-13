"use strict";
exports.sessionAge = 7 * 24 * 60 * 60 * 1000;
exports.httpPort = 80;
exports.useCDN = true;
let tickrate = 60;
exports.mainInterval = 1000 / tickrate;
exports.mongoUrl = 'mongodb://localhost:27017/darkhouse';
exports.webSockets = [{
        ip: 'localhost',
        port: 8080
    }];
//# sourceMappingURL=config.js.map