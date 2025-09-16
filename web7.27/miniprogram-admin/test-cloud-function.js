import cloudbase from '@cloudbase/js-sdk';

async function testCloudFunction() {
    try {
        console.log('🔧 初始化 CloudBase...');
        
        // 初始化 CloudBase
        const app = cloudbase.init({
            env: 'cloudbase-3g4w6lls8a5ce59b'
        });
        
        console.log('✅ CloudBase 初始化成功');
        
        // 测试匿名登录
        const auth = app.auth();
        const loginState = await auth.getLoginState();
        
        if (!loginState || !loginState.isLoggedIn) {
            console.log('🔐 用户未登录，尝试匿名登录...');
            await auth.signInAnonymously();
            console.log('✅ 匿名登录成功');
        } else {
            console.log('✅ 用户已登录');
        }
        
        // 测试云函数调用
        console.log('🚀 测试云函数调用...');
        
        const result = await app.callFunction({
            name: 'cloudStorageManager',
            data: {
                action: 'getCategories'
            }
        });
        
        console.log('📊 云函数返回结果:', JSON.stringify(result, null, 2));
        
        if (result && result.result && result.result.success) {
            console.log('✅ 云函数调用成功');
        } else {
            console.log('❌ 云函数调用失败:', result?.result?.error || '未知错误');
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

testCloudFunction();
