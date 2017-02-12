import { httpServer } from './lib/server/http_server';
import * as config from './config';
import * as cp from 'child_process';

const fork = cp.fork;

// 初始化HTTP服务器WebSocket服务器
new httpServer(config.httpPort);

config.webSockets.forEach(p => {
	fork(`./lib/server/game_server`, [p.ip, p.port.toString()]);
});