import * as express from 'express';
import * as cp from 'child_process';
import { sessionParser } from './sessionParser';
import * as bodyParser from 'body-parser';
import { main as mainLogger, useExpressLogger } from './log';

import * as config from '../../config';
import * as httpPROT from '../shared/http_prot';

export type webSocketServerMap = Map<cp.ChildProcess, { ip: string, port: number }>;

export class httpServer {
	private _webSocketServerMap: webSocketServerMap;
	/**
	 * 主后台服务，管理HTTP服务与游戏服务
	 *
	 * @param callback 监听成功回调函数
	 */
	constructor(port: number, webSocketServerMap: webSocketServerMap) {
		this._webSocketServerMap = webSocketServerMap;

		let app = express();
		this._configExpress(app);

		app.listen(port, () => {
			mainLogger.info(`Http Server is listening on port ${port}`);
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
		app.use(sessionParser);

		app.use('/public', express.static('public'));

		// 不记录静态资源
		app.use(useExpressLogger);

		app.get('/', (req, res) => {
			(req.session as Express.Session)['test'] = 1;
			res.render('index', { useCDN: config.useCDN, user: null });
		});

		app.get('/websockets', (req, res) => {
			let protocol: httpPROT.webSocketResponse[] = [];
			this._webSocketServerMap.forEach(p => {
				protocol.push(p);
			});
			res.json(protocol);
		});
	}
}