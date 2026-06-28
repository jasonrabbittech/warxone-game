/**
 * 联盟创建 SCF 函数
 * 允许玩家创建联盟
 */

const cloud = require('@cloudbase/node-sdk');
const app = cloud.init({ env: cloud.SYMBOL_CURRENT_ENV });
const db = app.database();
const _ = db.command;

exports.main = async (event, context) => {
    const { headers, body } = event;

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

        // 解析请求体
        const { name, description, isPublic } = JSON.parse(body || '{}');

        // 验证输入
        if (!name || name.length < 3 || name.length > 30) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ success: false, error: '联盟名称必须为3-30个字符' }),
            };
        }

        // 检查用户是否已在联盟中
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.data && userDoc.data[0]?.allianceId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ success: false, error: '您已在一个联盟中' }),
            };
        }

        // 创建联盟
        const allianceData = {
            name,
            description: description || '',
            isPublic: isPublic !== false,
            leaderId: userId,
            members: [userId],
            createdAt: new Date(),
            level: 1,
            experience: 0,
        };

        const result = await db.collection('alliances').add(allianceData);
        const allianceId = result.id;

        // 更新用户的联盟ID
        await db.collection('users').doc(userId).update({
            allianceId,
            updatedAt: new Date(),
        });

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                data: {
                    allianceId,
                    alliance: allianceData,
                },
            }),
        };
    } catch (error) {
        console.error('Create alliance error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, error: error.message }),
        };
    }
};
