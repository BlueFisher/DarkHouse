"use strict";
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const config = require("../config");
const game_server_1 = require("./game_server");
class server {
    /**
     * 主后台服务，管理HTTP服务与游戏服务
     *
     * @param callback 监听成功回调函数 (isHttp: 是否为HTTP服务器, port: 端口号)
     */
    constructor(callback) {
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
        new game_server_1.gameServer(config.webSocketIp, config.webSocketPort, this._sessionParser, () => {
            callback(false, config.webSocketPort);
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
        // app.use(useLogger);
        app.use('/public', express.static('public'));
        app.get('/', (req, res) => {
            res.render('index', { useCDN: config.useCDN });
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = server;
//# sourceMappingURL=main.js.map