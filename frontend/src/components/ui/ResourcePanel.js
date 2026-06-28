/**
 * 资源面板组件 (User Story 3 - T033)
 * 显示所有资源类型，每秒更新
 */

import { GameState } from '../../game/GameState.js';
import { Resources } from '../../game/resources.js';

export class ResourcePanel {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.updateInterval = null;
        this.listeners = [];
    }

    /**
     * 初始化资源面板
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
     * 渲染资源面板 (T033)
     */
    render() {
        const res = Resources.getDisplayData();

        this.container.innerHTML = `
            <div class="resource-panel">
                <h3>💰 资源 / Resources</h3>

                <div class="resource-items">
                    <div class="resource-item population">
                        <span class="resource-icon">👥</span>
                        <div class="resource-info">
                            <span class="resource-label">人口 / Population</span>
                            <span class="resource-value" id="resource-population">${res.population.toLocaleString()}</span>
                        </div>
                    </div>

                    <div class="resource-item gold">
                        <span class="resource-icon">💰</span>
                        <div class="resource-info">
                            <span class="resource-label">金币 / Gold</span>
                            <span class="resource-value" id="resource-gold">${res.gold.toLocaleString()}</span>
                        </div>
                    </div>

                    <div class="resource-item food">
                        <span class="resource-icon">🍖</span>
                        <div class="resource-info">
                            <span class="resource-label">食物 / Food</span>
                            <span class="resource-value" id="resource-food">${res.food.toLocaleString()}</span>
                            <div class="food-warning" id="food-warning" style="display: none;">
                                ⚠️ 饥饿 / Starvation!
                            </div>
                        </div>
                    </div>

                    <div class="resource-item tokens">
                        <span class="resource-icon">🎟️</span>
                        <div class="resource-info">
                            <span class="resource-label">代币 / Tokens</span>
                            <span class="resource-value" id="resource-tokens">${res.tokens.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div class="resource-rates">
                    <h4>增长率 / Growth Rates</h4>
                    <div class="rate-items">
                        <div class="rate-item">
                            <span class="rate-label">人口增长 / Population Growth:</span>
                            <span class="rate-value" id="population-growth-rate">+0/10s</span>
                        </div>
                        <div class="rate-item">
                            <span class="rate-label">食物消耗 / Food Consumption:</span>
                            <span class="rate-value" id="food-consumption-rate">-0/min</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 启动自动更新 (T033)
     * 每秒更新显示
     */
    startAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            this.update();
        }, 1000); // 每秒更新一次
    }

    /**
     * 更新资源显示
     */
    update() {
        const res = Resources.getDisplayData();

        // 更新资源数值
        this.updateResourceValue('resource-population', res.population);
        this.updateResourceValue('resource-gold', res.gold);
        this.updateResourceValue('resource-food', res.food);
        this.updateResourceValue('resource-tokens', res.tokens);

        // 更新增长率显示
        this.updateRates();

        // 检查饥饿状态
        this.checkStarvation();
    }

    /**
     * 更新资源数值（带动画）
     */
    updateResourceValue(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const currentValue = parseInt(element.textContent.replace(/,/g, '')) || 0;

        if (currentValue !== newValue) {
            element.textContent = newValue.toLocaleString();
            element.classList.add('value-changed');

            // 根据增减设置颜色
            if (newValue > currentValue) {
                element.classList.add('value-increased');
                element.classList.remove('value-decreased');
            } else if (newValue < currentValue) {
                element.classList.add('value-decreased');
                element.classList.remove('value-increased');
            }

            setTimeout(() => {
                element.classList.remove('value-changed', 'value-increased', 'value-decreased');
            }, 500);
        }
    }

    /**
     * 更新增长率显示
     */
    updateRates() {
        const territoryCount = (GameState.player.territories || []).length;
        const militaryCount = GameState.player.military || 0;

        // 人口增长率：每10秒 +100 per territory
        const populationGrowthRate = territoryCount * 100;
        const populationRateElement = document.getElementById('population-growth-rate');
        if (populationRateElement) {
            populationRateElement.textContent = `+${populationGrowthRate}/10s`;
        }

        // 食物消耗率：每分钟 -1 per 10 military
        const foodConsumptionRate = Math.floor(militaryCount / 10);
        const foodRateElement = document.getElementById('food-consumption-rate');
        if (foodRateElement) {
            foodRateElement.textContent = `-${foodConsumptionRate}/min`;
        }
    }

    /**
     * 检查饥饿状态 (T032)
     */
    checkStarvation() {
        const foodWarning = document.getElementById('food-warning');
        if (!foodWarning) return;

        if (GameState.player.resources.food <= 0) {
            foodWarning.style.display = 'block';

            // 脉动动画
            foodWarning.classList.add('pulse');
        } else {
            foodWarning.style.display = 'none';
            foodWarning.classList.remove('pulse');
        }
    }

    /**
     * 绑定游戏事件
     */
    bindGameEvents() {
        // 人口增长事件
        const onPopulationGrown = (e) => {
            this.showNotification(`人口增长 / Population grown: +${e.detail.amount}`, 'success');
        };
        document.addEventListener('population-grown', onPopulationGrown);
        this.listeners.push(() => document.removeEventListener('population-grown', onPopulationGrown));

        // 食物消耗事件
        const onFoodConsumed = (e) => {
            if (e.detail.amount > 0) {
                this.showNotification(`食物消耗 / Food consumed: -${e.detail.amount}`, 'info');
            }
        };
        document.addEventListener('food-consumed', onFoodConsumed);
        this.listeners.push(() => document.removeEventListener('food-consumed', onFoodConsumed));

        // 饥饿惩罚事件
        const onStarvationPenalty = (e) => {
            this.showNotification(`⚠️ 饥饿惩罚 / Starvation penalty: -${e.detail.penalty} military`, 'warning');
        };
        document.addEventListener('starvation-penalty', onStarvationPenalty);
        this.listeners.push(() => document.removeEventListener('starvation-penalty', onStarvationPenalty));

        // 金币获得事件
        const onGoldReceived = (e) => {
            this.showNotification(`金币获得 / Gold received: +${e.detail.amount}`, 'success');
        };
        document.addEventListener('gold-received', onGoldReceived);
        this.listeners.push(() => document.removeEventListener('gold-received', onGoldReceived));

        // 资源消耗事件
        const onResourcesConsumed = (e) => {
            // 不显示通知，避免刷屏
        };
        document.addEventListener('resources-consumed', onResourcesConsumed);
        this.listeners.push(() => document.removeEventListener('resources-consumed', onResourcesConsumed));

        // 礼包接收事件
        const onGiftPackageReceived = (e) => {
            this.showNotification(`🎁 礼包接收 / Gift package received!`, 'success');
        };
        document.addEventListener('gift-package-received', onGiftPackageReceived);
        this.listeners.push(() => document.removeEventListener('gift-package-received', onGiftPackageReceived));
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
     * 销毁资源面板
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
