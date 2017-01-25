"use strict";
class errorResponse {
    constructor(message) {
        this.message = message;
    }
}
exports.errorResponse = errorResponse;
class webSocketResponse {
    constructor(ip, port, canResume) {
        this.ip = ip,
            this.port = port,
            this.canResumeGame = canResume;
    }
}
exports.webSocketResponse = webSocketResponse;
;
class accountRequest {
}
exports.accountRequest = accountRequest;
class accountResponse {
}
exports.accountResponse = accountResponse;
//# sourceMappingURL=http_prot.js.map