/**
 * 连接系统模块 (T013f)
 * 处理领土之间的连接建设、贸易路线和连接奖励
 */

import { GameState } from './GameState.js';

export const Connections = {
    /**
     * 可建造的连接的类型
     */
    types: {
        road: {
            id: 'road',
            name: '道路',
            nameEn: 'Road',
            cost: { wood: 50, iron: 30 },
            buildTime: 300, // 5分钟
            bonus: {
                movementSpeed: 1.2, // +20% 移动速度
                tradeEfficiency: 1.1  // +10% 贸易效率
            },
            maxLevel: 3,
            icon: '🛤️'
        },
        railway: {
            id: 'railway',
            name: '铁路',
            nameEn: 'Railway',
            cost: { wood: 100, iron: 150, gold: 500 },
            buildTime: 1800, // 30分钟
            bonus: {
                movementSpeed: 1.5, // +50% 移动速度
                tradeEfficiency: 1.3, // +30% 贸易效率
                troopTransport: 2      // 2倍部队运输
            },
            maxLevel: 2,
            icon: '🚂'
        },
        tradeRoute: {
            id: 'tradeRoute',
            name: '贸易路线',
            nameEn: 'Trade Route',
            cost: { gold: 300 },
            buildTime: 600, // 10分钟
            bonus: {
                goldIncome: 1.2,     // +20% 金币收入
                resourceTransport: 1.5 // 1.5倍资源运输
            },
            maxLevel: 5,
            icon: '💰'
        }
    },

    /**
     * 获取两个领土之间的连接
     * @param {string} territory1Id - 第一个领土ID
     * @param {string} territory2Id - 第二个领土ID
     * @returns {Object|null} 连接对象或null
     */
    getConnection(territory1Id, territory2Id) {
        return GameState.connections.find(conn =>
            (conn.from === territory1Id && conn.to === territory2Id) ||
            (conn.from === territory2Id && conn.to === territory1Id)
        ) || null;
    },

    /**
     * 检查是否可以建造连接
     * @param {string} territory1Id - 第一个领土ID
     * @param {string} territory2Id - 第二个领土ID
     * @param {string} type - 连接类型
     * @returns {Object} { canBuild: boolean, reason: string }
     */
    canBuildConnection(territory1Id, territory2Id, type) {
        // 检查领土是否属于玩家
        const playerTerritories = GameState.player.territories || [];
        if (!playerTerritories.includes(territory1Id) || !playerTerritories.includes(territory2Id)) {
            return { canBuild: false, reason: '两个领土都必须属于你' };
        }

        // 检查是否已有连接
        const existingConnection = this.getConnection(territory1Id, territory2Id);
        if (existingConnection) {
            return { canBuild: false, reason: '已存在连接' };
        }

        // 检查是否相邻（通过地图数据）
        // TODO: 实现相邻检查逻辑
        const areAdjacent = true; // 临时假设相邻
        if (!areAdjacent) {
            return { canBuild: false, reason: '领土不相邻' };
        }

        // 检查资源
        const connectionType = this.types[type];
        if (!connectionType) {
            return { canBuild: false, reason: '无效的连接类型' };
        }

        const resources = GameState.player.resources || {};
        for (const [resource, amount] of Object.entries(connectionType.cost)) {
            if (!resources[resource] || resources[resource] < amount) {
                return { canBuild: false, reason: `资源不足: ${resource}` };
            }
        }

        return { canBuild: true };
    },

    /**
     * 建造连接
     * @param {string} territory1Id - 第一个领土ID
     * @param {string} territory2Id - 第二个领土ID
     * @param {string} type - 连接类型
     * @returns {Object} { success: boolean, connection: Object }
     */
    buildConnection(territory1Id, territory2Id, type) {
        const check = this.canBuildConnection(territory1Id, territory2Id, type);
        if (!check.canBuild) {
            return { success: false, reason: check.reason };
        }

        const connectionType = this.types[type];

        // 扣除资源
        for (const [resource, amount] of Object.entries(connectionType.cost)) {
            GameState.player.resources[resource] -= amount;
        }

        // 创建连接
        const connection = {
            id: `conn_${Date.now()}`,
            from: territory1Id,
            to: territory2Id,
            type: type,
            level: 1,
            builtAt: Date.now(),
            status: 'building',
            buildProgress: 0,
            buildTime: connectionType.buildTime
        };

        GameState.connections.push(connection);

        // 开始建设计时器
        this.startBuildProgress(connection.id);

        return { success: true, connection };
    },

    /**
     * 开始建设进度
     * @param {string} connectionId - 连接ID
     */
    startBuildProgress(connectionId) {
        const connection = GameState.connections.find(c => c.id === connectionId);
        if (!connection) return;

        const interval = setInterval(() => {
            connection.buildProgress += 1;

            if (connection.buildProgress >= connection.buildTime) {
                connection.status = 'active';
                connection.buildProgress = connection.buildTime;
                clearInterval(interval);

                // 触发事件
                if (GameState.eventSystem) {
                    GameState.eventSystem.emit('connectionCompleted', connection);
                }
            }

            // 更新UI
            this.updateConnectionUI(connection);
        }, 1000); // 每秒更新一次
    },

    /**
     * 升级连接
     * @param {string} connectionId - 连接ID
     * @returns {Object} { success: boolean }
     */
    upgradeConnection(connectionId) {
        const connection = GameState.connections.find(c => c.id === connectionId);
        if (!connection) {
            return { success: false, reason: '连接不存在' };
        }

        const connectionType = this.types[connection.type];
        if (connection.level >= connectionType.maxLevel) {
            return { success: false, reason: '已达最大等级' };
        }

        // 检查升级成本（比建造成本低）
        const upgradeCost = {};
        for (const [resource, amount] of Object.entries(connectionType.cost)) {
            upgradeCost[resource] = Math.floor(amount * 0.6); // 升级成本为60%
        }

        // 检查资源
        const resources = GameState.player.resources || {};
        for (const [resource, amount] of Object.entries(upgradeCost)) {
            if (!resources[resource] || resources[resource] < amount) {
                return { success: false, reason: `资源不足: ${resource}` };
            }
        }

        // 扣除资源
        for (const [resource, amount] of Object.entries(upgradeCost)) {
            GameState.player.resources[resource] -= amount;
        }

        // 升级
        connection.level += 1;
        connection.buildTime = Math.floor(connection.buildTime * 0.8); // 升级时间减少20%

        return { success: true, connection };
    },

    /**
     * 摧毁连接
     * @param {string} connectionId - 连接ID
     * @returns {Object} { success: boolean }
     */
    destroyConnection(connectionId) {
        const index = GameState.connections.findIndex(c => c.id === connectionId);
        if (index === -1) {
            return { success: false, reason: '连接不存在' };
        }

        GameState.connections.splice(index, 1);

        // 触发事件
        if (GameState.eventSystem) {
            GameState.eventSystem.emit('connectionDestroyed', { connectionId });
        }

        return { success: true };
    },

    /**
     * 获取连接奖励
     * @param {string} territoryId - 领土ID
     * @returns {Object} 奖励对象
     */
    getConnectionBonuses(territoryId) {
        const playerConnections = GameState.connections.filter(conn =>
            (conn.from === territoryId || conn.to === territoryId) &&
            conn.status === 'active'
        );

        const bonuses = {
            movementSpeed: 1,
            tradeEfficiency: 1,
            goldIncome: 1,
            resourceTransport: 1,
            troopTransport: 1
        };

        for (const conn of playerConnections) {
            const connectionType = this.types[conn.type];
            if (connectionType && connectionType.bonus) {
                for (const [key, value] of Object.entries(connectionType.bonus)) {
                    bonuses[key] *= Math.pow(value, conn.level); // 等级加成指数增长
                }
            }
        }

        return bonuses;
    },

    /**
     * 更新连接UI
     * @param {Object} connection - 连接对象
     */
    updateConnectionUI(connection) {
        // 触发事件以更新UI
        if (GameState.eventSystem) {
            GameState.eventSystem.emit('connectionUpdated', connection);
        }
    },

    /**
     * 获取所有连接
     * @returns {Array} 连接数组
     */
    getAllConnections() {
        return GameState.connections;
    },

    /**
     * 获取领土的所有连接
     * @param {string} territoryId - 领土ID
     * @returns {Array} 连接数组
     */
    getTerritoryConnections(territoryId) {
        return GameState.connections.filter(conn =>
            conn.from === territoryId || conn.to === territoryId
        );
    }
};
