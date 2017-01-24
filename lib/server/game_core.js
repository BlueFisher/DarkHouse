"use strict";
const events = require("events");
const player_1 = require("./player");
const barricade_1 = require("./barricade");
const prop_hp_1 = require("./prop_hp");
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
        this._newPlayersCache = [];
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
            let newPlayersBasicPROTs = this._newPlayersCache.map(p => p.getPlayerBasicPROT());
            this._newPlayersCache = [];
            return newPlayersBasicPROTs;
        };
        // 生成射击协议
        let generateShootPROTs = () => {
            let shootPROTs = [];
            for (let i = this._shootingCache.length - 1; i >= 0; i--) {
                let shootedPlayerId;
                if (this._shootingCache[i].shootedPlayer) {
                    shootedPlayerId = this._shootingCache[i].shootedPlayer.id;
                }
                shootPROTs.push({
                    position: this._shootingCache[i].shootingPosition,
                    angle: this._shootingCache[i].angle,
                    playerIdsInSight: this._playerManager.getPlayersInRadius(this._shootingCache[i].shootingPosition, config.player.shootingSightRadius)
                        .map(p => p.id),
                    collisionPoint: this._shootingCache[i].collisionPoint,
                    shootedPlayerId: shootedPlayerId
                });
                if (++this._shootingCache[i].timeCount > 2) {
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
                        position: runningPlayer.getPosition(),
                        playerIdsInSight: this._playerManager.getPlayersInRadius(runningPlayer.getPosition(), config.player.runningSightRadius)
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
        // 主计时器循环
        setInterval(() => {
            let sendingMap = new Map();
            let newPlayersBasicPROTs = generateNewPlayersBasicPROTs();
            let shootPROTs = generateShootPROTs();
            let connectedPlayers = this._playerManager.getPlayers().filter(p => p.connected);
            let runningPROTs = generateRunningPROTs(connectedPlayers);
            for (let player of connectedPlayers) {
                let mainPROT = new toClientPROT.mainPROT(player.id, this._playerManager.getPlayersInPlayerSight(player, config.player.sightRadius).map(p => p.id));
                mainPROT.shootPROTs = shootPROTs;
                mainPROT.runningPROTs = runningPROTs;
                mainPROT.newPlayerBPROTs = newPlayersBasicPROTs.filter(p => p.id != player.id);
                mainPROT.propHpPROTs = this._propHps.map(p => p.getPropHpPROT());
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
            for (let player of this._playerManager.getPlayers().filter(p => p.connected)) {
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
        this._propHps.push(new prop_hp_1.propHp(newPosition));
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
        let oldPlayers = this._playerManager.getPlayers();
        let newPlayer = this._playerManager.addNewPlayer(name, newPoisition);
        let initPROT = new toClientPROT.initialize(newPlayer.getPlayerBasicPROT(), oldPlayers.map(p => p.getPlayerBasicPROT()), this._barricades.map(p => p.getBarricadePROT()), this._propHps.map(p => p.getPropHpPROT()));
        this._newPlayersCache.push(newPlayer);
        return [newPlayer.id, initPROT];
    }
    playerDisconnected(playerId) {
        this._playerManager.playerDisconnected(playerId);
    }
    startRunning(playerId, active) {
        this._playerManager.startRunning(playerId, active);
    }
    stopMoving(playerId, active) {
        this._playerManager.stopMoving(playerId, active);
    }
    rotate(playerId, angle) {
        this._playerManager.rotate(playerId, angle);
    }
    _playerMove(player) {
        if (!player.canMove) {
            return;
        }
        let angle = player.getDirectionAngle();
        let oldPos = player.getPosition();
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
            }
        }
        player.setPosition(newPos);
    }
    shoot(playerId) {
        let player = this._playerManager.findPlayerById(playerId);
        if (player) {
            let position = player.getPosition();
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
                let hp = firstshootedPlayer.getHp();
                if (hp - 1 == 0) {
                    this.emit(gameCore.events.gameOver, firstshootedPlayer.id, new toClientPROT.gameOver());
                    this._playerManager.removePlayer(firstshootedPlayer);
                }
                else {
                    firstshootedPlayer.setHp(hp - 1);
                }
            }
            this._shootingCache.push({
                shootingPosition: player.getPosition(),
                shootingPlayer: player,
                angle: angle,
                collisionPoint: minPoint,
                shootedPlayer: firstshootedPlayer,
                timeCount: 0
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