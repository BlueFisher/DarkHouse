"use strict";
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const log_1 = require("./log");
const config = require("../config");
const game_server_1 = require("./game_server");
class server {
    /**
     * 主后台服务，管理HTTP服务与游戏服务
     *
     * @param callback 监听成功回调函数 (isHttp: 是否为HTTP服务器, port: 端口号)
     */
    constructor(callback) {
        this._gameServers = [];
        this._sessionParser = session({
            secret: 'I6zoBZ0LVYPi9Ujt',
            name: 'sid',
            resave: false,
            saveUninitialized: true,
            cookie: {
                expires: new Date(Date.now() + config.sessionAge),
                maxAge: config.sessionAge
            }
        });
        let app = express();
        this._configExpress(app);
        app.listen(config.httpPort, () => {
            callback(true, config.httpPort);
        });
        config.webSockets.forEach(p => {
            this._gameServers.push(new game_server_1.gameServer(p.ip, p.port, this._sessionParser, () => {
                callback(false, p.port);
            }));
        });
    }
    _configExpress(app) {
        app.set('view engine', 'ejs');
        app.use(bodyParser.json({
            limit: '1mb'
        }));
        app.use(bodyParser.urlencoded({
            extended: true
        }));
        app.use(this._sessionParser);
        app.use('/public', express.static('public'));
        // 不记录静态资源
        app.use(log_1.useExpressLogger);
        app.get('/', (req, res) => {
            req.session['test'] = 1;
            res.render('index', { useCDN: config.useCDN, user: null });
        });
        app.get('/websockets', (req, res) => {
            let protocol = [];
            this._gameServers.forEach(s => {
                protocol.push({
                    ip: s.ip,
                    port: s.port
                });
            });
            res.json(protocol);
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = server;
//# sourceMappingURL=main.js.map