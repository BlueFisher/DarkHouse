"use strict";
const http_server_1 = require("./lib/server/http_server");
const config = require("./config");
const cp = require("child_process");
const fork = cp.fork;
// 初始化HTTP服务器WebSocket服务器
new http_server_1.httpServer(config.httpPort);
config.webSockets.forEach(p => {
    fork(`./lib/server/game_server`, [p.ip, p.port.toString()]);
});
//# sourceMappingURL=main.js.map