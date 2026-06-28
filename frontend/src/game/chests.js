/**
 * 宝箱系统模块 (T013g)
 * 处理宝箱生成、掉落逻辑和开启奖励
 */

import { GameState } from './GameState.js';
import { Resources } from './resources.js';

export const Chests = {
    /**
     * 宝箱类型定义
     */
    types: {
        wooden: {
            id: 'wooden',
            name: '木宝箱',
            nameEn: 'Wooden Chest',
            rarity: 'common',
            dropChance: 0.6, // 60% 掉落率
            contents: {
                gold: { min: 50, max: 100 },
                food: { min: 20, max: 50 },
                population: { min: 10, max: 30 }
            },
            icon: '📦',
            color: '#8B4513'
        },
        silver: {
            id: 'silver',
            name: '银宝箱',
            nameEn: 'Silver Chest',
            rarity: 'uncommon',
            dropChance: 0.3, // 30% 掉落率
            contents: {
                gold: { min: 100, max: 300 },
                food: { min: 50, max: 100 },
                population: { min: 30, max: 80 },
                cards: { min: 1, max: 2 }
            },
            icon: '🎁',
            color: '#C0C0C0'
        },
        golden: {
            id: 'golden',
            name: '金宝箱',
            nameEn: 'Golden Chest',
            rarity: 'rare',
            dropChance: 0.08, // 8% 掉落率
            contents: {
                gold: { min: 300, max: 800 },
                food: { min: 100, max: 250 },
                population: { min: 80, max: 200 },
                cards: { min: 2, max: 4 },
                military: { min: 10, max: 30 }
            },
            icon: '🏆',
            color: '#FFD700'
        },
        diamond: {
            id: 'diamond',
            name: '钻石宝箱',
            nameEn: 'Diamond Chest',
            rarity: 'legendary',
            dropChance: 0.02, // 2% 掉落率
            contents: {
                gold: { min: 800, max: 2000 },
                food: { min: 250, max: 500 },
                population: { min: 200, max: 500 },
                cards: { min: 4, max: 8 },
                military: { min: 30, max: 100 },
                tokens: { min: 5, max: 15 }
            },
            icon: '💎',
            color: '#B9F2FF'
        }
    },

    /**
     * 宝箱生成间隔（毫秒）
     */
    spawnInterval: 300000, // 5分钟

    /**
     * 最大宝箱数量
     */
    maxChests: 20,

    /**
     * 初始化宝箱系统
     */
    init() {
        // 启动自动生成
        this.startAutoSpawn();

        // 监听战斗事件（战斗胜利后可能掉落宝箱）
        if (GameState.eventSystem) {
            GameState.eventSystem.on('battleWon', (data) => {
                this.onBattleWon(data);
            });
        }
    },

    /**
     * 启动自动生成宝箱
     */
    startAutoSpawn() {
        setInterval(() => {
            this.spawnRandomChest();
        }, this.spawnInterval);

        console.log('Chest auto-spawn started (every 5 minutes)');
    },

    /**
     * 随机生成宝箱
     * @param {Object} options - 生成选项
     * @returns {Object|null} 生成的宝箱或null
     */
    spawnRandomChest(options = {}) {
        // 检查是否达到最大数量
        const currentChests = Object.keys(GameState.chests || {}).length;
        if (currentChests >= this.maxChests) {
            console.log('Max chests reached, skipping spawn');
            return null;
        }

        // 随机选择宝箱类型（基于掉落率）
        const type = this.rollChestType();
        if (!type) return null;

        // 随机选择位置（在玩家领土附近）
        const position = this.getRandomPosition(options.territoryId);

        // 创建宝箱
        const chest = {
            id: `chest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: type.id,
            position: position,
            spawnedAt: Date.now(),
            expiresAt: Date.now() + 3600000, // 1小时后过期
            opened: false
        };

        if (!GameState.chests) {
            GameState.chests = {};
        }
        GameState.chests[chest.id] = chest;

        // 触发事件
        if (GameState.eventSystem) {
            GameState.eventSystem.emit('chestSpawned', chest);
        }

        console.log(`Chest spawned: ${type.name} at position`, position);
        return chest;
    },

    /**
     * 随机选择宝箱类型（基于掉落率）
     * @returns {Object|null} 宝箱类型或null
     */
    rollChestType() {
        const rand = Math.random();
        let cumulative = 0;

        for (const [id, type] of Object.entries(this.types)) {
            cumulative += type.dropChance;
            if (rand <= cumulative) {
                return type;
            }
        }

        return null; // 未生成宝箱
    },

    /**
     * 获取随机位置
     * @param {string} territoryId - 领土ID（可选）
     * @returns {Object} 位置对象 { x, y }
     */
    getRandomPosition(territoryId) {
        // 如果在特定领土附近生成
        if (territoryId) {
            // TODO: 获取领土的实际位置
            return {
                x: Math.random() * 100,
                y: Math.random() * 100,
                territoryId: territoryId
            };
        }

        // 在玩家领土附近随机生成
        const playerTerritories = GameState.player.territories || [];
        if (playerTerritories.length > 0) {
            const randomTerritory = playerTerritories[Math.floor(Math.random() * playerTerritories.length)];
            return this.getRandomPosition(randomTerritory);
        }

        // 完全没有领土，在地图中心生成
        return {
            x: 50,
            y: 50
        };
    },

    /**
     * 开启宝箱
     * @param {string} chestId - 宝箱ID
     * @returns {Object} { success: boolean, rewards: Object }
     */
    openChest(chestId) {
        const chest = GameState.chests ? GameState.chests[chestId] : null;
        if (!chest) {
            return { success: false, reason: '宝箱不存在' };
        }

        if (chest.opened) {
            return { success: false, reason: '宝箱已开启' };
        }

        if (Date.now() > chest.expiresAt) {
            // 移除过期宝箱
            delete GameState.chests[chestId];
            return { success: false, reason: '宝箱已过期' };
        }

        // 标记为已开启
        chest.opened = true;

        // 计算奖励
        const rewards = this.calculateRewards(chest.type);

        // 发放奖励
        this.grantRewards(rewards);

        // 触发事件
        if (GameState.eventSystem) {
            GameState.eventSystem.emit('chestOpened', { chest, rewards });
        }

        // 移除宝箱
        setTimeout(() => {
            delete GameState.chests[chestId];
        }, 5000); // 5秒后移除（让动画播放完）

        return { success: true, rewards };
    },

    /**
     * 计算奖励
     * @param {string} chestType - 宝箱类型ID
     * @returns {Object} 奖励对象
     */
    calculateRewards(chestType) {
        const type = this.types[chestType];
        if (!type) return {};

        const rewards = {};

        for (const [resource, range] of Object.entries(type.contents)) {
            if (resource === 'cards') {
                rewards.cards = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            } else {
                rewards[resource] = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            }
        }

        return rewards;
    },

    /**
     * 发放奖励
     * @param {Object} rewards - 奖励对象
     */
    grantRewards(rewards) {
        // 资源奖励
        if (rewards.gold) {
            Resources.add('gold', rewards.gold);
        }
        if (rewards.food) {
            Resources.add('food', rewards.food);
        }
        if (rewards.population) {
            Resources.add('population', rewards.population);
        }
        if (rewards.military) {
            GameState.player.military = (GameState.player.military || 0) + rewards.military;
        }
        if (rewards.tokens) {
            GameState.player.tokens = (GameState.player.tokens || 0) + rewards.tokens;
        }

        // 卡牌奖励
        if (rewards.cards && GameState.eventSystem) {
            // 触发卡牌获取事件
            for (let i = 0; i < rewards.cards; i++) {
                GameState.eventSystem.emit('cardReceived', {
                    source: 'chest',
                    rarity: this.rollCardRarity()
                });
            }
        }
    },

    /**
     * 随机选择卡牌稀有度
     * @returns {string} 稀有度
     */
    rollCardRarity() {
        const rand = Math.random();
        if (rand < 0.01) return 'legendary'; // 1%
        if (rand < 0.05) return 'epic';      // 4%
        if (rand < 0.20) return 'rare';      // 15%
        if (rand < 0.50) return 'uncommon';  // 30%
        return 'common';                      // 50%
    },

    /**
     * 战斗胜利后调用
     * @param {Object} data - 战斗数据
     */
    onBattleWon(data) {
        // 战斗胜利后有额外 chance 掉落宝箱
        const bonusChance = 0.3; // 30% 额外掉落率

        if (Math.random() < bonusChance) {
            this.spawnRandomChest({ territoryId: data.territoryId });
        }
    },

    /**
     * 获取所有活跃宝箱
     * @returns {Array} 宝箱数组
     */
    getActiveChests() {
        const chests = GameState.chests || {};
        return Object.values(chests).filter(chest => !chest.opened && Date.now() <= chest.expiresAt);
    },

    /**
     * 清理过期宝箱
     */
    cleanupExpiredChests() {
        const chests = GameState.chests || {};
        for (const [id, chest] of Object.entries(chests)) {
            if (Date.now() > chest.expiresAt) {
                delete chests[id];

                // 触发事件
                if (GameState.eventSystem) {
                    GameState.eventSystem.emit('chestExpired', chest);
                }
            }
        }
    }
};

// 初始化（当模块加载时）
Chests.init();
