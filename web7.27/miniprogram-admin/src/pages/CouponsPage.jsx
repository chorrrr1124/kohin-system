import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, UserPlusIcon, CogIcon } from '@heroicons/react/24/outline';
import { getAllCoupons, addCoupon, updateCoupon, deleteCoupon, issueCouponToMultipleUsers } from '../api/couponApi';
import { useToast } from '../components/Toast';

const CouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState(null);
  const [selectedCouponId, setSelectedCouponId] = useState(null);
  const [userIds, setUserIds] = useState('');
  const { addToast } = useToast();

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    type: 'fixed',  // 'fixed' 或 'percentage'
    discount: 0,
    minSpend: 0,
    startDate: '',
    expiryDate: '',
    description: '',
    // 新增条件规则字段
    autoIssue: false, // 是否自动发放
    issueRules: {
      newUser: false, // 新用户注册
      firstOrder: false, // 首次下单
      orderAmount: false, // 订单金额达标
      orderCount: false, // 订单数量达标
      userLevel: false, // 用户等级达标
      activityParticipation: false, // 参与活动
      referral: false, // 推荐新用户
      birthday: false, // 生日当天
      anniversary: false, // 注册周年
      customCondition: false // 自定义条件
    },
    ruleDetails: {
      minOrderAmount: 0, // 最低订单金额
      minOrderCount: 0, // 最低订单数量
      userLevel: 'bronze', // 用户等级
      customCondition: '', // 自定义条件描述
      referralCount: 0, // 推荐用户数量
      activityName: '' // 活动名称
    }
  });

  // 加载优惠券数据
  const loadCoupons = async () => {
    setLoading(true);
    try {
      const response = await getAllCoupons();
      if (response.success && Array.isArray(response.data)) {
        setCoupons(response.data);
      } else {
        setCoupons([]);
        addToast('获取优惠券失败', 'error');
      }
    } catch (error) {
      console.error('加载优惠券出错:', error);
      addToast('加载优惠券出错', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // 处理嵌套字段（如 issueRules.newUser）
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value),
      });
    }
  };

  // 打开新增优惠券模态框
  const openAddModal = () => {
    setCurrentCoupon(null);
    setFormData({
      name: '',
      type: 'fixed',
      discount: 0,
      minSpend: 0,
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      description: '',
      // 新增条件规则字段
      autoIssue: false, // 是否自动发放
      issueRules: {
        newUser: false, // 新用户注册
        firstOrder: false, // 首次下单
        orderAmount: false, // 订单金额达标
        orderCount: false, // 订单数量达标
        userLevel: false, // 用户等级达标
        activityParticipation: false, // 参与活动
        referral: false, // 推荐新用户
        birthday: false, // 生日当天
        anniversary: false, // 注册周年
        customCondition: false // 自定义条件
      },
      ruleDetails: {
        minOrderAmount: 0, // 最低订单金额
        minOrderCount: 0, // 最低订单数量
        userLevel: 'bronze', // 用户等级
        customCondition: '', // 自定义条件描述
        referralCount: 0, // 推荐用户数量
        activityName: '' // 活动名称
      }
    });
    setIsModalOpen(true);
  };

  // 打开编辑优惠券模态框
  const openEditModal = (coupon) => {
    setCurrentCoupon(coupon);
    setFormData({
      name: coupon.name,
      type: coupon.type,
      discount: coupon.value || 0,
      minSpend: coupon.minAmount || 0,
      startDate: coupon.startTime ? new Date(coupon.startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expiryDate: coupon.endTime ? new Date(coupon.endTime).toISOString().split('T')[0] : '',
      description: coupon.description || '',
      // 新增条件规则字段
      autoIssue: coupon.autoIssue || false, // 是否自动发放
      issueRules: coupon.issueRules || {
        newUser: false, // 新用户注册
        firstOrder: false, // 首次下单
        orderAmount: false, // 订单金额达标
        orderCount: false, // 订单数量达标
        userLevel: false, // 用户等级达标
        activityParticipation: false, // 参与活动
        referral: false, // 推荐新用户
        birthday: false, // 生日当天
        anniversary: false, // 注册周年
        customCondition: false // 自定义条件
      },
      ruleDetails: coupon.ruleDetails || {
        minOrderAmount: 0, // 最低订单金额
        minOrderCount: 0, // 最低订单数量
        userLevel: 'bronze', // 用户等级
        customCondition: '', // 自定义条件描述
        referralCount: 0, // 推荐用户数量
        activityName: '' // 活动名称
      }
    });
    setIsModalOpen(true);
  };

  // 打开发放优惠券模态框
  const openIssueModal = (couponId) => {
    setSelectedCouponId(couponId);
    setUserIds('');
    setIsIssueModalOpen(true);
  };

  // 打开规则查看模态框
  const openRuleModal = (coupon) => {
    setCurrentCoupon(coupon);
    setIsRuleModalOpen(true);
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 转换表单数据以匹配API期望的格式
      const apiData = {
        name: formData.name,
        type: formData.type,
        discount: parseFloat(formData.discount),
        minSpend: parseFloat(formData.minSpend),
        startDate: formData.startDate,
        expiryDate: formData.expiryDate,
        description: formData.description,
        // 新增条件规则字段
        autoIssue: formData.autoIssue, // 是否自动发放
        issueRules: formData.issueRules, // 发放规则
        ruleDetails: formData.ruleDetails // 规则详情
      };
      
      let response;
      if (currentCoupon) {
        // 更新优惠券
        response = await updateCoupon(currentCoupon._id, apiData);
        if (response.success) {
          addToast('优惠券更新成功', 'success');
        }
      } else {
        // 添加新优惠券
        response = await addCoupon(apiData);
        if (response.success) {
          addToast('优惠券添加成功', 'success');
        }
      }
      
      if (response.success) {
        setIsModalOpen(false);
        loadCoupons();
      } else {
        addToast(response.error || '操作失败', 'error');
      }
    } catch (error) {
      console.error('提交表单出错:', error);
      addToast('提交表单出错', 'error');
    }
  };

  // 删除优惠券
  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个优惠券吗？')) {
      try {
        const response = await deleteCoupon(id);
        if (response.success) {
          addToast('优惠券删除成功', 'success');
          loadCoupons();
        } else {
          addToast(response.error || '删除失败', 'error');
        }
      } catch (error) {
        console.error('删除优惠券出错:', error);
        addToast('删除优惠券出错', 'error');
      }
    }
  };

  // 发放优惠券给用户
  const handleIssueCoupon = async (e) => {
    e.preventDefault();
    
    if (!userIds.trim()) {
      addToast('请输入用户ID', 'error');
      return;
    }
    
    try {
      const userIdList = userIds.split(',').map(id => id.trim()).filter(id => id);
      
      if (userIdList.length === 0) {
        addToast('请输入有效的用户ID', 'error');
        return;
      }
      
      const response = await issueCouponToMultipleUsers(selectedCouponId, userIdList);
      
      if (response.success) {
        addToast(`成功发放优惠券给${userIdList.length}个用户`, 'success');
        setIsIssueModalOpen(false);
      } else {
        addToast(response.error || '发放失败', 'error');
      }
    } catch (error) {
      console.error('发放优惠券出错:', error);
      addToast('发放优惠券出错', 'error');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">优惠券管理</h1>
        <button
          className="btn btn-primary"
          onClick={openAddModal}
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          添加优惠券
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>名称</th>
                <th>类型</th>
                <th>优惠金额/比例</th>
                <th>最低消费</th>
                <th>开始时间</th>
                <th>过期日期</th>
                <th>状态</th>
                <th>自动发放</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length > 0 ? (
                coupons.map((coupon) => (
                  <tr key={coupon._id}>
                    <td>{coupon.name}</td>
                    <td>{coupon.type === 'fixed' ? '固定金额' : '百分比'}</td>
                    <td>
                      {coupon.type === 'fixed'
                        ? `¥${coupon.value?.toFixed(2) || '0.00'}`
                        : `${coupon.value || 0}%`}
                    </td>
                    <td>¥{coupon.minAmount?.toFixed(2) || '0.00'}</td>
                    <td>
                      {coupon.startTime
                        ? new Date(coupon.startTime).toLocaleDateString()
                        : '未设置'}
                    </td>
                    <td>
                      {coupon.endTime
                        ? new Date(coupon.endTime).toLocaleDateString()
                        : '永不过期'}
                    </td>
                    <td>
                      <span
                        className={`badge ${coupon.status === 'active' ? 'badge-success' : 'badge-error'}`}
                      >
                        {coupon.status === 'active' ? '有效' : '无效'}
                      </span>
                    </td>
                    <td>
                      {coupon.autoIssue ? (
                        <span className="badge badge-info">自动</span>
                      ) : (
                        <span className="badge badge-ghost">手动</span>
                      )}
                    </td>
                    <td className="flex gap-2">
                      {coupon.autoIssue && (
                        <button
                          className="btn btn-sm btn-outline btn-secondary"
                          onClick={() => openRuleModal(coupon)}
                          title="查看规则"
                        >
                          <CogIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline btn-info"
                        onClick={() => openIssueModal(coupon._id)}
                        title="发放给用户"
                      >
                        <UserPlusIcon className="w-4 h-4" />
                      </button>
                      <button
                        className="btn btn-sm btn-outline btn-warning"
                        onClick={() => openEditModal(coupon)}
                        title="编辑"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        className="btn btn-sm btn-outline btn-error"
                        onClick={() => handleDelete(coupon._id)}
                        title="删除"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    暂无优惠券数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 添加/编辑优惠券模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-base-100 p-4 md:p-6 rounded-lg w-full max-w-md mx-auto my-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {currentCoupon ? '编辑优惠券' : '添加优惠券'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-control mb-3">
                <label className="label">
                  <span className="label-text">优惠券名称</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control mb-3">
                <label className="label">
                  <span className="label-text">优惠券类型</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="select select-bordered w-full"
                >
                  <option value="fixed">固定金额</option>
                  <option value="percentage">百分比折扣</option>
                </select>
              </div>

              <div className="form-control mb-3">
                <label className="label">
                  <span className="label-text">
                    {formData.type === 'fixed' ? '优惠金额 (¥)' : '折扣百分比 (%)'}
                  </span>
                </label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  className="input input-bordered"
                  min="0"
                  step={formData.type === 'fixed' ? '0.01' : '1'}
                  required
                />
              </div>

              <div className="form-control mb-3">
                <label className="label">
                  <span className="label-text">最低消费金额 (¥)</span>
                </label>
                <input
                  type="number"
                  name="minSpend"
                  value={formData.minSpend}
                  onChange={handleInputChange}
                  className="input input-bordered"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-control mb-3">
                <label className="label">
                  <span className="label-text">开始日期</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control mb-3">
                <label className="label">
                  <span className="label-text">过期日期 (留空为永不过期)</span>
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control mb-3">
                <label className="label">
                  <span className="label-text">描述</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="textarea textarea-bordered"
                  rows="3"
                ></textarea>
              </div>

              {/* 条件规则设置 */}
              <div className="form-control mb-3">
                <label className="label">
                  <span className="label-text">自动发放</span>
                </label>
                                 <label className="label cursor-pointer">
                   <input
                     type="checkbox"
                     name="autoIssue"
                     checked={formData.autoIssue}
                     onChange={handleInputChange}
                     className="checkbox checkbox-primary"
                   />
                   <span className="label-text ml-2">启用自动发放</span>
                 </label>
              </div>

              {formData.autoIssue && (
                <>
                  <div className="form-control mb-3">
                    <label className="label">
                      <span className="label-text">发放规则</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <label className="label cursor-pointer">
                        <input
                          type="checkbox"
                          name="issueRules.newUser"
                          checked={formData.issueRules.newUser}
                          onChange={handleInputChange}
                          className="checkbox checkbox-primary"
                        />
                        <span className="label-text ml-2">新用户注册</span>
                      </label>
                      <label className="label cursor-pointer">
                        <input
                          type="checkbox"
                          name="issueRules.firstOrder"
                          checked={formData.issueRules.firstOrder}
                          onChange={handleInputChange}
                          className="checkbox checkbox-primary"
                        />
                        <span className="label-text ml-2">首次下单</span>
                      </label>
                      <label className="label cursor-pointer">
                        <input
                          type="checkbox"
                          name="issueRules.orderAmount"
                          checked={formData.issueRules.orderAmount}
                          onChange={handleInputChange}
                          className="checkbox checkbox-primary"
                        />
                        <span className="label-text ml-2">订单金额达标</span>
                      </label>
                      <label className="label cursor-pointer">
                        <input
                          type="checkbox"
                          name="issueRules.orderCount"
                          checked={formData.issueRules.orderCount}
                          onChange={handleInputChange}
                          className="checkbox checkbox-primary"
                        />
                        <span className="label-text ml-2">订单数量达标</span>
                      </label>
                      <label className="label cursor-pointer">
                        <input
                          type="checkbox"
                          name="issueRules.userLevel"
                          checked={formData.issueRules.userLevel}
                          onChange={handleInputChange}
                          className="checkbox checkbox-primary"
                        />
                        <span className="label-text ml-2">用户等级达标</span>
                      </label>
                      <label className="label cursor-pointer">
                        <input
                          type="checkbox"
                          name="issueRules.activityParticipation"
                          checked={formData.issueRules.activityParticipation}
                          onChange={handleInputChange}
                          className="checkbox checkbox-primary"
                        />
                        <span className="label-text ml-2">参与活动</span>
                      </label>
                      <label className="label cursor-pointer">
                        <input
                          type="checkbox"
                          name="issueRules.referral"
                          checked={formData.issueRules.referral}
                          onChange={handleInputChange}
                          className="checkbox checkbox-primary"
                        />
                        <span className="label-text ml-2">推荐新用户</span>
                      </label>
                      <label className="label cursor-pointer">
                        <input
                          type="checkbox"
                          name="issueRules.birthday"
                          checked={formData.issueRules.birthday}
                          onChange={handleInputChange}
                          className="checkbox checkbox-primary"
                        />
                        <span className="label-text ml-2">生日当天</span>
                      </label>
                      <label className="label cursor-pointer">
                        <input
                          type="checkbox"
                          name="issueRules.anniversary"
                          checked={formData.issueRules.anniversary}
                          onChange={handleInputChange}
                          className="checkbox checkbox-primary"
                        />
                        <span className="label-text ml-2">注册周年</span>
                      </label>
                      <label className="label cursor-pointer">
                        <input
                          type="checkbox"
                          name="issueRules.customCondition"
                          checked={formData.issueRules.customCondition}
                          onChange={handleInputChange}
                          className="checkbox checkbox-primary"
                        />
                        <span className="label-text ml-2">自定义条件</span>
                      </label>
                    </div>
                  </div>

                  {formData.issueRules.customCondition && (
                    <div className="form-control mb-3">
                      <label className="label">
                        <span className="label-text">自定义条件描述</span>
                      </label>
                      <textarea
                        name="ruleDetails.customCondition"
                        value={formData.ruleDetails.customCondition}
                        onChange={handleInputChange}
                        className="textarea textarea-bordered"
                        rows="3"
                      ></textarea>
                    </div>
                  )}

                  {formData.issueRules.orderAmount && (
                    <div className="form-control mb-3">
                      <label className="label">
                        <span className="label-text">最低订单金额 (¥)</span>
                      </label>
                      <input
                        type="number"
                        name="ruleDetails.minOrderAmount"
                        value={formData.ruleDetails.minOrderAmount}
                        onChange={handleInputChange}
                        className="input input-bordered"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}

                  {formData.issueRules.orderCount && (
                    <div className="form-control mb-3">
                      <label className="label">
                        <span className="label-text">最低订单数量</span>
                      </label>
                      <input
                        type="number"
                        name="ruleDetails.minOrderCount"
                        value={formData.ruleDetails.minOrderCount}
                        onChange={handleInputChange}
                        className="input input-bordered"
                        min="0"
                      />
                    </div>
                  )}

                  {formData.issueRules.userLevel && (
                    <div className="form-control mb-3">
                      <label className="label">
                        <span className="label-text">用户等级</span>
                      </label>
                      <select
                        name="ruleDetails.userLevel"
                        value={formData.ruleDetails.userLevel}
                        onChange={handleInputChange}
                        className="select select-bordered w-full"
                      >
                        <option value="bronze">铜牌</option>
                        <option value="silver">银牌</option>
                        <option value="gold">金牌</option>
                        <option value="platinum">铂金</option>
                        <option value="diamond">钻石</option>
                      </select>
                    </div>
                  )}

                  {formData.issueRules.referral && (
                    <div className="form-control mb-3">
                      <label className="label">
                        <span className="label-text">推荐用户数量</span>
                      </label>
                      <input
                        type="number"
                        name="ruleDetails.referralCount"
                        value={formData.ruleDetails.referralCount}
                        onChange={handleInputChange}
                        className="input input-bordered"
                        min="0"
                      />
                    </div>
                  )}

                  {formData.issueRules.activityParticipation && (
                    <div className="form-control mb-3">
                      <label className="label">
                        <span className="label-text">活动名称</span>
                      </label>
                      <input
                        type="text"
                        name="ruleDetails.activityName"
                        value={formData.ruleDetails.activityName}
                        onChange={handleInputChange}
                        className="input input-bordered"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 发放优惠券模态框 */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-base-100 p-4 md:p-6 rounded-lg w-full max-w-md mx-auto my-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">发放优惠券</h2>
            <form onSubmit={handleIssueCoupon}>
              <div className="form-control mb-3">
                <label className="label">
                  <span className="label-text">用户ID列表 (多个ID用逗号分隔)</span>
                </label>
                <textarea
                  value={userIds}
                  onChange={(e) => setUserIds(e.target.value)}
                  className="textarea textarea-bordered"
                  rows="4"
                  placeholder="例如: user1,user2,user3"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsIssueModalOpen(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  发放
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 规则查看模态框 */}
      {isRuleModalOpen && currentCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-base-100 p-4 md:p-6 rounded-lg w-full max-w-2xl mx-auto my-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">优惠券发放规则</h2>
            <div className="space-y-4">
              <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">优惠券信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">名称：</span>
                    <span className="font-medium">{currentCoupon.name}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">类型：</span>
                    <span className="font-medium">
                      {currentCoupon.type === 'fixed' ? '固定金额' : '百分比折扣'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">优惠：</span>
                    <span className="font-medium">
                      {currentCoupon.type === 'fixed'
                        ? `¥${currentCoupon.value?.toFixed(2) || '0.00'}`
                        : `${currentCoupon.value || 0}%`}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">最低消费：</span>
                    <span className="font-medium">¥{currentCoupon.minAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">自动发放条件</h3>
                {currentCoupon.issueRules ? (
                  <div className="space-y-2">
                    {Object.entries(currentCoupon.issueRules).map(([key, value]) => {
                      if (!value) return null;
                      
                      const ruleLabels = {
                        newUser: '新用户注册',
                        firstOrder: '首次下单',
                        orderAmount: '订单金额达标',
                        orderCount: '订单数量达标',
                        userLevel: '用户等级达标',
                        activityParticipation: '参与活动',
                        referral: '推荐新用户',
                        birthday: '生日当天',
                        anniversary: '注册周年',
                        customCondition: '自定义条件'
                      };

                      const ruleDetails = currentCoupon.ruleDetails || {};
                      
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="font-medium">{ruleLabels[key]}</span>
                          {key === 'orderAmount' && ruleDetails.minOrderAmount && (
                            <span className="text-sm text-gray-600">
                              (≥¥{ruleDetails.minOrderAmount})
                            </span>
                          )}
                          {key === 'orderCount' && ruleDetails.minOrderCount && (
                            <span className="text-sm text-gray-600">
                              (≥{ruleDetails.minOrderCount}单)
                            </span>
                          )}
                          {key === 'userLevel' && ruleDetails.userLevel && (
                            <span className="text-sm text-gray-600">
                              ({ruleDetails.userLevel === 'bronze' ? '铜牌' : 
                                ruleDetails.userLevel === 'silver' ? '银牌' : 
                                ruleDetails.userLevel === 'gold' ? '金牌' : 
                                ruleDetails.userLevel === 'platinum' ? '铂金' : '钻石'})
                            </span>
                          )}
                          {key === 'referral' && ruleDetails.referralCount && (
                            <span className="text-sm text-gray-600">
                              (≥{ruleDetails.referralCount}人)
                            </span>
                          )}
                          {key === 'activityParticipation' && ruleDetails.activityName && (
                            <span className="text-sm text-gray-600">
                              ({ruleDetails.activityName})
                            </span>
                          )}
                          {key === 'customCondition' && ruleDetails.customCondition && (
                            <span className="text-sm text-gray-600">
                              ({ruleDetails.customCondition})
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">暂无自动发放规则</p>
                )}
              </div>

              <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">有效期</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">开始时间：</span>
                    <span className="font-medium">
                      {currentCoupon.startTime
                        ? new Date(currentCoupon.startTime).toLocaleDateString()
                        : '未设置'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">过期时间：</span>
                    <span className="font-medium">
                      {currentCoupon.endTime
                        ? new Date(currentCoupon.endTime).toLocaleDateString()
                        : '永不过期'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsRuleModalOpen(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponsPage;