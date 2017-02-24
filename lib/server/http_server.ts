import * as cp from 'child_process';
import * as express from 'express';
import * as bodyParser from 'body-parser';

import * as config from '../../config';
import * as httpPROT from '../shared/http_prot';

import { main as mainLogger, useExpressLogger } from './log';
import { sessionParser } from './sessionParser';
import * as dbFuncs from './db_funcs';

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
		app.engine('html', require('ejs').renderFile);
		app.set('view engine', 'html');

		app.use(bodyParser.json({
			limit: '1mb'
		}));
		app.use(bodyParser.urlencoded({
			extended: true
		}));
		app.use(sessionParser);

		app.use('/public', express.static('public'));
		app.use('/lib', express.static('node_modules'));

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

		app.post('/isauth', async (req, res) => {
			let userId = (req.session as Express.Session)['userId'];
			if (userId) {
				let user = await dbFuncs.findUser(userId);
				if (user) {
					delete user.passwordHash;
					let protocol: httpPROT.accountResponse = user;
					res.json(protocol);
				}
			}

			res.status(403);
			res.end();
		});

		app.post('/signup', async (req, res) => {
			let body = req.body as httpPROT.accountRequest;
			let user = await dbFuncs.signup(body.email, body.password);
			if (user) {
				delete user.passwordHash;
				(req.session as Express.Session)['userId'] = user._id;
				let protocol: httpPROT.accountResponse = user;
				res.json(protocol);
			} else {
				res.status(403);
				let protocol: httpPROT.errorResponse = {
					message: '无法注册'
				};
				res.json(protocol);
			}
		});

		app.post('/signin', async (req, res) => {
			let body = req.body as httpPROT.accountRequest;
			let user = await dbFuncs.signin(body.email, body.password);
			if (user) {
				delete user.passwordHash;
				(req.session as Express.Session)['userId'] = user._id;
				let protocol: httpPROT.accountResponse = user;
				res.json(protocol);
			} else {
				res.status(403);
				let protocol: httpPROT.errorResponse = {
					message: '登录失败'
				};
				res.json(protocol);
			}
		});
	}
}