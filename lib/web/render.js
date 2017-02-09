"use strict";
const resources_1 = require("./resources");
class render {
    constructor(protocol) {
        this._resourceManager = new resources_1.resourcesManager(protocol);
    }
    getPlayerBPROT(playerId) {
        return this._resourceManager.getPlayerBPROT(playerId);
    }
    onMainProtocol(protocol) {
        this._resourceManager.onMainProtocol(protocol);
    }
    draw(ctx) {
        let canvas = ctx.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let currPlayer = this._resourceManager.getPlayerPROT(this._resourceManager.currentPlayerId);
        if (!currPlayer)
            return;
        ctx.save();
        ctx.setTransform(1.5, 0, 0, 1.5, canvas.width / 2 - currPlayer.position.x * 1.5, canvas.height / 2 - currPlayer.position.y * 1.5);
        this._resourceManager.drawEdge(ctx);
        this._resourceManager.drawBarricade(ctx);
        this._resourceManager.drawProp(ctx);
        this._resourceManager.drawVisableArea(ctx, currPlayer);
        this._resourceManager.drawPlayer(ctx, [this._resourceManager.currentPlayerId], '#333', '#f00');
        // 绘制射击
        this._resourceManager.attackCaches.forEach(cache => {
            cache.draw(ctx, this._resourceManager);
        });
        this._resourceManager.drawRunning(ctx);
        ctx.restore();
        if (this._resourceManager.shooingInAimEffect)
            this._resourceManager.shooingInAimEffect.draw(ctx);
        this._resourceManager.attackedEffects.forEach(p => p.draw(ctx));
    }
}
exports.render = render;
//# sourceMappingURL=render.js.map