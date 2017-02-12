"use strict";
const log4js = require("log4js");
log4js.configure({
    appenders: [
        {
            type: 'console',
            layout: {
                type: 'pattern',
                pattern: '%[[%d] [%p]%] [%c] - %m'
            }
        }
    ],
    replaceConsole: true
});
exports.main = log4js.getLogger('main');
exports.game = log4js.getLogger('game');
let expressLogger = log4js.getLogger('express');
exports.useExpressLogger = log4js.connectLogger(expressLogger, {
    level: log4js.levels.WARN,
    format: ':remote-addr :method :url :status - :response-time ms'
});
//# sourceMappingURL=log.js.map