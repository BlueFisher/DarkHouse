import * as express from 'express';
import * as session from 'express-session';
import * as bodyParser from 'body-parser';
import { useExpressLogger } from './log';

import * as config from '../config';
import * as httpPROT from '../shared/http_prot';

import { gameServer } from './game_server';

class server {
	private _gameServers: gameServer[] = [];

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

		config.webSockets.forEach(p => {
			this._gameServers.push(new gameServer(p.ip, p.port, this._sessionParser, () => {
				callback(false, p.port);
			}));
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
		app.use(useExpressLogger);

		app.use('/public', express.static('public'));

		app.get('/', (req, res) => {
			(req.session as Express.Session)['test'] = 1;
			res.render('index', { useCDN: config.useCDN, user: null });
		});

		app.get('/websockets', (req, res) => {
			let protocol: httpPROT.webSocketResponse[] = [];
			this._gameServers.forEach(s => {
				protocol.push({
					ip: s.ip,
					port: s.port,
					canResumeGame: s.isPlayerOnGame((req.session as Express.Session)['userId'],
						req.sessionID as string)
				});
			})
			res.json(protocol);
		});
	}
}

export default server;