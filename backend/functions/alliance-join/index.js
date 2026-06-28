/**
 * 联盟加入 SCF 函数
 * 允许玩家加入联盟
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
        const { allianceId } = JSON.parse(body || '{}');

        // 验证输入
        if (!allianceId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ success: false, error: '缺少联盟ID' }),
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

        // 检查联盟是否存在
        const allianceDoc = await db.collection('alliances').doc(allianceId).get();
        if (!allianceDoc.data || allianceDoc.data.length === 0) {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ success: false, error: '联盟不存在' }),
            };
        }

        const alliance = allianceDoc.data[0];

        // 检查联盟是否公开
        if (!alliance.isPublic) {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ success: false, error: '该联盟不公开' }),
            };
        }

        // 加入联盟
        await db.collection('alliances').doc(allianceId).update({
            members: _.push([userId]),
            updatedAt: new Date(),
        });

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
                    message: '成功加入联盟',
                },
            }),
        };
    } catch (error) {
        console.error('Join alliance error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, error: error.message }),
        };
    }
};
