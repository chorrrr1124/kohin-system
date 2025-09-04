// 修复登录逻辑
const loginUser = async () => {
  try {
    addLog('🔐 正在执行用户登录...', 'info');
    
    const loginState = await ensureLogin();
    
    // 检查登录状态，包括降级状态
    if (loginState && (loginState.isLoggedIn || loginState.user?.isOffline)) {
      const userType = loginState.user?.isAnonymous ? '匿名用户' : 
                      loginState.user?.isOffline ? '离线模式' : '已注册用户';
      addLog(`✅ 用户登录成功 (${userType})`, 'success');
      setStatus(prev => ({ ...prev, userLogin: true }));
      
      // 自动进行下一步
      setTimeout(() => testGetCosSts(), 1000);
    } else {
      throw new Error('登录状态异常');
    }
    
  } catch (error) {
    addLog(`❌ 用户登录失败: ${error.message}`, 'error');
    setStatus(prev => ({ ...prev, userLogin: false }));
  }
};
