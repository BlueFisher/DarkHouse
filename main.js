"use strict";
const main_1 = require("./lib/server/main");
// 初始化HTTP服务器WebSocket服务器
new main_1.default((isHttp, port) => {
    if (isHttp) {
        console.log(`Http Server is listening on port ${port}`);
    }
    else {
        console.log(`WebSocket Server is listening on port ${port}`);
    }
});
//# sourceMappingURL=main.js.map