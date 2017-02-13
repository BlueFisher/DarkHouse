"use strict";
const http_server_1 = require("./lib/server/http_server");
const config = require("./config");
const cp = require("child_process");
const fork = cp.fork;
let webSocketServers = new Map();
// 初始化HTTP服务器WebSocket服务器
new http_server_1.httpServer(config.httpPort, webSocketServers);
config.webSockets.forEach(p => {
    let f = fork(`./lib/server/game_server`, [p.ip, p.port.toString()]);
    webSocketServers.set(f, {
        ip: p.ip,
        port: p.port
    });
    f.on('close', () => {
        webSocketServers.delete(f);
    });
});
//# sourceMappingURL=main.js.map