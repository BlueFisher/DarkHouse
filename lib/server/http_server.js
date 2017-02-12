"use strict";
const express = require("express");
const sessionParser_1 = require("./sessionParser");
const bodyParser = require("body-parser");
const log_1 = require("./log");
const config = require("../../config");
class httpServer {
    /**
     * 主后台服务，管理HTTP服务与游戏服务
     *
     * @param callback 监听成功回调函数
     */
    constructor(port) {
        let app = express();
        this._configExpress(app);
        app.listen(port, () => {
            log_1.main.info(`Http Server is listening on port ${port}`);
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
        app.use(sessionParser_1.sessionParser);
        app.use('/public', express.static('public'));
        // 不记录静态资源
        app.use(log_1.useExpressLogger);
        app.get('/', (req, res) => {
            req.session['test'] = 1;
            res.render('index', { useCDN: config.useCDN, user: null });
        });
        app.get('/websockets', (req, res) => {
            let protocol = [];
            config.webSockets.forEach(s => {
                protocol.push({
                    ip: s.ip,
                    port: s.port
                });
            });
            res.json(protocol);
        });
    }
}
exports.httpServer = httpServer;
//# sourceMappingURL=http_server.js.map