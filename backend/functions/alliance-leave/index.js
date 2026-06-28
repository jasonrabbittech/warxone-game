/**
 * 联盟离开 SCF 函数
 * 允许玩家离开联盟
 */

const cloud = require('@cloudbase/node-sdk');
const app = cloud.init({ env: cloud.SYMBOL_CURRENT_ENV });
const db = app.database();
const _ = db.command;

exports.main = async (event, context) => {
    const { headers } = event;

    // CORS 头
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 处理 OPTIONS 请求
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: '',
        };
    }

    // 验证 JWT
    const token = headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return {
            statusCode: 401,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, error: 'Unauthorized' }),
        };
    }

    try {
        // 验证 token 并获取用户信息
        const decoded = await app.auth().verifyToken(token);
        const userId = decoded.uid;

        // 检查用户是否在联盟中
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.data || userDoc.data.length === 0 || !userDoc.data[0]?.allianceId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ success: false, error: '您不在任何联盟中' }),
            };
        }

        const allianceId = userDoc.data[0].allianceId;

        // 从联盟中移除用户
        await db.collection('alliances').doc(allianceId).update({
            members: _.pull(userId),
            updatedAt: new Date(),
        });

        // 更新用户（移除联盟ID）
        await db.collection('users').doc(userId).update({
            allianceId: _.remove(),
            updatedAt: new Date(),
        });

        // 检查联盟是否为空
        const allianceDoc = await db.collection('alliances').doc(allianceId).get();
        if (allianceDoc.data && allianceDoc.data[0]?.members?.length === 0) {
            // 删除空联盟
            await db.collection('alliances').doc(allianceId).remove();
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                data: {
                    message: '成功离开联盟',
                },
            }),
        };
    } catch (error) {
        console.error('Leave alliance error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, error: error.message }),
        };
    }
};
