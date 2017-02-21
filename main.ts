import * as cp from 'child_process';
const packageConfig = require('./package.json');

import * as config from './config';
import { main as mainLogger } from './lib/server/log';
import { webSocketServerMap, httpServer } from './lib/server/http_server';

const fork = cp.fork;

let webSocketServers: webSocketServerMap = new Map();

mainLogger.info(`${packageConfig.name} - v${packageConfig.version}`)

// 初始化HTTP服务器WebSocket服务器
new httpServer(config.httpPort, webSocketServers);

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