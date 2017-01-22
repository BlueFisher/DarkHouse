import server from './lib/server/main';

// 初始化HTTP服务器WebSocket服务器
new server((isHttp, port) => {
	if (isHttp) {
		console.log(`Http Server is listening on port ${port}`);
	} else {
		console.log(`WebSocket Server is listening on port ${port}`);
	}
});