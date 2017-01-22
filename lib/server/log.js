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
exports.logger = log4js.getLogger('global');
let expressLogger = log4js.getLogger('express');
exports.useLogger = log4js.connectLogger(expressLogger, {
    level: log4js.levels.INFO,
    format: ':remote-addr :method :url :status - :response-time ms'
});
//# sourceMappingURL=log.js.map