/**
 * 卡牌面板组件 (User Story 4)
 * 显示玩家的卡牌收藏、卡牌效果和购买卡牌包
 */

import { GameState } from '../../game/GameState.js';
import { Cards } from '../../game/cards.js';

export class CardPanel {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.updateInterval = null;
    }

    /**
     * 初始化卡牌面板
     */
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`Container #${this.containerId} not found`);
            return;
        }

        this.render();
        this.startAutoUpdate();
        this.bindEvents();
    }

    /**
     * 渲染卡牌面板
     */
    render() {
        const playerCards = GameState.player.cards || [];

        this.container.innerHTML = `
            <div class="card-panel">
                <h3>🃏 卡牌 / Cards</h3>

                <div class="card-stats">
                    <div class="stat-item">
                        <span class="stat-label">收藏 / Collection:</span>
                        <span class="stat-value" id="card-count">${playerCards.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">代币 / Tokens:</span>
                        <span class="stat-value" id="card-tokens">${GameState.player.tokens || 0}</span>
                    </div>
                </div>

                <div class="card-actions">
                    <button class="btn-buy-pack" id="btn-buy-card-pack">
                        📦 购买卡牌包 / Buy Card Pack (5 🎟️)
                    </button>
                    <button class="btn-view-cards" id="btn-view-cards">
                        🃏 查看卡牌 / View Cards
                    </button>
                </div>

                <div class="card-collection">
                    <h4>我的卡牌 / My Cards</h4>
                    <div class="card-list" id="card-list">
                        ${playerCards.length === 0 ? '<p class="no-cards">暂无卡牌 / No cards yet</p>' : ''}
                        ${this.renderCardItems(playerCards)}
                    </div>
                </div>

                <div class="card-effects">
                    <h4>永久效果 / Permanent Effects</h4>
                    <div class="effects-list" id="card-effects-list">
                        ${this.renderCardEffects()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染卡牌项
     * @param {Array} cards - 卡牌数组
     * @returns {string} HTML 字符串
     */
    renderCardItems(cards) {
        if (!cards || cards.length === 0) return '';

        // 显示最近获得的 5 张卡牌
        const recentCards = cards.slice(-5).reverse();

        return recentCards.map(card => {
            const rarityClass = card.rarity || 'common';
            return `
                <div class="card-item ${rarityClass}">
                    <div class="card-icon">${this.getCardIcon(card.type)}</div>
                    <div class="card-info">
                        <span class="card-name">${card.name || 'Unknown Card'}</span>
                        <span class="card-rarity">${this.getRarityName(card.rarity)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * 渲染卡牌效果
     * @returns {string} HTML 字符串
     */
    renderCardEffects() {
        const effects = Cards.calculateAllEffects();

        return `
            <div class="effect-item">
                <span class="effect-label">👥 人口加成 / Population Bonus:</span>
                <span class="effect-value">+${effects.population || 0}</span>
            </div>
            <div class="effect-item">
                <span class="effect-label">⚔️ 军事加成 / Military Bonus:</span>
                <span class="effect-value">+${effects.military || 0}</span>
            </div>
            <div class="effect-item">
                <span class="effect-label">💰 金币加成 / Gold Bonus:</span>
                <span class="effect-value">+${effects.gold || 0}%</span>
            </div>
            <div class="effect-item">
                <span class="effect-label">🍖 食物加成 / Food Bonus:</span>
                <span class="effect-value">+${effects.food || 0}%</span>
            </div>
        `;
    }

    /**
     * 获取卡牌图标
     * @param {string} type - 卡牌类型
     * @returns {string} 图标
     */
    getCardIcon(type) {
        const icons = {
            population: '👥',
            military: '⚔️',
            gold: '💰',
            food: '🍖',
            infrastructure: '🏗️',
            special: '⭐',
        };
        return icons[type] || '🃏';
    }

    /**
     * 获取稀有度名称
     * @param {string} rarity - 稀有度
     * @returns {string} 稀有度名称
     */
    getRarityName(rarity) {
        const names = {
            common: '普通 / Common',
            uncommon: '优秀 / Uncommon',
            rare: '稀有 / Rare',
            epic: '史诗 / Epic',
            legendary: '传说 / Legendary',
        };
        return names[rarity] || '未知 / Unknown';
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
        }, 5000); // 每5秒更新一次
    }

    /**
     * 更新卡牌显示
     */
    update() {
        // 更新卡牌数量
        const cardCount = document.getElementById('card-count');
        if (cardCount) {
            cardCount.textContent = (GameState.player.cards || []).length;
        }

        // 更新代币数量
        const tokens = document.getElementById('card-tokens');
        if (tokens) {
            tokens.textContent = GameState.player.tokens || 0;
        }

        // 更新卡牌列表
        this.updateCardList();

        // 更新卡牌效果
        this.updateCardEffects();
    }

    /**
     * 更新卡牌列表
     */
    updateCardList() {
        const cardList = document.getElementById('card-list');
        if (!cardList) return;

        const playerCards = GameState.player.cards || [];

        if (playerCards.length === 0) {
            cardList.innerHTML = '<p class="no-cards">暂无卡牌 / No cards yet</p>';
            return;
        }

        cardList.innerHTML = this.renderCardItems(playerCards);
    }

    /**
     * 更新卡牌效果
     */
    updateCardEffects() {
        const effectsList = document.getElementById('card-effects-list');
        if (!effectsList) return;

        effectsList.innerHTML = this.renderCardEffects();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 购买卡牌包按钮
        const buyPackBtn = document.getElementById('btn-buy-card-pack');
        if (buyPackBtn) {
            buyPackBtn.addEventListener('click', () => {
                this.buyCardPack();
            });
        }

        // 查看卡牌按钮
        const viewCardsBtn = document.getElementById('btn-view-cards');
        if (viewCardsBtn) {
            viewCardsBtn.addEventListener('click', () => {
                this.showAllCards();
            });
        }
    }

    /**
     * 购买卡牌包
     */
    buyCardPack() {
        const result = Cards.buyCardPack();

        if (result.success) {
            this.showNotification(`获得 ${result.cards.length} 张卡牌！`, 'success');
            this.render(); // 重新渲染以显示新卡牌

            // 显示获得的卡牌
            this.showObtainedCards(result.cards);
        } else {
            this.showNotification(result.reason || '购买失败', 'error');
        }
    }

    /**
     * 显示获得的卡牌
     * @param {Array} cards - 获得的卡牌数组
     */
    showObtainedCards(cards) {
        if (GameState.eventSystem) {
            GameState.eventSystem.emit('showModal', {
                title: '🃏 获得新卡牌 / New Cards!',
                content: `
                    <div class="obtained-cards">
                        ${cards.map(card => `
                            <div class="obtained-card ${card.rarity}">
                                <div class="card-icon-large">${this.getCardIcon(card.type)}</div>
                                <h4>${card.name || 'Unknown Card'}</h4>
                                <p class="rarity">${this.getRarityName(card.rarity)}</p>
                                <p class="effect">效果 / Effect: ${card.effect || 'Unknown'}</p>
                            </div>
                        `).join('')}
                        <button class="btn-continue" onclick="this.closest('.modal').remove()">
                            继续 / Continue
                        </button>
                    </div>
                `,
            });
        }
    }

    /**
     * 显示所有卡牌
     */
    showAllCards() {
        const playerCards = GameState.player.cards || [];

        if (GameState.eventSystem) {
            GameState.eventSystem.emit('showModal', {
                title: '🃏 我的卡牌 / My Cards',
                content: `
                    <div class="all-cards">
                        <div class="cards-grid">
                            ${playerCards.length === 0 ? '<p>暂无卡牌 / No cards yet</p>' : ''}
                            ${playerCards.map(card => `
                                <div class="card-item-full ${card.rarity}">
                                    <div class="card-icon">${this.getCardIcon(card.type)}</div>
                                    <h4>${card.name || 'Unknown Card'}</h4>
                                    <p class="rarity">${this.getRarityName(card.rarity)}</p>
                                    <p class="effect">${card.effect || 'No effect'}</p>
                                    <p class="obtained">获得于 / Obtained: ${new Date(card.obtainedAt).toLocaleDateString()}</p>
                                </div>
                            `).join('')}
                        </div>
                        <button class="btn-close" onclick="this.closest('.modal').remove()">
                            关闭 / Close
                        </button>
                    </div>
                `,
            });
        }
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
     * 销毁卡牌面板
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}
