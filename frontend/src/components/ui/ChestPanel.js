/**
 * 宝箱面板组件 (User Story 3 - T036)
 * 显示宝箱、开启动画、奖励显示
 */

import { GameState } from '../../game/GameState.js';
import { Chests } from '../../game/chests.js';

export class ChestPanel {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.updateInterval = null;
        this.listeners = [];
    }

    /**
     * 初始化宝箱面板
     */
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`Container #${this.containerId} not found`);
            return;
        }

        this.render();
        this.startAutoUpdate();
        this.bindGameEvents();
    }

    /**
     * 渲染宝箱面板 (T036)
     */
    render() {
        const activeChests = Chests.getActiveChests();

        this.container.innerHTML = `
            <div class="chest-panel">
                <h3>📦 宝箱 / Chests</h3>

                <div class="chest-info">
                    <p>活跃宝箱 / Active Chests: <span id="chest-count">${activeChests.length}</span></p>
                </div>

                <div class="chest-list" id="chest-list">
                    ${this.renderChestList(activeChests)}
                </div>

                <div class="chest-actions">
                    <button class="btn-spawn-chest" id="btn-spawn-chest">
                        🎲 生成测试宝箱 / Spawn Test Chest
                    </button>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    /**
     * 渲染宝箱列表
     */
    renderChestList(chests) {
        if (chests.length === 0) {
            return '<p class="no-chests">无活跃宝箱 / No active chests</p>';
        }

        return chests.map(chest => {
            const type = Chests.types[chest.type];
            if (!type) return '';

            const timeLeft = Math.max(0, chest.expiresAt - Date.now());
            const minutesLeft = Math.floor(timeLeft / 60000);
            const secondsLeft = Math.floor((timeLeft % 60000) / 1000);

            return `
                <div class="chest-item ${chest.type}" data-chest-id="${chest.id}">
                    <div class="chest-icon">${type.icon}</div>
                    <div class="chest-info">
                        <div class="chest-name">${type.name} / ${type.nameEn}</div>
                        <div class="chest-timer">⏳ ${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}</div>
                    </div>
                    <button class="btn-open-chest" data-chest-id="${chest.id}">
                        开启 / Open
                    </button>
                </div>
            `;
        }).join('');
    }

    /**
     * 启动自动更新
     */
    startAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            this.update();
        }, 2000); // 每2秒更新一次
    }

    /**
     * 更新宝箱显示
     */
    update() {
        const activeChests = Chests.getActiveChests();
        const chestCount = document.getElementById('chest-count');
        const chestList = document.getElementById('chest-list');

        if (chestCount) {
            chestCount.textContent = activeChests.length;
        }

        if (chestList) {
            chestList.innerHTML = this.renderChestList(activeChests);
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 开启宝箱按钮（事件委托）
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-open-chest')) {
                const chestId = e.target.dataset.chestId;
                this.openChest(chestId);
            }

            if (e.target.classList.contains('btn-spawn-chest')) {
                this.spawnTestChest();
            }
        });
    }

    /**
     * 绑定游戏事件
     */
    bindGameEvents() {
        // 宝箱生成事件
        const onChestSpawned = (chest) => {
            this.showNotification(`📦 宝箱生成 / Chest spawned: ${Chests.types[chest.type]?.name}`, 'info');
            this.update();
        };
        if (GameState.eventSystem) {
            GameState.eventSystem.on('chestSpawned', onChestSpawned);
            this.listeners.push(() => GameState.eventSystem.off('chestSpawned', onChestSpawned));
        }

        // 宝箱开启事件
        const onChestOpened = (data) => {
            this.showChestOpenAnimation(data.chest, data.rewards);
            this.update();
        };
        if (GameState.eventSystem) {
            GameState.eventSystem.on('chestOpened', onChestOpened);
            this.listeners.push(() => GameState.eventSystem.off('chestOpened', onChestOpened));
        }

        // 宝箱过期事件
        const onChestExpired = (chest) => {
            this.showNotification(`⏰ 宝箱过期 / Chest expired`, 'warning');
            this.update();
        };
        if (GameState.eventSystem) {
            GameState.eventSystem.on('chestExpired', onChestExpired);
            this.listeners.push(() => GameState.eventSystem.off('chestExpired', onChestExpired));
        }
    }

    /**
     * 开启宝箱
     */
    openChest(chestId) {
        const result = Chests.openChest(chestId);

        if (result.success) {
            this.showChestOpenAnimation(
                GameState.chests ? GameState.chests[chestId] : null,
                result.rewards
            );
        } else {
            this.showNotification(result.reason || '开启失败 / Failed to open', 'error');
        }
    }

    /**
     * 显示宝箱开启动画 (T036)
     */
    showChestOpenAnimation(chest, rewards) {
        if (!chest) return;

        const type = Chests.types[chest.type];
        if (!type) return;

        // 创建动画模态框
        const modal = document.createElement('div');
        modal.className = 'chest-open-modal';
        modal.innerHTML = `
            <div class="chest-open-content">
                <h2>🎊 宝箱开启 / Chest Opened!</h2>

                <div class="chest-open-animation">
                    <div class="chest-icon-large ${chest.type}">
                        ${type.icon}
                    </div>
                    <div class="chest-name-large">${type.name} / ${type.nameEn}</div>
                </div>

                <div class="chest-rewards">
                    <h3>🎁 奖励 / Rewards</h3>
                    ${this.renderRewards(rewards)}
                </div>

                <button class="btn-continue" onclick="this.closest('.chest-open-modal').remove()">
                    继续 / Continue
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        // 添加动画效果
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // 5秒后自动关闭
        setTimeout(() => {
            if (modal.parentNode) {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            }
        }, 5000);
    }

    /**
     * 渲染奖励
     */
    renderRewards(rewards) {
        if (!rewards) return '<p>无奖励 / No rewards</p>';

        const rewardItems = [];

        if (rewards.gold) {
            rewardItems.push(`<div class="reward-item">💰 金币 / Gold: <strong>+${rewards.gold}</strong></div>`);
        }
        if (rewards.food) {
            rewardItems.push(`<div class="reward-item">🍖 食物 / Food: <strong>+${rewards.food}</strong></div>`);
        }
        if (rewards.population) {
            rewardItems.push(`<div class="reward-item">👥 人口 / Population: <strong>+${rewards.population}</strong></div>`);
        }
        if (rewards.military) {
            rewardItems.push(`<div class="reward-item">⚔️ 军事 / Military: <strong>+${rewards.military}</strong></div>`);
        }
        if (rewards.tokens) {
            rewardItems.push(`<div class="reward-item">🎟️ 代币 / Tokens: <strong>+${rewards.tokens}</strong></div>`);
        }
        if (rewards.cards) {
            rewardItems.push(`<div class="reward-item">🃏 卡牌 / Cards: <strong>+${rewards.cards}</strong></div>`);
        }

        return rewardItems.join('');
    }

    /**
     * 生成测试宝箱
     */
    spawnTestChest() {
        const chestTypes = Object.keys(Chests.types);
        const randomType = chestTypes[Math.floor(Math.random() * chestTypes.length)];

        const chest = {
            id: `chest_${Date.now()}_test`,
            type: randomType,
            position: { x: Math.random() * 100, y: Math.random() * 100 },
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

        this.showNotification(`测试宝箱生成 / Test chest spawned: ${Chests.types[randomType].name}`, 'success');
        this.update();
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        if (GameState.eventSystem) {
            GameState.eventSystem.emit('showNotification', { message, type });
        }
    }

    /**
     * 销毁宝箱面板
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        // 移除事件监听器
        this.listeners.forEach(removeListener => removeListener());
        this.listeners = [];
    }
}
