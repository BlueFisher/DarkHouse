let env = process.env.NODE_ENV || 'production';
env = env.toLowerCase();

let mongoUrl = 'mongodb://localhost:27017/darkhouse'; // dev模式使用的mongoDB地址
let sessionAge = 7 * 24 * 60 * 60 * 1000; // session时间
let httpPort = 80; // HTTP端口
let useCDN = false; // 是否使用CDN
let tickrate = 60; // 服务器每秒刷新帧数
let mainInterval = 1000 / tickrate;
let webSockets = [{
	ip: 'localhost',
	port: 8080
}];

if (env == 'production') {
	try {
		mongoUrl = require('./mongo_url');
	} catch (e) {
		console.error('No mongo_url.js in production mode');
		process.exit(1);
	}

	useCDN = true;

	webSockets = [{
		ip: '115.28.160.141',
		port: 8080
	}];
}

export { mongoUrl, sessionAge, httpPort, useCDN, mainInterval, webSockets };