import * as express from 'express';
import * as session from 'express-session';
import * as bodyParser from 'body-parser';
import * as log4js from 'log4js';

import * as config from '../config';

import { gameServer } from './game_server';

class server {
	private _gameServers: gameServer;

	private _sessionParser = session({
		secret: 'I6zoBZ0LVYPi9Ujt',
		name: 'sid',
		resave: false,
		saveUninitialized: true,
		cookie: {
			expires: new Date(Date.now() + config.sessionAge),
			maxAge: config.sessionAge
		}
	});

	/**
	 * 主后台服务，管理HTTP服务与游戏服务
	 *
	 * @param callback 监听成功回调函数 (isHttp: 是否为HTTP服务器, port: 端口号)
	 */
	constructor(callback: (isHttp: boolean, port: number) => void) {
		let app = express();

		this._configExpress(app);

		app.listen(config.httpPort, () => {
			callback(true, config.httpPort);
		});

		new gameServer(config.webSocketIp, config.webSocketPort, this._sessionParser, () => {
			callback(false, config.webSocketPort);
		});
	}
	private _configExpress(app: express.Express) {
		app.set('view engine', 'ejs');

		app.use(bodyParser.json({
			limit: '1mb'
		}));
		app.use(bodyParser.urlencoded({
			extended: true
		}));
		app.use(this._sessionParser);
		// app.use(useLogger);

		app.use('/public', express.static('public'));

		app.get('/', (req, res) => {
			res.render('index', { useCDN: config.useCDN });
		});
	}
}

export default server;