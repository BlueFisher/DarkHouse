"use strict";
const session = require("express-session");
const connectMongo = require("connect-mongo");
const config = require("../../config");
const mongoStore = connectMongo(session);
exports.sessionParser = session({
    secret: 'I6zoBZ0LVYPi9Ujt',
    name: 'sid',
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: new Date(Date.now() + config.sessionAge),
        maxAge: config.sessionAge
    },
    store: new mongoStore({
        url: 'mongodb://localhost:27017/darkhouse',
    })
});
//# sourceMappingURL=sessionParser.js.map