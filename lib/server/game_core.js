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
    constructor() {
        super();
        this._barricades = [];
        this._propHps = [];
        this._newPropHpsCache = [];
        this._removedPropHpIdsCache = [];
        this._newPropGunsCache = [];
        this._removedPropGunIdsCache = [];
        this._shootingCache = [];
        this._runningCache = new Map();
        this._playerManager = new player_1.playerManager;
        this._barricades.push(new barricade_1.barricade(new point(0, 0), new point(500, 10)));
        this._barricades.push(new barricade_1.barricade(new point(0, 0), new point(10, 500)));
        this._barricades.push(new barricade_1.barricade(new point(0, 490), new point(500, 500)));
        this._barricades.push(new barricade_1.barricade(new point(490, 0), new point(500, 500)));
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
            for (let i = this._shootingCache.length - 1; i >= 0; i--) {
                let shootingCache = this._shootingCache[i];
                let shootedPlayerId;
                if (shootingCache.shootedPlayer) {
                    shootedPlayerId = shootingCache.shootedPlayer.id;
                }
                shootPROTs.push({
                    position: shootingCache.shootingPosition,
                    angle: shootingCache.angle,
                    playerIdsInSight: this._playerManager
                        .getPlayersInRadius(shootingCache.shootingPosition, shootingCache.shootingPlayer.getGun().shootingSightRadius)
                        .map(p => p.id),
                    collisionPoint: shootingCache.collisionPoint,
                    shootedPlayerId: shootedPlayerId
                });
                if (--shootingCache.timeCount <= 0) {
                    this._shootingCache.splice(i, 1);
                }
            }
            return shootPROTs;
        };
        // 生成奔跑协议
        let generateRunningPROTs = (connectedPlayers) => {
            let runningPROTs = [];
            for (let runningPlayer of connectedPlayers.filter(p => p.canMove && p.isRunning)) {
                let runningCache = this._runningCache.get(runningPlayer);
                if (!runningCache) {
                    runningCache = 1;
                    this._runningCache.set(runningPlayer, runningCache);
                }
                if (runningCache >= 1 && runningCache <= 5) {
                    runningPROTs.push({
                        position: runningPlayer.position,
                        playerIdsInSight: this._playerManager
                            .getPlayersInRadius(runningPlayer.position, config.player.runningSightRadius)
                            .map(p => p.id)
                    });
                }
                if (runningCache == 10) {
                    this._runningCache.set(runningPlayer, 1);
                }
                else {
                    this._runningCache.set(runningPlayer, runningCache + 1);
                }
            }
            return runningPROTs;
        };
        let generatePropPROTs = () => {
            let res = {
                newPropHps: this._newPropHpsCache.map(p => p.getPropHpPROT()),
                removedPropHpIds: this._removedPropHpIdsCache,
                newPropGuns: this._newPropGunsCache.map(p => p.getPropGunPROT()),
                removedPropGunIds: this._removedPropGunIdsCache
            };
            this._newPropHpsCache = [];
            this._removedPropHpIdsCache = [];
            this._newPropGunsCache = [];
            this._removedPropGunIdsCache = [];
            return res;
        };
        // 主计时器循环
        setInterval(() => {
            let sendingMap = new Map();
            let newPlayersBasicPROTs = generateNewPlayersBasicPROTs();
            let shootPROTs = generateShootPROTs();
            let connectedPlayers = this._playerManager.getPlayers().filter(p => p.connected);
            let runningPROTs = generateRunningPROTs(connectedPlayers);
            let propPROTs = generatePropPROTs();
            for (let player of connectedPlayers) {
                let mainPROT = new toClientPROT.mainPROT(player.id, this._playerManager.getPlayersInPlayerSight(player, config.player.sightRadius).map(p => p.id));
                mainPROT.shootPROTs = shootPROTs;
                mainPROT.runningPROTs = runningPROTs;
                mainPROT.newPlayerBPROTs = newPlayersBasicPROTs.filter(p => p.id != player.id);
                mainPROT.newPropHpPROTs = propPROTs.newPropHps;
                mainPROT.removedPropHpIds = propPROTs.removedPropHpIds;
                mainPROT.newPropGunPROTs = propPROTs.newPropGuns;
                mainPROT.removedPropGunIds = propPROTs.removedPropGunIds;
                mainPROT.rankList = this._playerManager.getRankList();
                mainPROT.formatPlayerPROT((playerId) => {
                    let player = this._playerManager.findPlayerById(playerId);
                    if (player)
                        return player.getPlayerPROT();
                    else
                        return null;
                });
                sendingMap.set(player.id, mainPROT);
            }
            this.emit(gameCore.events.sendToPlayers, sendingMap);
        }, 1000 / serverConfig.tickrate);
        // 生命值道具计时器循环
        setInterval(() => {
            if (this._propHps.length < config.hp.maxNumber)
                this._addNewPropHp();
        }, config.hp.appearInterval);
        // 玩家移动计时器循环
        setInterval(() => {
            for (let player of this._playerManager.getPlayers()) {
                this._playerMove(player);
            }
        }, config.player.movingInterval);
    }
    _addNewPropHp() {
        let newPosition;
        while (!newPosition) {
            newPosition = new point(Math.random() * config.stage.width, Math.random() * config.stage.height);
            if (this._playerManager.getPlayers().find(p => p.didPlayerCollided(newPosition))) {
                newPosition = undefined;
                continue;
            }
            if (this._barricades.find(p => p.didPlayerCollided(newPosition))) {
                newPosition = undefined;
                continue;
            }
        }
        let newPropHp = new prop_1.propHp(newPosition);
        this._propHps.push(newPropHp);
        this._newPropHpsCache.push(newPropHp);
    }
    getInitPROT(currPlayerId) {
        let players = this._playerManager.getPlayers();
        return new toClientPROT.initialize(currPlayerId, players.map(p => p.getPlayerBasicPROT()), this._barricades.map(p => p.getBarricadePROT()), this._propHps.map(p => p.getPropHpPROT()));
    }
    isPlayerOnGame(playerId) {
        let player = this._playerManager.getPlayers().find(p => p.id == playerId);
        return player != undefined;
    }
    addNewPlayer(name) {
        let newPoisition;
        while (!newPoisition) {
            newPoisition = new point(Math.random() * config.stage.width, Math.random() * config.stage.height);
            if (this._playerManager.getPlayers().find(p => p.didPlayerCollided(newPoisition))) {
                newPoisition = undefined;
                continue;
            }
            if (this._barricades.find(p => p.didPlayerCollided(newPoisition))) {
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
        if (player)
            player.isRunning = active;
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
        this._barricades.forEach(p => {
            p.adjustPlayerCollided(oldPos, newPos);
        });
        this._playerManager.getPlayers().forEach(p => {
            if (p == player)
                return;
            p.adjustPlayerCollided(newPos);
        });
        for (let i = this._propHps.length - 1; i >= 0; i--) {
            let propHp = this._propHps[i];
            if (utils.didTwoCirclesCollied(propHp.position, config.hp.activeRadius, newPos, config.player.radius)) {
                player.setHp(player.getHp() + 1);
                this._propHps.splice(i, 1);
                this._removedPropHpIdsCache.push(propHp.id);
            }
        }
        player.position = newPos;
    }
    startShooting(playerId, active) {
        let player = this._playerManager.findPlayerById(playerId);
        if (player) {
            player.startShooting(active, () => {
                if (!player)
                    return;
                player.records.shootingTimes++;
                let position = player.position;
                let angle = player.getDirectionAngle();
                let playersInRay = this._playerManager.getPlayers().map(p => {
                    if (p == player)
                        return null;
                    let collidedPoint = p.getRayCollidedPoint(position, angle);
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
                let minPoint;
                let firstshootedPlayer;
                for (let playerInRay of playersInRay) {
                    if (playerInRay) {
                        let d = utils.getTwoPointsDistance(playerInRay.point, position);
                        if (d < minDistance) {
                            minDistance = d;
                            minPoint = playerInRay.point;
                            firstshootedPlayer = playerInRay.player;
                        }
                    }
                }
                let collidedBarricadePoints = this._barricades.map(b => {
                    return b.getRayCollidedPoint(position, angle);
                });
                for (let barricadePoint of collidedBarricadePoints) {
                    if (barricadePoint) {
                        let d = Math.sqrt(Math.pow((barricadePoint.x - position.x), 2)
                            + Math.pow((barricadePoint.y - position.y), 2));
                        if (d < minDistance) {
                            minDistance = d;
                            minPoint = barricadePoint;
                            firstshootedPlayer = undefined;
                        }
                    }
                }
                if (firstshootedPlayer) {
                    player.records.shootingInAimTimes++;
                    firstshootedPlayer.records.shootedTimes++;
                    let hp = firstshootedPlayer.getHp();
                    if (hp - 1 == 0) {
                        player.records.killTimes++;
                        this.emit(gameCore.events.gameOver, firstshootedPlayer.id, new toClientPROT.gameOver(firstshootedPlayer.records));
                        this._playerManager.removePlayer(firstshootedPlayer);
                    }
                    else {
                        firstshootedPlayer.setHp(hp - 1);
                    }
                }
                this._shootingCache.push({
                    shootingPosition: player.position,
                    shootingPlayer: player,
                    angle: angle,
                    collisionPoint: minPoint,
                    shootedPlayer: firstshootedPlayer,
                    timeCount: player.getGun().shootingSightTimeOut / serverConfig.tickrate
                });
            });
        }
    }
}
gameCore.events = {
    sendToPlayers: Symbol(),
    gameOver: Symbol()
};
exports.gameCore = gameCore;
//# sourceMappingURL=game_core.js.map