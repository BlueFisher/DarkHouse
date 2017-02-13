import { webSocketServerMap, httpServer } from './lib/server/http_server';
import * as config from './config';
import * as cp from 'child_process';

const fork = cp.fork;

let webSocketServers: webSocketServerMap = new Map();

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