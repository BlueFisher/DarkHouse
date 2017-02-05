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
        this._shootingCacheId = 0;
        this._shootingCache = [];
        this._runningCache = new Map();
        this._playerManager = new player_1.playerManager();
        this._propManager = new prop_1.propManager();
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
            let duringShootingPROTs = [];
            for (let i = this._shootingCache.length - 1; i >= 0; i--) {
                let shootingCache = this._shootingCache[i];
                // 如果是初次加入到射击缓存中
                if (shootingCache.timeCount == shootingCache.shootingPlayer.getGun().shootingSightTimeOut / serverConfig.tickrate) {
                    shootPROTs.push({
                        id: shootingCache.id,
                        position: shootingCache.shootingPosition,
                        angle: shootingCache.angle,
                        playerIdsInSight: this._playerManager
                            .getPlayersInRadius(shootingCache.shootingPosition, shootingCache.shootingPlayer.getGun().shootingSightRadius)
                            .map(p => p.id),
                        shootingPlayerId: shootingCache.shootingPlayer.id,
                        collisionPoint: shootingCache.collisionPoint,
                        shootedPlayerId: shootingCache.shootedPlayer ? shootingCache.shootedPlayer.id : undefined
                    });
                    shootingCache.timeCount--;
                }
                else {
                    if (--shootingCache.timeCount <= 0) {
                        duringShootingPROTs.push({
                            id: shootingCache.id,
                            playerIdsInSight: [],
                            isEnd: true
                        });
                        this._shootingCache.splice(i, 1);
                    }
                    else {
                        duringShootingPROTs.push({
                            id: shootingCache.id,
                            playerIdsInSight: this._playerManager
                                .getPlayersInRadius(shootingCache.shootingPosition, shootingCache.shootingPlayer.getGun().shootingSightRadius)
                                .map(p => p.id),
                            isEnd: false
                        });
                    }
                }
            }
            return [shootPROTs, duringShootingPROTs];
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
                sendingMap.set(player.id, mainPROT);
            }
            this.emit(gameCore.events.sendToPlayers, sendingMap);
        }, 1000 / serverConfig.tickrate);
        // 生命值道具计时器循环
        setInterval(() => {
            if (this._propManager.propHps.length < config.hp.maxNumber)
                this._addNewPropHp();
        }, config.hp.appearInterval);
        // 玩家移动计时器循环
        setInterval(() => {
            for (let player of this._playerManager.players) {
                this._playerMove(player);
            }
        }, config.player.movingInterval);
    }
    _addNewPropHp() {
        let newPosition;
        while (!newPosition) {
            newPosition = new point(Math.random() * config.stage.width, Math.random() * config.stage.height);
            if (this._playerManager.players.find(p => p.didPlayerCollided(newPosition))) {
                newPosition = undefined;
                continue;
            }
            if (this._barricades.find(p => p.didPlayerCollided(newPosition))) {
                newPosition = undefined;
                continue;
            }
        }
        this._propManager.addPropHp(newPosition);
    }
    /**获取玩家的初始化协议 */
    getInitPROT(currPlayerId) {
        let players = this._playerManager.players;
        return new toClientPROT.initialize(currPlayerId, players.map(p => p.getPlayerBasicPROT()), this._barricades.map(p => p.getBarricadePROT()), this._propManager.propHps.map(p => p.getPropHpPROT()), this._propManager.propGuns.map(p => p.getPropGunPROT()));
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
            newPoisition = new point(Math.random() * config.stage.width, Math.random() * config.stage.height);
            if (this._playerManager.players.find(p => p.didPlayerCollided(newPoisition))) {
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
        this._playerManager.players.forEach(p => {
            if (p == player)
                return;
            p.adjustPlayerCollided(newPos);
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
    _playerShoot(player) {
        player.records.shootingTimes++;
        let position = player.position;
        let angle = player.getDirectionAngle();
        let playersInRay = this._playerManager.players.map(p => {
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
                if (firstshootedPlayer.getGun().getBullet() > 0) {
                    this._propManager.addPropGun(firstshootedPlayer.position, firstshootedPlayer.getGun());
                }
            }
            else {
                firstshootedPlayer.setHp(hp - 1);
            }
        }
        this._shootingCache.push({
            id: ++this._shootingCacheId,
            shootingPosition: player.position,
            shootingPlayer: player,
            angle: angle,
            collisionPoint: minPoint,
            shootedPlayer: firstshootedPlayer,
            timeCount: player.getGun().shootingSightTimeOut / serverConfig.tickrate
        });
    }
}
gameCore.events = {
    sendToPlayers: Symbol(),
    gameOver: Symbol()
};
exports.gameCore = gameCore;
//# sourceMappingURL=game_core.js.map