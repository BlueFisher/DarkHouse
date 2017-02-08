"use strict";
const events = require("events");
const player_1 = require("./player");
const barricade_1 = require("./barricade");
const prop_1 = require("./prop");
const config = require("../shared/game_config");
const serverConfig = require("../config");
const utils = require("../shared/utils");
const toClientPROT = require("../shared/ws_prot_to_client");
const point = utils.point;
class gameCore extends events.EventEmitter {
    constructor(width, height, edgeX = 0, edgeY = 0) {
        super();
        this._barricades = [];
        this._shootingCacheId = 0;
        this._shootingCaches = [];
        this._runningCache = new Map();
        this._playerManager = new player_1.playerManager();
        this._propManager = new prop_1.propManager();
        this._edge = new barricade_1.edge(new point(edgeX, edgeY), new point(edgeX + width, edgeY + height));
        this._barricades.push(new barricade_1.barricade(new point(240, 100), new point(260, 400)));
        this._barricades.push(new barricade_1.barricade(new point(100, 390), new point(400, 400)));
        this._initializeMainLoop();
    }
    _initializeMainLoop() {
        // 生成新加入玩家的基础协议
        let generateNewPlayersBasicPROTs = () => {
            let newPlayersBasicPROTs = this._playerManager.getAndClearNewPlayersCache().
                map(p => p.getPlayerBasicPROT());
            return newPlayersBasicPROTs;
        };
        // 生成射击协议
        let generateShootPROTs = () => {
            let shootPROTs = [];
            let duringShootingPROTs = [];
            for (let i = this._shootingCaches.length - 1; i >= 0; i--) {
                let cache = this._shootingCaches[i];
                // 如果是初次加入到射击缓存中
                if (cache.sightTimeCount == cache.shootingPlayer.getGun().shootingSightTimeOut) {
                    shootPROTs.push({
                        id: cache.id,
                        position: cache.shootingPosition,
                        angle: cache.angle,
                        playerIdsInSight: this._playerManager
                            .getPlayersInRadius(cache.shootingPosition, cache.shootingPlayer.getGun().shootingSightRadius)
                            .map(p => p.id),
                        shootingPlayerId: cache.shootingPlayer.id,
                        bulletPosition: cache.bulletPosition
                    });
                    cache.sightTimeCount--;
                }
                else {
                    let duringShootingPROT = {
                        id: cache.id,
                        bulletPosition: cache.bulletPosition,
                        playerIdsInSight: [],
                        isSightEnd: false,
                        isEnd: false
                    };
                    if (cache.sightTimeCount <= 0) {
                        duringShootingPROT.isSightEnd = true;
                    }
                    else {
                        duringShootingPROT.playerIdsInSight = this._playerManager
                            .getPlayersInRadius(cache.shootingPosition, cache.shootingPlayer.getGun().shootingSightRadius)
                            .map(p => p.id);
                    }
                    if (cache.collisionPoint) {
                        duringShootingPROT.shootedPlayerId = cache.shootedPlayer ? cache.shootedPlayer.id : undefined;
                        duringShootingPROT.isEnd = true;
                    }
                    duringShootingPROTs.push(duringShootingPROT);
                }
            }
            return [shootPROTs, duringShootingPROTs];
        };
        // 生成奔跑协议
        let runningSightRemainsStep = config.player.runningSightRemainsTime * serverConfig.mainInterval, runningSightDisapperStep = runningSightRemainsStep + config.player.runningSightDisapperTime * serverConfig.mainInterval;
        let generateRunningPROTs = (connectedPlayers) => {
            let runningPROTs = [];
            for (let runningPlayer of connectedPlayers.filter(p => p.canMove && p.isRunning)) {
                let runningCache = this._runningCache.get(runningPlayer);
                if (!runningCache) {
                    runningCache = 1;
                    this._runningCache.set(runningPlayer, runningCache);
                }
                if (runningCache >= 1 && runningCache <= runningSightRemainsStep) {
                    runningPROTs.push({
                        position: runningPlayer.position,
                        playerIdsInSight: this._playerManager
                            .getPlayersInRadius(runningPlayer.position, config.player.runningSightRadius)
                            .map(p => p.id)
                    });
                }
                if (runningCache >= runningSightDisapperStep) {
                    this._runningCache.set(runningPlayer, 1);
                }
                else {
                    this._runningCache.set(runningPlayer, runningCache + 1);
                }
            }
            return runningPROTs;
        };
        let handleShootingCache = () => {
            for (let i = this._shootingCaches.length - 1; i >= 0; i--) {
                let cache = this._shootingCaches[i];
                if (cache.sightTimeCount <= 0) {
                    if (cache.collisionPoint) {
                        this._shootingCaches.splice(i, 1);
                        continue;
                    }
                }
                else {
                    cache.sightTimeCount--;
                    if (cache.collisionPoint) {
                        continue;
                    }
                }
                let oldPos = cache.bulletPosition, newPos = new point(oldPos.x + cache.gun.bulletFlyStep * Math.cos(cache.angle), oldPos.y + cache.gun.bulletFlyStep * Math.sin(cache.angle));
                let collidedPlayers = this._playerManager.players.map(p => {
                    if (p == cache.shootingPlayer)
                        return null;
                    let collidedPoint = p.getLineCollidedPoint(oldPos, newPos);
                    if (collidedPoint) {
                        return {
                            player: p,
                            point: collidedPoint
                        };
                    }
                    else {
                        return null;
                    }
                });
                let minDistance = Infinity;
                let minPoint = null;
                let firstshootedPlayer = null;
                for (let collidedPlayer of collidedPlayers) {
                    if (!collidedPlayer)
                        continue;
                    let d = utils.getTwoPointsDistance(collidedPlayer.point, cache.shootingPosition);
                    if (d < minDistance) {
                        minDistance = d;
                        minPoint = collidedPlayer.point;
                        firstshootedPlayer = collidedPlayer.player;
                    }
                }
                let collidedBarricadePoints = this._barricades.map(b => {
                    return b.getLineCollidedPoint(oldPos, newPos);
                });
                for (let barricadePoint of collidedBarricadePoints) {
                    if (barricadePoint) {
                        let d = utils.getTwoPointsDistance(barricadePoint, cache.shootingPosition);
                        if (d < minDistance) {
                            minDistance = d;
                            minPoint = barricadePoint;
                            firstshootedPlayer = null;
                        }
                    }
                }
                if (!minPoint) {
                    let collidedEdgePoint = this._edge.getLineCollidedPoint(oldPos, newPos);
                    if (collidedEdgePoint) {
                        minPoint = collidedEdgePoint;
                    }
                }
                if (firstshootedPlayer) {
                    cache.shootedPlayer = firstshootedPlayer;
                    this._playerShooted(cache.shootedPlayer, cache.shootingPlayer, cache.gun);
                }
                if (minPoint) {
                    cache.bulletPosition = cache.collisionPoint = minPoint;
                }
                else {
                    cache.bulletPosition = newPos;
                }
            }
        };
        let handlePlayerMoving = () => {
            for (let player of this._playerManager.players) {
                this._playerMove(player);
            }
        };
        // 主计时器循环
        setInterval(() => {
            let sendingMap = new Map();
            let newPlayersBasicPROTs = generateNewPlayersBasicPROTs();
            let [shootPROTs, duringShootingPROTs] = generateShootPROTs();
            let connectedPlayers = this._playerManager.players.filter(p => p.connected);
            let runningPROTs = generateRunningPROTs(connectedPlayers);
            let propPROTs = this._propManager.getAndClearPropPROTs();
            for (let player of connectedPlayers) {
                let mainPROT = new toClientPROT.mainPROT(this._playerManager.getPlayersInPlayerSight(player, config.player.sightRadius).map(p => p.id));
                mainPROT.shootPROTs = shootPROTs;
                mainPROT.duringShootingPROTs = duringShootingPROTs;
                mainPROT.runningPROTs = runningPROTs;
                mainPROT.newPlayerBPROTs = newPlayersBasicPROTs.filter(p => p.id != player.id);
                mainPROT.newPropHpPROTs = propPROTs.newPropHps;
                mainPROT.removedPropHpIds = propPROTs.removedPropHpIds;
                mainPROT.newPropGunPROTs = propPROTs.newPropGuns;
                mainPROT.removedPropGunIds = propPROTs.removedPropGunIds;
                mainPROT.rankList = this._playerManager.getRankList();
                mainPROT.formatPlayerPROT(player.id, (playerId) => {
                    let player = this._playerManager.findPlayerById(playerId);
                    if (player)
                        return player.getPlayerPROT();
                    else
                        return null;
                });
                mainPROT.fixNumbers();
                sendingMap.set(player.id, mainPROT);
            }
            this.emit(gameCore.events.sendToPlayers, sendingMap);
            handleShootingCache();
            handlePlayerMoving();
        }, serverConfig.mainInterval);
        // 生命值道具计时器循环
        setInterval(() => {
            if (this._propManager.propHps.length < config.hp.maxNumber)
                this._addNewPropHp();
        }, config.hp.appearInterval);
    }
    _addNewPropHp() {
        let newPosition;
        while (!newPosition) {
            newPosition = new point(Math.random() * config.stage.width, Math.random() * config.stage.height);
            if (this._edge.didCircleCollided(newPosition, config.player.radius)) {
                newPosition = undefined;
                continue;
            }
            if (this._playerManager.players.find(p => p.didCircleCollided(newPosition, config.player.radius))) {
                newPosition = undefined;
                continue;
            }
            if (this._barricades.find(p => p.didCircleCollided(newPosition, config.player.radius))) {
                newPosition = undefined;
                continue;
            }
        }
        this._propManager.addPropHp(newPosition);
    }
    /**获取玩家的初始化协议 */
    getInitPROT(currPlayerId) {
        let players = this._playerManager.players;
        return new toClientPROT.initialize(currPlayerId, players.map(p => p.getPlayerBasicPROT()), this._edge.getEdgePROT(), this._barricades.map(p => p.getBarricadePROT()), this._propManager.propHps.map(p => p.getPropHpPROT()), this._propManager.propGuns.map(p => p.getPropGunPROT()));
    }
    /**玩家是否还在游戏中 */
    isPlayerOnGame(playerId) {
        let player = this._playerManager.players.find(p => p.id == playerId);
        return player != undefined;
    }
    /**添加新玩家 */
    addNewPlayer(name) {
        let newPoisition;
        while (!newPoisition) {
            newPoisition = new point(Math.random() * this._edge.getWidth() + this._edge.vertex1.x, Math.random() * this._edge.getHeight() + this._edge.vertex1.y);
            if (this._edge.didCircleCollided(newPoisition, config.player.radius)) {
                newPoisition = undefined;
                continue;
            }
            if (this._playerManager.players.find(p => p.didCircleCollided(newPoisition, config.player.radius))) {
                newPoisition = undefined;
                continue;
            }
            if (this._barricades.find(p => p.didCircleCollided(newPoisition, config.player.radius))) {
                newPoisition = undefined;
                continue;
            }
        }
        let newPlayer = this._playerManager.addNewPlayer(name, newPoisition);
        return newPlayer.id;
    }
    playerDisconnected(playerId) {
        let player = this._playerManager.findPlayerById(playerId);
        if (player)
            player.connected = false;
    }
    playerReconnected(playerId) {
        let player = this._playerManager.findPlayerById(playerId);
        if (player)
            player.connected = true;
    }
    startRunning(playerId, active) {
        let player = this._playerManager.findPlayerById(playerId);
        if (player) {
            player.isRunning = active;
            if (!active)
                this._runningCache.set(player, 1);
        }
    }
    stopMoving(playerId, active) {
        let player = this._playerManager.findPlayerById(playerId);
        if (player)
            player.canMove = !active;
    }
    rotate(playerId, angle) {
        let player = this._playerManager.findPlayerById(playerId);
        if (player)
            player.setDirectionAngle(angle);
    }
    _playerMove(player) {
        if (!player.connected || !player.canMove) {
            return;
        }
        let angle = player.getDirectionAngle();
        let oldPos = player.position;
        let step = player.isRunning ? config.player.runingStep : config.player.movingStep;
        let x = oldPos.x + Math.cos(angle) * step;
        let y = oldPos.y + Math.sin(angle) * step;
        let newPos = new point(x, y);
        this._edge.adjustCircleCollided(newPos, config.player.radius);
        this._barricades.forEach(p => {
            p.adjustCircleCollided(oldPos, newPos, config.player.radius);
        });
        this._playerManager.players.forEach(p => {
            if (p == player)
                return;
            p.adjustCircleCollided(newPos, config.player.radius);
        });
        this._propManager.tryCoverProp(player, newPos);
        player.position = newPos;
    }
    startShooting(playerId, active) {
        let player = this._playerManager.findPlayerById(playerId);
        if (player) {
            player.startShooting(active, () => {
                if (player)
                    this._playerShoot(player);
            });
        }
    }
    _playerShooted(shootedPlayer, shootingPlayer, gun) {
        shootingPlayer.records.shootingInAimTimes++;
        shootedPlayer.records.shootedTimes++;
        let hp = shootedPlayer.getHp();
        if (hp - 1 == 0) {
            shootingPlayer.records.killTimes++;
            this.emit(gameCore.events.gameOver, shootedPlayer.id, new toClientPROT.gameOver(shootedPlayer.records));
            this._playerManager.removePlayer(shootedPlayer);
            if (shootedPlayer.getGun().getBullet() > 0) {
                this._propManager.addPropGun(shootedPlayer.position, shootedPlayer.getGun());
            }
        }
        else {
            shootedPlayer.setHp(hp - 1);
        }
    }
    _playerShoot(player) {
        player.records.shootingTimes++;
        let position = player.position;
        let angle = player.getDirectionAngle();
        this._shootingCaches.push({
            id: ++this._shootingCacheId,
            gun: player.getGun(),
            bulletPosition: new point(position.x + config.player.radius * Math.cos(angle), position.y + config.player.radius * Math.sin(angle)),
            shootingPosition: point.getNewInstance(position),
            shootingPlayer: player,
            angle: angle,
            sightTimeCount: player.getGun().shootingSightTimeOut
        });
    }
}
gameCore.events = {
    sendToPlayers: Symbol(),
    gameOver: Symbol()
};
exports.gameCore = gameCore;
//# sourceMappingURL=game_core.js.map