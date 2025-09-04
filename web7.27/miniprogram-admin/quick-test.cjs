// 快速测试COS上传功能
const cloudbase = require('@cloudbase/js-sdk');

async function quickTest() {
    console.log('🧪 开始COS上传功能快速测试...\n');
    
    // 1. 初始化环境
    console.log('1️⃣ 初始化CloudBase环境...');
    const app = cloudbase.init({
        env: 'cloudbase-3g4w6lls8a5ce59b'
    });
    console.log('✅ 环境初始化成功\n');
    
    // 2. 匿名登录
    console.log('2️⃣ 执行匿名登录...');
    try {
        const auth = app.auth();
        await auth.signInAnonymously();
        const loginState = await auth.getLoginState();
        
        if (loginState && loginState.isLoggedIn) {
            console.log('✅ 匿名登录成功');
            console.log(`   用户ID: ${loginState.user?.uid || '匿名用户'}\n`);
        } else {
            throw new Error('登录状态异常');
        }
    } catch (error) {
        console.error('❌ 登录失败:', error.message);
        return;
    }
    
    // 3. 测试云函数
    console.log('3️⃣ 测试getCosSts云函数...');
    try {
        const result = await app.callFunction({
            name: 'getCosSts',
            data: {
                prefix: 'images/'
            }
        });
        
        console.log('📋 云函数返回结果:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.result && result.result.success) {
            const credentials = result.result.data.credentials;
            console.log('\n✅ 获取COS临时密钥成功');
            console.log(`   tmpSecretId: ${credentials.tmpSecretId ? '已获取' : '缺失'}`);
            console.log(`   tmpSecretKey: ${credentials.tmpSecretKey ? '已获取' : '缺失'}`);
            console.log(`   sessionToken: ${credentials.sessionToken ? '已获取' : '缺失'}`);
            console.log(`   过期时间: ${new Date(credentials.expiredTime * 1000).toLocaleString()}\n`);
        } else {
            throw new Error(result.result?.error || '云函数返回失败');
        }
    } catch (error) {
        console.error('❌ 云函数调用失败:', error.message);
        console.log('\n🔧 可能的解决方案:');
        console.log('   1. 检查云函数是否已部署');
        console.log('   2. 检查环境权限配置');
        console.log('   3. 检查网络连接');
        return;
    }
    
    // 4. 测试总结
    console.log('4️⃣ 测试总结');
    console.log('✅ 环境配置: 正常');
    console.log('✅ 用户认证: 正常');
    console.log('✅ 云函数调用: 正常');
    console.log('✅ COS临时密钥: 正常');
    console.log('\n🎉 COS上传功能基础测试通过！');
    console.log('\n📝 下一步:');
    console.log('   1. 使用浏览器测试页面进行完整测试');
    console.log('   2. 测试实际的图片上传功能');
    console.log('   3. 验证上传后的图片访问');
}

// 运行测试
quickTest().catch(error => {
    console.error('�� 测试过程中发生错误:', error);
    process.exit(1);
});
