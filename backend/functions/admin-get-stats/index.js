/**
 * 管理员获取游戏统计 SCF 函数
 * 仅管理员可访问
 */

const { adminAuth } = require('../_common/admin-auth.js');
const cloud = require('@cloudbase/node-sdk');
const app = cloud.init({ env: cloud.SYMBOL_CURRENT_ENV });
const db = app.database();

exports.main = adminAuth(async (event, context) => {
    // CORS 头
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    try {
        // 获取用户统计
        const userCountResult = await db.collection('users').count();
        const totalUsers = userCountResult.total;

        const activeUsersResult = await db.collection('users').where({
            lastLogin: db.command.gte(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        }).count();
        const activeUsers = activeUsersResult.total;

        // 获取游戏统计
        const saveCountResult = await db.collection('game_saves').count();
        const totalSaves = saveCountResult.total;

        // 获取联盟统计
        const allianceCountResult = await db.collection('alliances').count();
        const totalAlliances = allianceCountResult.total;

        // 获取领土统计（从游戏状态）
        let totalTerritories = 0;
        let conqueredTerritories = 0;

        // 这里需要从游戏数据中统计，暂时使用默认值
        // TODO: 实现从游戏数据中统计领土信息

        const stats = {
            users: {
                total: totalUsers,
                active: activeUsers,
                inactive: totalUsers - activeUsers,
            },
            game: {
                totalSaves: totalSaves,
                totalAlliances: totalAlliances,
                totalTerritories: 300, // 地球 200 + 火星 100
                conqueredTerritories: 0, // TODO: 从游戏数据中统计
            },
            server: {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                nodeVersion: process.version,
            }
        };

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                data: {
                    stats
                },
            }),
        };
    } catch (error) {
        console.error('Admin get stats error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, error: error.message }),
        };
    }
});
