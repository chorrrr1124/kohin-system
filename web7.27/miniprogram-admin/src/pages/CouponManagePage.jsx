import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Gift, 
  Calendar,
  DollarSign,
  Users,
  TrendingUp
} from 'lucide-react';
import { XMarkIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { app, ensureLogin, auth, getDatabase } from '../utils/cloudbase';

const CouponManagePage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'fixed',
    value: '',
    minAmount: '',
    description: '',
    totalCount: '',
    startTime: '',
    endTime: '',
    status: 'active',
    gameplayType: 'normal', // 新增：玩法类型
    gameplayConfig: {}, // 新增：玩法配置
    userLimit: 1, // 新增：每人限领数量
    dailyLimit: 0, // 新增：每日限领数量（0表示不限制）
    memberOnly: false, // 新增：是否会员专享
    shareReward: false, // 新增：是否分享获得
    taskRequired: '', // 新增：完成任务要求
    categoryLimit: [], // 新增：限制商品分类
    productLimit: [] // 新增：限制特定商品
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  

  const loadCoupons = async () => {
    try {
      setLoading(true);
      console.log('🔄 开始加载优惠券...');
      
      await ensureLogin();
      console.log('✅ 登录成功');
      
      const db = getDatabase();
      console.log('📊 数据库实例:', db);
      
      // 尝试直接查询数据库
      try {
        console.log('🔍 尝试查询mall_coupons集合...');
        const result = await db.collection('mall_coupons').get();
      
      console.log('📋 数据库查询结果:', result);
      console.log('📊 查询到的优惠券数量:', result.data?.length || 0);
      console.log('📝 优惠券数据:', result.data);
      
        if (result.data && result.data.length > 0) {
          console.log('✅ 成功获取到优惠券数据');
      setCoupons(result.data || []);
      console.log('✅ 优惠券列表更新完成');
          return; // 成功则直接返回
        } else {
          console.log('⚠️ mall_coupons集合中没有数据');
        }
        
      } catch (dbError) {
        console.log('⚠️ mall_coupons集合查询失败:', dbError);
        console.log('⚠️ 错误代码:', dbError.code);
        console.log('⚠️ 错误信息:', dbError.message);
      
        // 尝试查询 'coupons' 集合
        try {
          console.log('🔍 尝试查询coupons集合...');
          const result = await db.collection('coupons')
            .orderBy('createTime', 'desc')
            .get();
          
          console.log('📋 使用coupons集合查询成功:', result);
          if (result.data && result.data.length > 0) {
            setCoupons(result.data || []);
          return;
        }
        } catch (couponsError) {
          console.log('⚠️ coupons集合也不存在:', couponsError.message);
        }
      }
      
      // 如果所有集合都没有数据，尝试创建测试数据
      console.log('🔧 尝试创建测试优惠券...');
      try {
        // 尝试创建一个测试文档来创建集合
        const testCoupon = {
          name: '测试优惠券',
          type: 'fixed',
          value: 10,
          minAmount: 100,
          description: '自动创建的测试优惠券',
          totalCount: 1,
          usedCount: 0,
          startTime: new Date(),
          endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
          status: 'active',
          createTime: new Date(),
          updateTime: new Date()
        };
        
        console.log('📝 准备创建测试优惠券:', testCoupon);
        const createResult = await db.collection('mall_coupons').add(testCoupon);
        console.log('✅ 测试优惠券创建成功:', createResult);
        
        // 重新查询数据
        const result = await db.collection('mall_coupons').get();
        
        setCoupons(result.data || []);
        console.log('✅ 优惠券列表更新完成');
        
      } catch (createError) {
        console.error('❌ 创建测试优惠券失败:', createError);
        console.error('❌ 错误代码:', createError.code);
        console.error('❌ 错误信息:', createError.message);
        
        // 如果创建失败，提示用户
        if (createError.code === 'PERMISSION_DENIED') {
          console.log('🔧 检测到权限问题，请联系管理员检查数据库权限');
          alert('数据库权限不足，请联系管理员检查数据库权限设置');
        }
        
        // 即使创建失败，也设置空数组，避免页面崩溃
        setCoupons([]);
        console.log('⚠️ 设置空优惠券列表');
      }
      
    } catch (error) {
      console.error('❌ 加载优惠券失败:', error);
      console.error('❌ 错误代码:', error.code);
      console.error('❌ 错误信息:', error.message);
      
      // 显示错误信息
      alert('加载优惠券失败: ' + error.message);
      
      // 设置空数组，避免页面崩溃
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('💾 开始保存优惠券...');
      console.log('📝 表单数据:', formData);
      
      await ensureLogin();
      console.log('✅ 登录成功');
      
      const db = getDatabase();
      console.log('📊 数据库实例:', db);
      
      const couponData = {
        ...formData,
        value: parseFloat(formData.value),
        minAmount: parseFloat(formData.minAmount),
        totalCount: parseInt(formData.totalCount),
        userLimit: parseInt(formData.userLimit),
        dailyLimit: parseInt(formData.dailyLimit),
        usedCount: editingCoupon ? editingCoupon.usedCount : 0,
        updateTime: new Date().toISOString(),
        // 新增：规则引擎字段
        productRestriction: formData.productRestriction || 'none',
        userRestriction: formData.userRestriction || 'none',
        timeRestriction: formData.timeRestriction || 'none',
        orderRestriction: formData.orderRestriction || 'none',
        allowedCategories: formData.allowedCategories || '',
        allowedProducts: formData.allowedProducts || '',
        minUserLevel: parseInt(formData.minUserLevel) || 0,
        startHour: formData.startHour || '',
        endHour: formData.endHour || '',
        minQuantity: parseInt(formData.minQuantity) || 0,
        stackable: formData.stackable || false,
          excludeDiscounted: formData.excludeDiscounted || false,
          requireLogin: formData.requireLogin || false,
          // 新增：自动分发配置字段
          autoIssue: formData.autoIssue || false,
          issueRules: formData.issueRules || {},
          ruleDetails: formData.ruleDetails || {}
        };

      console.log('📋 准备保存的优惠券数据:', couponData);
      
      let saveResult;
      if (editingCoupon) {
        console.log('🔄 更新现有优惠券:', editingCoupon._id);
        saveResult = await db.collection('mall_coupons')
          .doc(editingCoupon._id)
          .update(couponData);
        console.log('✅ 更新结果:', saveResult);
      } else {
        couponData.createTime = new Date().toISOString();
        console.log('➕ 创建新优惠券');
        saveResult = await db.collection('mall_coupons').add(couponData);
        console.log('✅ 创建结果:', saveResult);
      }

      setShowModal(false);
      setEditingCoupon(null);
      resetForm();
      alert(editingCoupon ? '优惠券更新成功！' : '优惠券创建成功！');
      
      console.log('🔄 重新加载优惠券列表...');
      await loadCoupons(); // 等待加载完成
      console.log('✅ 保存流程完成');
    } catch (error) {
      console.error('保存优惠券失败:', error);
      console.error('❌ 错误代码:', error.code);
      console.error('❌ 错误信息:', error.message);
      
      // 如果是集合不存在的错误，提示用户
      if (error.code === 'DATABASE_COLLECTION_NOT_EXIST') {
        console.log('🔧 检测到集合不存在，请先创建数据库集合');
        alert('数据库集合不存在，请联系管理员创建相应的数据库集合');
          return;
      }
      
      alert('保存失败: ' + error.message);
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      name: coupon.name || '',
      type: coupon.type || 'fixed',
      value: coupon.value?.toString() || '',
      minAmount: coupon.minAmount?.toString() || '',
      description: coupon.description || '',
      totalCount: coupon.totalCount?.toString() || '',
      startTime: coupon.startTime || '',
      endTime: coupon.endTime || '',
      status: coupon.status || 'active',
      gameplayType: coupon.gameplayType || 'normal',
      gameplayConfig: coupon.gameplayConfig || {},
      userLimit: coupon.userLimit || 1,
      dailyLimit: coupon.dailyLimit || 0,
      memberOnly: coupon.memberOnly || false,
      shareReward: coupon.shareReward || false,
      taskRequired: coupon.taskRequired || '',
      categoryLimit: coupon.categoryLimit || [],
      productLimit: coupon.productLimit || [],
      // 新增：规则引擎字段
      productRestriction: coupon.productRestriction || 'none',
      userRestriction: coupon.userRestriction || 'none',
      timeRestriction: coupon.timeRestriction || 'none',
      orderRestriction: coupon.orderRestriction || 'none',
      allowedCategories: coupon.allowedCategories || '',
      allowedProducts: coupon.allowedProducts || '',
      minUserLevel: coupon.minUserLevel || 0,
      startHour: coupon.startHour || '',
      endHour: coupon.endHour || '',
      minQuantity: coupon.minQuantity || 0,
      stackable: coupon.stackable || false,
          excludeDiscounted: coupon.excludeDiscounted || false,
          requireLogin: coupon.requireLogin || false,
          // 新增：自动分发配置字段
          autoIssue: coupon.autoIssue || false,
          issueRules: coupon.issueRules || {},
          ruleDetails: coupon.ruleDetails || {}
        });
    setShowModal(true);
  };

  const handleDelete = async (couponId) => {
    if (!confirm('确定要删除这个优惠券吗？')) return;
    
    try {
      await ensureLogin();
      const db = getDatabase();
              await db.collection('mall_coupon').doc(couponId).remove();
      loadCoupons();
    } catch (error) {
      console.error('删除优惠券失败:', error);
      alert('删除失败，请重试');
    }
  };

  const toggleStatus = async (coupon) => {
    try {
      await ensureLogin();
      const db = getDatabase();
      const newStatus = coupon.status === 'active' ? 'inactive' : 'active';
              await db.collection('mall_coupon')
        .doc(coupon._id)
        .update({ 
          status: newStatus,
          updateTime: new Date().toISOString()
        });
      loadCoupons();
    } catch (error) {
      console.error('更新状态失败:', error);
      alert('更新失败，请重试');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'fixed',
      value: '',
      minAmount: '',
      description: '',
      totalCount: '',
      startTime: '',
      endTime: '',
      status: 'active',
      gameplayType: 'normal',
      gameplayConfig: {},
      userLimit: 1,
      dailyLimit: 0,
      memberOnly: false,
      shareReward: false,
      taskRequired: '',
      categoryLimit: [],
      productLimit: []
    });
  };

  const handleAddNew = () => {
    setEditingCoupon(null);
    resetForm();
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '永不过期';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getTypeText = (type) => {
    return type === 'fixed' ? '固定金额' : '百分比折扣';
  };

  // 获取玩法类型文本
  const getGameplayTypeText = (gameplayType) => {
    const gameplayMap = {
      'normal': '🎫 普通券',
      'flash': '⚡ 限时抢购',
      'group': '👥 拼团专享',
      'newbie': '🎁 新人专享',
      'birthday': '🎂 生日专享',
      'vip': '👑 会员专享',
      'share': '📤 分享获得',
      'task': '✅ 任务完成',
      'lucky': '🍀 幸运抽奖'
    };
    return gameplayMap[gameplayType] || '🎫 普通券';
  };

  const getValueText = (type, value) => {
    return type === 'fixed' ? `¥${value}` : `${value}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">优惠券管理</h1>
          <p className="text-gray-600 mt-1">管理商城优惠券，创建和编辑优惠活动</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddNew}
            className="btn btn-primary gap-2"
          >
            <Plus size={20} />
            新建优惠券
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总优惠券数</p>
              <p className="text-2xl font-bold text-gray-900">{coupons.length}</p>
            </div>
            <Gift className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">生效中</p>
              <p className="text-2xl font-bold text-green-600">
                {coupons.filter(c => c.status === 'active').length}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">已停用</p>
              <p className="text-2xl font-bold text-gray-600">
                {coupons.filter(c => c.status === 'inactive').length}
              </p>
            </div>
            <EyeOff className="h-8 w-8 text-gray-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总使用次数</p>
              <p className="text-2xl font-bold text-purple-600">
                {coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* 优惠券列表 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">优惠券列表</h2>
          {coupons.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无优惠券</h3>
              <p className="mt-1 text-sm text-gray-500">开始创建您的第一个优惠券</p>
              <div className="mt-6">
                <button
                  onClick={handleAddNew}
                  className="btn btn-primary gap-2"
                >
                  <Plus size={16} />
                  新建优惠券
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <div key={coupon._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Gift size={20} className="text-blue-600" />
                        <h3 className="font-semibold text-gray-900">{coupon.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          coupon.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {coupon.status === 'active' ? '生效中' : '已停用'}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {getTypeText(coupon.type)}
                        </span>
                        {/* 新增：显示玩法类型 */}
                        <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                          {getGameplayTypeText(coupon.gameplayType || 'normal')}
                        </span>
                        {/* 新增：显示自动分发状态 */}
                        {coupon.autoIssue && (
                          <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                            🤖 自动分发
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">优惠金额:</span>
                          <span className="ml-1 text-red-600 font-semibold">
                            {getValueText(coupon.type, coupon.value)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">使用门槛:</span>
                          <span className="ml-1">满¥{coupon.minAmount}</span>
                        </div>
                        <div>
                          <span className="font-medium">使用情况:</span>
                          <span className="ml-1">{coupon.usedCount || 0}/{coupon.totalCount}</span>
                        </div>
                        <div>
                          <span className="font-medium">开始时间:</span>
                          <span className="ml-1">{formatDate(coupon.startTime)}</span>
                        </div>
                        <div>
                          <span className="font-medium">结束时间:</span>
                          <span className="ml-1">{formatDate(coupon.endTime)}</span>
                        </div>
                      </div>
                      
                      {/* 新增：玩法配置信息显示 */}
                      {(coupon.userLimit || coupon.dailyLimit || coupon.memberOnly || coupon.shareReward || coupon.taskRequired) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            {coupon.userLimit && (
                              <div>
                                <span className="font-medium">每人限领:</span>
                                <span className="ml-1">{coupon.userLimit}张</span>
                              </div>
                            )}
                            {coupon.dailyLimit && (
                              <div>
                                <span className="font-medium">每日限领:</span>
                                <span className="ml-1">{coupon.dailyLimit}张</span>
                              </div>
                            )}
                            {coupon.memberOnly && (
                              <div>
                                <span className="font-medium text-yellow-600">👑 会员专享</span>
                              </div>
                            )}
                            {coupon.shareReward && (
                              <div>
                                <span className="font-medium text-blue-600">📤 分享获得</span>
                              </div>
                            )}
                          </div>
                          {coupon.taskRequired && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">任务要求:</span>
                              <span className="ml-1">{coupon.taskRequired}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* 新增：规则引擎限制信息显示 */}
                      {(coupon.productRestriction !== 'none' || coupon.userRestriction !== 'none' || 
                        coupon.timeRestriction !== 'none' || coupon.orderRestriction !== 'none' ||
                        coupon.stackable || coupon.excludeDiscounted || coupon.requireLogin) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500 mb-2">🔧 使用限制规则</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                            {coupon.productRestriction !== 'none' && (
                              <div className="flex items-center space-x-1">
                                <span className="text-blue-600">🛍️</span>
                                <span>
                                  {coupon.productRestriction === 'category' && '指定分类'}
                                  {coupon.productRestriction === 'product' && '指定商品'}
                                  {coupon.productRestriction === 'brand' && '指定品牌'}
                                  {coupon.productRestriction === 'exclude' && '排除商品'}
                                </span>
                              </div>
                            )}
                            {coupon.userRestriction !== 'none' && (
                              <div className="flex items-center space-x-1">
                                <span className="text-green-600">👥</span>
                                <span>
                                  {coupon.userRestriction === 'new' && '仅新用户'}
                                  {coupon.userRestriction === 'vip' && '仅VIP用户'}
                                  {coupon.userRestriction === 'level' && `≥${coupon.minUserLevel}级`}
                                  {coupon.userRestriction === 'region' && '指定地区'}
                                </span>
                              </div>
                            )}
                            {coupon.timeRestriction !== 'none' && (
                              <div className="flex items-center space-x-1">
                                <span className="text-purple-600">⏰</span>
                                <span>
                                  {coupon.timeRestriction === 'weekday' && '仅工作日'}
                                  {coupon.timeRestriction === 'weekend' && '仅周末'}
                                  {coupon.timeRestriction === 'hour' && `${coupon.startHour}-${coupon.endHour}`}
                                  {coupon.timeRestriction === 'holiday' && '仅节假日'}
                                </span>
                              </div>
                            )}
                            {coupon.orderRestriction !== 'none' && (
                              <div className="flex items-center space-x-1">
                                <span className="text-orange-600">📦</span>
                                <span>
                                  {coupon.orderRestriction === 'first' && '仅首单'}
                                  {coupon.orderRestriction === 'quantity' && `≥${coupon.minQuantity}件`}
                                  {coupon.orderRestriction === 'weight' && '满重量'}
                                  {coupon.orderRestriction === 'shipping' && '满包邮'}
                                </span>
                              </div>
                            )}
                            {coupon.stackable && (
                              <div className="flex items-center space-x-1">
                                <span className="text-indigo-600">🔗</span>
                                <span>可叠加</span>
                              </div>
                            )}
                            {coupon.excludeDiscounted && (
                              <div className="flex items-center space-x-1">
                                <span className="text-red-600">🚫</span>
                                <span>排除打折</span>
                              </div>
                            )}
                            {coupon.requireLogin && (
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-600">🔐</span>
                                <span>需登录</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {coupon.description && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">描述:</span>
                          <span className="ml-1">{coupon.description}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleStatus(coupon)}
                        className={`p-2 rounded-lg ${
                          coupon.status === 'active'
                            ? 'text-green-600 bg-green-50 hover:bg-green-100'
                            : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
                        }`}
                        title={coupon.status === 'active' ? '停用' : '启用'}
                      >
                        {coupon.status === 'active' ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                        title="编辑"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon._id)}
                        className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 新建/编辑优惠券模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingCoupon ? '编辑优惠券' : '新建优惠券'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优惠券名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input input-bordered w-full"
                  placeholder="请输入优惠券名称"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优惠类型 *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="select select-bordered w-full"
                  required
                >
                  <option value="fixed">固定金额</option>
                  <option value="percentage">百分比折扣</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.type === 'fixed' ? '优惠金额 (元) *' : '折扣比例 (%) *'}
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  className="input input-bordered w-full"
                  placeholder={formData.type === 'fixed' ? '请输入优惠金额' : '请输入折扣比例'}
                  min="0"
                  step={formData.type === 'fixed' ? '0.01' : '1'}
                  max={formData.type === 'percentage' ? '100' : undefined}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最低消费金额 (元) *
                </label>
                <input
                  type="number"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({...formData, minAmount: e.target.value})}
                  className="input input-bordered w-full"
                  placeholder="请输入最低消费金额"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  发放数量 *
                </label>
                <input
                  type="number"
                  value={formData.totalCount}
                  onChange={(e) => setFormData({...formData, totalCount: e.target.value})}
                  className="input input-bordered w-full"
                  placeholder="请输入发放数量"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始时间
                </label>
                <input
                  type="date"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  className="input input-bordered w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束时间
                </label>
                <input
                  type="date"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  className="input input-bordered w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优惠券描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="textarea textarea-bordered w-full"
                  placeholder="请输入优惠券描述"
                  rows="3"
                />
              </div>
              
              {/* 新增：优惠券玩法配置 */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">🎮 优惠券玩法配置</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    玩法类型 *
                  </label>
                  <select
                    value={formData.gameplayType}
                    onChange={(e) => setFormData({...formData, gameplayType: e.target.value})}
                    className="select select-bordered w-full"
                    required
                  >
                    <option value="normal">🎫 普通优惠券</option>
                    <option value="flash">⚡ 限时抢购券</option>
                    <option value="group">👥 拼团专享券</option>
                    <option value="newbie">🎁 新人专享券</option>
                    <option value="birthday">🎂 生日专享券</option>
                    <option value="vip">👑 会员专享券</option>
                    <option value="share">📤 分享获得券</option>
                    <option value="task">✅ 任务完成券</option>
                    <option value="lucky">🍀 幸运抽奖券</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      每人限领数量
                    </label>
                    <input
                      type="number"
                      value={formData.userLimit}
                      onChange={(e) => setFormData({...formData, userLimit: e.target.value})}
                      className="input input-bordered w-full"
                      min="1"
                      placeholder="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      每日限领数量
                    </label>
                    <input
                      type="number"
                      value={formData.dailyLimit}
                      onChange={(e) => setFormData({...formData, dailyLimit: e.target.value})}
                      className="input input-bordered w-full"
                      min="0"
                      placeholder="0 (不限制)"
                    />
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.memberOnly}
                      onChange={(e) => setFormData({...formData, memberOnly: e.target.checked})}
                      className="checkbox checkbox-primary"
                    />
                    <span className="text-sm text-gray-700">👑 仅限会员领取</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.shareReward}
                      onChange={(e) => setFormData({...formData, shareReward: e.target.checked})}
                      className="checkbox checkbox-primary"
                    />
                    <span className="text-sm text-gray-700">📤 分享后获得</span>
                  </label>
                </div>
                
                {formData.gameplayType === 'task' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      完成任务要求
                    </label>
                    <input
                      type="text"
                      value={formData.taskRequired}
                      onChange={(e) => setFormData({...formData, taskRequired: e.target.value})}
                      className="input input-bordered w-full"
                      placeholder="例如：完成首次购买、连续签到7天等"
                    />
                  </div>
                )}
                
                {formData.gameplayType === 'flash' && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚡ 限时抢购券将在指定时间段内开放领取，数量有限，先到先得！
                    </p>
                  </div>
                )}
                
                {formData.gameplayType === 'group' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      👥 拼团专享券只能在拼团活动中使用，提升拼团转化率！
                    </p>
                  </div>
                )}
              </div>
              
              {/* 新增：优惠券规则引擎 */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">⚙️ 高级使用规则</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      商品限制
                    </label>
                    <select
                      value={formData.productRestriction || 'none'}
                      onChange={(e) => setFormData({...formData, productRestriction: e.target.value})}
                      className="select select-bordered w-full"
                    >
                      <option value="none">🛍️ 全部商品可用</option>
                      <option value="category">📂 指定分类可用</option>
                      <option value="product">🎯 指定商品可用</option>
                      <option value="brand">🏷️ 指定品牌可用</option>
                      <option value="exclude">🚫 排除指定商品</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      用户限制
                    </label>
                    <select
                      value={formData.userRestriction || 'none'}
                      onChange={(e) => setFormData({...formData, userRestriction: e.target.value})}
                      className="select select-bordered w-full"
                    >
                      <option value="none">👥 全部用户可用</option>
                      <option value="new">🆕 仅新用户可用</option>
                      <option value="vip">👑 仅VIP用户可用</option>
                      <option value="level">⭐ 指定等级可用</option>
                      <option value="region">🌍 指定地区可用</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      时间限制
                    </label>
                    <select
                      value={formData.timeRestriction || 'none'}
                      onChange={(e) => setFormData({...formData, timeRestriction: e.target.value})}
                      className="select select-bordered w-full"
                    >
                      <option value="none">⏰ 全天可用</option>
                      <option value="weekday">📅 仅工作日可用</option>
                      <option value="weekend">🎉 仅周末可用</option>
                      <option value="hour">🕐 指定时段可用</option>
                      <option value="holiday">🎊 仅节假日可用</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      订单限制
                    </label>
                    <select
                      value={formData.orderRestriction || 'none'}
                      onChange={(e) => setFormData({...formData, orderRestriction: e.target.value})}
                      className="select select-bordered w-full"
                    >
                      <option value="none">📦 无订单限制</option>
                      <option value="first">🥇 仅首单可用</option>
                      <option value="quantity">🔢 满件数可用</option>
                      <option value="weight">⚖️ 满重量可用</option>
                      <option value="shipping">🚚 满包邮可用</option>
                    </select>
                  </div>
                </div>
                
                {/* 动态规则配置 */}
                {formData.productRestriction === 'category' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      指定商品分类
                    </label>
                    <input
                      type="text"
                      value={formData.allowedCategories || ''}
                      onChange={(e) => setFormData({...formData, allowedCategories: e.target.value})}
                      className="input input-bordered w-full"
                      placeholder="请输入分类ID，多个用逗号分隔"
                    />
                  </div>
                )}
                
                {formData.productRestriction === 'product' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      指定商品
                    </label>
                    <input
                      type="text"
                      value={formData.allowedProducts || ''}
                      onChange={(e) => setFormData({...formData, allowedProducts: e.target.value})}
                      className="input input-bordered w-full"
                      placeholder="请输入商品ID，多个用逗号分隔"
                    />
                  </div>
                )}
                
                {formData.userRestriction === 'level' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      最低用户等级
                    </label>
                    <input
                      type="number"
                      value={formData.minUserLevel || ''}
                      onChange={(e) => setFormData({...formData, minUserLevel: e.target.value})}
                      className="input input-bordered w-full"
                      min="1"
                      placeholder="1"
                    />
                  </div>
                )}
                
                {formData.timeRestriction === 'hour' && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        开始时间
                      </label>
                      <input
                        type="time"
                        value={formData.startHour || ''}
                        onChange={(e) => setFormData({...formData, startHour: e.target.value})}
                        className="input input-bordered w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        结束时间
                      </label>
                      <input
                        type="time"
                        value={formData.endHour || ''}
                        onChange={(e) => setFormData({...formData, endHour: e.target.value})}
                        className="input input-bordered w-full"
                      />
                    </div>
                  </div>
                )}
                
                {formData.orderRestriction === 'quantity' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      最少商品件数
                    </label>
                    <input
                      type="number"
                      value={formData.minQuantity || ''}
                      onChange={(e) => setFormData({...formData, minQuantity: e.target.value})}
                      className="input input-bordered w-full"
                      min="1"
                      placeholder="1"
                    />
                  </div>
                )}
                
                <div className="mt-4 space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.stackable || false}
                      onChange={(e) => setFormData({...formData, stackable: e.target.checked})}
                      className="checkbox checkbox-primary"
                    />
                    <span className="text-sm text-gray-700">🔗 可与其他优惠叠加使用</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.excludeDiscounted || false}
                      onChange={(e) => setFormData({...formData, excludeDiscounted: e.target.checked})}
                      className="checkbox checkbox-primary"
                    />
                    <span className="text-sm text-gray-700">🚫 排除已打折商品</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.requireLogin || false}
                      onChange={(e) => setFormData({...formData, requireLogin: e.target.checked})}
                      className="checkbox checkbox-primary"
                    />
                    <span className="text-sm text-gray-700">🔐 需要登录才能使用</span>
                  </label>
                </div>
              </div>
              
              {/* 新增：优惠券分发机制配置 */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">🎯 自动分发配置</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.autoIssue || false}
                        onChange={(e) => setFormData({...formData, autoIssue: e.target.checked})}
                        className="checkbox checkbox-primary"
                      />
                      <span className="text-sm font-medium text-gray-700">🤖 启用自动发放</span>
                    </label>
                  </div>
                  
                  {formData.autoIssue && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <div className="text-sm font-medium text-gray-700 mb-3">触发条件（可多选）</div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.issueRules?.newUser || false}
                              onChange={(e) => setFormData({
                                ...formData,
                                issueRules: {
                                  ...formData.issueRules,
                                  newUser: e.target.checked
                                }
                              })}
                              className="checkbox checkbox-sm"
                            />
                            <span className="text-sm text-gray-700">🆕 新用户注册</span>
                          </label>
                          
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.issueRules?.firstOrder || false}
                              onChange={(e) => setFormData({
                                ...formData,
                                issueRules: {
                                  ...formData.issueRules,
                                  firstOrder: e.target.checked
                                }
                              })}
                              className="checkbox checkbox-sm"
                            />
                            <span className="text-sm text-gray-700">🥇 首次下单</span>
                          </label>
                          
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.issueRules?.dailySignIn || false}
                              onChange={(e) => setFormData({
                                ...formData,
                                issueRules: {
                                  ...formData.issueRules,
                                  dailySignIn: e.target.checked
                                }
                              })}
                              className="checkbox checkbox-sm"
                            />
                            <span className="text-sm text-gray-700">📅 每日签到</span>
                          </label>
                          
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.issueRules?.shareReward || false}
                              onChange={(e) => setFormData({
                                ...formData,
                                issueRules: {
                                  ...formData.issueRules,
                                  shareReward: e.target.checked
                                }
                              })}
                              className="checkbox checkbox-sm"
                            />
                            <span className="text-sm text-gray-700">📤 分享获得</span>
                          </label>
                          
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.issueRules?.taskComplete || false}
                              onChange={(e) => setFormData({
                                ...formData,
                                issueRules: {
                                  ...formData.issueRules,
                                  taskComplete: e.target.checked
                                }
                              })}
                              className="checkbox checkbox-sm"
                            />
                            <span className="text-sm text-gray-700">✅ 任务完成</span>
                          </label>
                        </div>
                        
                        <div className="space-y-3">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.issueRules?.orderAmount || false}
                              onChange={(e) => setFormData({
                                ...formData,
                                issueRules: {
                                  ...formData.issueRules,
                                  orderAmount: e.target.checked
                                }
                              })}
                              className="checkbox checkbox-sm"
                            />
                            <span className="text-sm text-gray-700">💰 订单金额达标</span>
                          </label>
                          
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.issueRules?.userLevel || false}
                              onChange={(e) => setFormData({
                                ...formData,
                                issueRules: {
                                  ...formData.issueRules,
                                  userLevel: e.target.checked
                                }
                              })}
                              className="checkbox checkbox-sm"
                            />
                            <span className="text-sm text-gray-700">⭐ 用户等级提升</span>
                          </label>
                          
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.issueRules?.referral || false}
                              onChange={(e) => setFormData({
                                ...formData,
                                issueRules: {
                                  ...formData.issueRules,
                                  referral: e.target.checked
                                }
                              })}
                              className="checkbox checkbox-sm"
                            />
                            <span className="text-sm text-gray-700">👥 推荐新用户</span>
                          </label>
                          
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.issueRules?.birthday || false}
                              onChange={(e) => setFormData({
                                ...formData,
                                issueRules: {
                                  ...formData.issueRules,
                                  birthday: e.target.checked
                                }
                              })}
                              className="checkbox checkbox-sm"
                            />
                            <span className="text-sm text-gray-700">🎂 生日当天</span>
                          </label>
                          
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.issueRules?.anniversary || false}
                              onChange={(e) => setFormData({
                                ...formData,
                                issueRules: {
                                  ...formData.issueRules,
                                  anniversary: e.target.checked
                                }
                              })}
                              className="checkbox checkbox-sm"
                            />
                            <span className="text-sm text-gray-700">🎉 注册周年</span>
                          </label>
                        </div>
                      </div>
                      
                      {/* 详细规则配置 */}
                      <div className="border-t pt-4 mt-4">
                        <div className="text-sm font-medium text-gray-700 mb-3">详细规则配置</div>
                        
                        {formData.issueRules?.orderAmount && (
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              最低订单金额（元）
                            </label>
                            <input
                              type="number"
                              value={formData.ruleDetails?.minOrderAmount || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                ruleDetails: {
                                  ...formData.ruleDetails,
                                  minOrderAmount: parseFloat(e.target.value) || 0
                                }
                              })}
                              className="input input-bordered w-full"
                              min="0"
                              step="0.01"
                              placeholder="100"
                            />
                          </div>
                        )}
                        
                        {formData.issueRules?.userLevel && (
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              最低用户等级
                            </label>
                            <select
                              value={formData.ruleDetails?.userLevel || 'bronze'}
                              onChange={(e) => setFormData({
                                ...formData,
                                ruleDetails: {
                                  ...formData.ruleDetails,
                                  userLevel: e.target.value
                                }
                              })}
                              className="select select-bordered w-full"
                            >
                              <option value="bronze">🥉 青铜会员</option>
                              <option value="silver">🥈 白银会员</option>
                              <option value="gold">🥇 黄金会员</option>
                              <option value="platinum">💎 铂金会员</option>
                              <option value="diamond">💍 钻石会员</option>
                            </select>
                          </div>
                        )}
                        
                        {formData.issueRules?.referral && (
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              推荐用户数量
                            </label>
                            <input
                              type="number"
                              value={formData.ruleDetails?.referralCount || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                ruleDetails: {
                                  ...formData.ruleDetails,
                                  referralCount: parseInt(e.target.value) || 0
                                }
                              })}
                              className="input input-bordered w-full"
                              min="1"
                              placeholder="1"
                            />
                          </div>
                        )}
                        
                        {formData.issueRules?.dailySignIn && (
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              连续签到天数
                            </label>
                            <input
                              type="number"
                              value={formData.ruleDetails?.signInDays || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                ruleDetails: {
                                  ...formData.ruleDetails,
                                  signInDays: parseInt(e.target.value) || 1
                                }
                              })}
                              className="input input-bordered w-full"
                              min="1"
                              placeholder="7"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  状态 *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="select select-bordered w-full"
                  required
                >
                  <option value="active">生效中</option>
                  <option value="inactive">已停用</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingCoupon ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      

    </div>
  );
};

export default CouponManagePage;