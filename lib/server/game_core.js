"use strict";
const events = require("events");
const player_1 = require("./player");
const barricade_1 = require("./barricade");
const prop_1 = require("./prop");
const weapon_1 = require("./weapon");
const config = require("../shared/game_config");
const serverConfig = require("../../config");
const utils = require("../shared/utils");
const toClientPROT = require("../shared/ws_prot_to_client");
const point = utils.point;
class gameCore extends events.EventEmitter {
    constructor(width, height, edgeX = 0, edgeY = 0) {
        super();
        this._attackCacheId = 0;
        this._attackCaches = [];
        this._runningCache = new Map();
        this._playerManager = new player_1.playerManager();
        this._propManager = new prop_1.propManager(this._generateEmptyPosition.bind(this));
        this._edge = new barricade_1.edge(new point(edgeX, edgeY), new point(edgeX + width, edgeY + height));
        this._barricadeManager = new barricade_1.barricadeManager();
        this._initializeMainLoop();
    }
    _initializeMainLoop() {
        /**生成攻击协议 */
        let generateAttackPROTs = () => {
            let attackPROTs = [];
            let duringAttackPROTs = [];
            for (let i = this._attackCaches.length - 1; i >= 0; i--) {
                let cache = this._attackCaches[i];
                // 如果是初次加入到射击缓存中
                if (cache.sightTimeCount == cache.weapon.attackSightTimeOut) {
                    attackPROTs.push({
                        id: cache.id,
                        attackType: cache.weapon.attackType,
                        weaponType: cache.weapon.weaponType,
                        position: cache.attackPosition,
                        angle: cache.angle,
                        playerIdsInSight: this._playerManager
                            .getPlayersInRadius(cache.attackPosition, cache.weapon.attackSightRadius)
                            .map(p => p.id),
                        attackPlayerId: cache.attackPlayer.id,
                        bulletPosition: cache.bulletPosition,
                        sightRadius: cache.weapon.attackSightRadius
                    });
                    cache.sightTimeCount--;
                }
                else {
                    let duringAttackPROT = {
                        id: cache.id,
                        bulletPosition: cache.bulletPosition,
                        playerIdsInSight: [],
                        attackedPlayerIds: cache.attacktedPlayers.map(p => p.id),
                        killedPlayerIds: cache.killedPlayers.map(p => p.id),
                        isSightEnd: false,
                        isEnd: cache.isEnd
                    };
                    if (cache.sightTimeCount <= 0) {
                        duringAttackPROT.isSightEnd = true;
                    }
                    else {
                        duringAttackPROT.playerIdsInSight = this._playerManager
                            .getPlayersInRadius(cache.attackPosition, cache.weapon.attackSightRadius)
                            .map(p => p.id);
                    }
                    duringAttackPROTs.push(duringAttackPROT);
                }
            }
            return [attackPROTs, duringAttackPROTs];
        };
        let runningSightRemainsStep = config.player.runningSightRemainsTime / serverConfig.mainInterval, runningSightDisapperStep = runningSightRemainsStep + config.player.runningSightDisapperTime / serverConfig.mainInterval;
        /**生成奔跑协议 */
        let generateRunningPROTs = (players) => {
            let runningPROTs = [];
            for (let runningPlayer of players.filter(p => p.canMove && p.isRunning)) {
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
        // 主计时器循环
        setInterval(() => {
            let players = this._playerManager.players;
            let sendingMap = new Map();
            let newPlayersBasicPROTs = this._playerManager.generateNewPlayersBasicPROTs();
            let [attackPROTs, duringAttackPROTs] = generateAttackPROTs();
            let runningPROTs = generateRunningPROTs(players);
            let propPROTs = this._propManager.getAndClearPropPROTs();
            let playersInSightMap = this._playerManager.generatePlayersInSightMap(players, this._barricadeManager);
            for (let player of players) {
                let playersInSight = playersInSightMap.get(player);
                playersInSight = playersInSight ? playersInSight : [];
                let mainPROT = new toClientPROT.mainPROT();
                mainPROT.playerIdsInSight = playersInSight.map(p => p.id);
                mainPROT.attackPROTs = attackPROTs;
                mainPROT.duringAttackPROTs = duringAttackPROTs;
                mainPROT.runningPROTs = runningPROTs;
                mainPROT.newPlayerBPROTs = newPlayersBasicPROTs.filter(p => p.id != player.id);
                mainPROT.newPropHpPROTs = propPROTs.newPropHps;
                mainPROT.removedPropHpIds = propPROTs.removedPropHpIds;
                mainPROT.newPropWeaponPROTs = propPROTs.newPropGuns;
                mainPROT.removedPropWeaponIds = propPROTs.removedPropGunIds;
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
            handleattackCache();
            handlePlayerMoving();
        }, serverConfig.mainInterval);
        let handleattackCache = () => {
            for (let i = this._attackCaches.length - 1; i >= 0; i--) {
                let cache = this._attackCaches[i];
                if (cache.sightTimeCount <= 0) {
                    if (cache.isEnd) {
                        this._attackCaches.splice(i, 1);
                        continue;
                    }
                }
                else {
                    cache.sightTimeCount--;
                    if (cache.isEnd) {
                        continue;
                    }
                }
                let oldPos = cache.bulletPosition, newPos = new point(oldPos.x + cache.weapon.bulletFlyStep * Math.cos(cache.angle), oldPos.y + cache.weapon.bulletFlyStep * Math.sin(cache.angle));
                let collidedPlayers = this._playerManager.players.map(p => {
                    if (p == cache.attackPlayer)
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
                let firstAttackedPlayer = null;
                for (let collidedPlayer of collidedPlayers) {
                    if (!collidedPlayer)
                        continue;
                    let d = utils.getTwoPointsDistance(collidedPlayer.point, cache.attackPosition);
                    if (d < minDistance) {
                        minDistance = d;
                        minPoint = collidedPlayer.point;
                        firstAttackedPlayer = collidedPlayer.player;
                    }
                }
                let collidedBarricadePoints = this._barricadeManager.barricades.map(b => {
                    return b.getLineCollidedPoint(oldPos, newPos);
                });
                for (let barricadePoint of collidedBarricadePoints) {
                    if (barricadePoint) {
                        let d = utils.getTwoPointsDistance(barricadePoint, cache.attackPosition);
                        if (d < minDistance) {
                            minDistance = d;
                            minPoint = barricadePoint;
                            firstAttackedPlayer = null;
                        }
                    }
                }
                if (!minPoint) {
                    let collidedEdgePoint = this._edge.getLineCollidedPoint(oldPos, newPos);
                    if (collidedEdgePoint) {
                        minPoint = collidedEdgePoint;
                    }
                }
                if (firstAttackedPlayer) {
                    cache.attacktedPlayers.push(firstAttackedPlayer);
                    this._playerAttacked(firstAttackedPlayer, cache.attackPlayer, cache.weapon);
                    if (firstAttackedPlayer.getHp() <= 0)
                        cache.killedPlayers.push(firstAttackedPlayer);
                }
                if (minPoint) {
                    cache.bulletPosition = cache.collisionPoint = minPoint;
                    cache.isEnd = true;
                }
                else {
                    cache.bulletPosition = newPos;
                    if (cache.weapon instanceof weapon_1.melee) {
                        cache.isEnd = true;
                    }
                }
            }
        };
        let handlePlayerMoving = () => {
            for (let player of this._playerManager.players) {
                let newPos = this._playerManager.move(player, (oldPos, newPos) => {
                    this._edge.adjustCircleCollided(newPos, config.player.radius);
                    this._barricadeManager.barricades.forEach(p => {
                        p.adjustCircleCollided(oldPos, newPos, config.player.radius);
                    });
                });
                if (!newPos)
                    continue;
                this._propManager.tryCoverProp(player, newPos);
            }
        };
    }
    _generateEmptyPosition(radius) {
        let newPosition;
        while (!newPosition) {
            newPosition = new point(Math.random() * config.stage.width, Math.random() * config.stage.height);
            if (this._edge.didCircleCollided(newPosition, radius)) {
                newPosition = undefined;
                continue;
            }
            if (this._playerManager.players.find(p => p.didCircleCollided(newPosition, radius))) {
                newPosition = undefined;
                continue;
            }
            if (this._barricadeManager.barricades.find(p => p.didCircleCollided(newPosition, radius))) {
                newPosition = undefined;
                continue;
            }
        }
        return newPosition;
    }
    /**获取玩家的初始化协议 */
    getInitPROT(currPlayerId) {
        let players = this._playerManager.players;
        return new toClientPROT.initialize(currPlayerId, players.map(p => p.getPlayerBasicPROT()), this._edge.getEdgePROT(), this._barricadeManager.barricades.map(p => p.getBarricadePROT()), this._propManager.propHps.map(p => p.getPropHpPROT()), this._propManager.propWeapons.map(p => p.getPropGunPROT()));
    }
    removePlayer(playerId) {
        this._playerManager.removePlayerById(playerId);
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
            if (this._barricadeManager.barricades.find(p => p.didCircleCollided(newPoisition, config.player.radius))) {
                newPoisition = undefined;
                continue;
            }
        }
        let newPlayer = this._playerManager.addNewPlayer(name.slice(0, 20), newPoisition);
        return newPlayer.id;
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
    startShooting(playerId, active) {
        let player = this._playerManager.findPlayerById(playerId);
        if (player) {
            player.startShooting(active, () => {
                if (player)
                    this._playerAttack(player, player.getGun());
            });
        }
    }
    startCombat(playerId, active) {
        let player = this._playerManager.findPlayerById(playerId);
        if (player) {
            player.startCombat(active, () => {
                if (player)
                    this._playerAttack(player, player.getMelee());
            });
        }
    }
    _playerAttacked(attacktedPlayer, attackPlayer, weapon) {
        attackPlayer.records.attackInAimTimes++;
        attacktedPlayer.records.attactedTimes++;
        let hp = attacktedPlayer.getHp();
        if (hp - 1 == 0) {
            attackPlayer.records.killTimes++;
            this.emit(gameCore.events.gameOver, attacktedPlayer.id, new toClientPROT.gameOver(attacktedPlayer.records));
            this._playerManager.removePlayer(attacktedPlayer);
            if (attacktedPlayer.getGun().getBullet() > 0) {
                this._propManager.addPropWeapon(attacktedPlayer.position, attacktedPlayer.getGun());
            }
        }
        attacktedPlayer.setHp(hp - 1);
    }
    _playerAttack(player, weapon) {
        player.records.attackTimes++;
        let position = player.position;
        let angle = player.getDirectionAngle();
        this._attackCaches.push({
            id: ++this._attackCacheId,
            weapon: weapon,
            bulletPosition: new point(position.x + config.player.radius * Math.cos(angle), position.y + config.player.radius * Math.sin(angle)),
            attackPosition: point.getNewInstance(position),
            attackPlayer: player,
            angle: angle,
            attacktedPlayers: [],
            killedPlayers: [],
            sightTimeCount: weapon.attackSightTimeOut,
            isEnd: false
        });
    }
}
gameCore.events = {
    sendToPlayers: Symbol(),
    gameOver: Symbol()
};
exports.gameCore = gameCore;
//# sourceMappingURL=game_core.js.map