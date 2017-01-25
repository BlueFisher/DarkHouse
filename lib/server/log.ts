import * as log4js from 'log4js';

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

export let logger = log4js.getLogger('global');

let expressLogger= log4js.getLogger('express');
export let useExpressLogger = log4js.connectLogger(expressLogger, {
	level: log4js.levels.WARN,
	format: ':remote-addr :method :url :status - :response-time ms'
});
