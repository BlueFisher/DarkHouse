import * as session from 'express-session';
import * as connectMongo from 'connect-mongo';
import * as config from '../../config';

const mongoStore = connectMongo(session);

export let sessionParser = session({
	secret: 'I6zoBZ0LVYPi9Ujt',
	name: 'sid',
	resave: false,
	saveUninitialized: true,
	cookie: {
		expires: new Date(Date.now() + config.sessionAge),
		maxAge: config.sessionAge
	},
	store: new mongoStore({
		url: config.mongoUrl,
	})
});