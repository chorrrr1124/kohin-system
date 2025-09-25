import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UsersIcon, MagnifyingGlassIcon, EyeIcon, PhoneIcon, ChartBarIcon, GiftIcon, CurrencyDollarIcon, CalendarDaysIcon, DocumentArrowDownIcon, StarIcon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { app, ensureLogin } from '../utils/cloudbase';
import { ContentLoading, TableLoading, CardLoading } from '../components/LoadingSpinner';

const MiniProgramUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [vipFilter, setVipFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [exporting, setExporting] = useState(false);

  // 用户详情相关
  const [userOrders, setUserOrders] = useState([]);
  const [userOrdersLoading, setUserOrdersLoading] = useState(false);

  // 筛选选项
  const vipFilterOptions = [
    { value: '', label: '全部VIP等级' },
    { value: '1', label: 'VIP 1' },
    { value: '2', label: 'VIP 2' },
    { value: '3', label: 'VIP 3' },
    { value: '4', label: 'VIP 4' },
    { value: '5', label: 'VIP 5' }
  ];

  // 每页显示数量
  const pageSize = 10;

  // 防抖函数
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // 初始加载用户数据
  useEffect(() => {
    loadUsers();
  }, []);

  // 使用防抖的搜索函数
  const debouncedSearch = useCallback(
    debounce(() => {
      setCurrentPage(1);
      applyFilters();
    }, 300),
    [searchTerm, vipFilter]
  );

  // 当搜索条件改变时，应用防抖搜索
  useEffect(() => {
    if (allUsers.length > 0) {
      debouncedSearch();
    }
  }, [searchTerm, vipFilter, debouncedSearch, allUsers.length]);

  // 当页码改变时，重新应用筛选
  useEffect(() => {
    if (allUsers.length > 0) {
      applyFilters();
    }
  }, [currentPage]);

  // 加载用户数据
  const loadUsers = async () => {
    try {
      setLoading(true);
      await ensureLogin();
      
      // 调用云函数获取用户数据
      const result = await app.callFunction({
        name: 'syncUserData',
        data: {
          action: 'getAllUsers'
        }
      });

      if (result.result && result.result.success) {
        const allUsersData = result.result.users || [];
        setAllUsers(allUsersData);
        
        // 初始加载完成后应用筛选
        applyFilters(allUsersData);
        
      } else {
        console.error('获取用户数据失败:', result.result);
        setAllUsers([]);
        setUsers([]);
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
      setAllUsers([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // 应用筛选和分页
  const applyFilters = (usersData = allUsers) => {
    let filteredUsers = [...usersData];
    
    // 应用搜索筛选
    if (searchTerm) {
      filteredUsers = filteredUsers.filter(user => 
        user.nickName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      );
    }
    
    // 应用VIP等级筛选
    if (vipFilter) {
      filteredUsers = filteredUsers.filter(user => 
        user.vipLevel === parseInt(vipFilter)
      );
    }
    
    // 分页
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    setUsers(paginatedUsers);
    setTotalPages(Math.ceil(filteredUsers.length / pageSize));
  };

  // 查看用户详情
  const viewUserDetails = async (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
    
    // 加载用户订单数据
    await loadUserOrders(user.openid);
  };

  // 加载用户订单数据
  const loadUserOrders = async (openid) => {
    try {
      setUserOrdersLoading(true);
      
      const result = await app.callFunction({
        name: 'getUserOrders',
        data: { openid }
      });

      if (result.result && result.result.success) {
        setUserOrders(result.result.orders || []);
      } else {
        setUserOrders([]);
      }
    } catch (error) {
      console.error('加载用户订单失败:', error);
      setUserOrders([]);
    } finally {
      setUserOrdersLoading(false);
    }
  };

  // 导出用户数据
  const exportUsers = async () => {
    try {
      setExporting(true);
      
      const csvData = allUsers.map(user => ({
        '用户ID': user._id,
        '昵称': user.nickName || '未设置',
        '手机号': user.phone || '未绑定',
        '性别': user.gender === 1 ? '男' : user.gender === 2 ? '女' : '未知',
        '城市': user.city || '未知',
        '省份': user.province || '未知',
        '积分': user.points || 0,
        '余额': user.balance || 0,
        'VIP等级': user.vipLevel || 1,
        '累计消费': user.totalSpent || 0,
        '订单数量': user.orderCount || 0,
        '最后登录': user.lastLoginTime ? new Date(user.lastLoginTime).toLocaleString() : '未知',
        '注册时间': user.createTime ? new Date(user.createTime).toLocaleString() : '未知',
        '状态': user.status || 'active'
      }));

      // 转换为CSV格式
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');

      // 下载文件
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `小程序用户数据_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('导出用户数据失败:', error);
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  // 计算统计数据 - 使用 useMemo 优化性能
  const stats = useMemo(() => ({
    totalUsers: allUsers.length,
    activeUsers: allUsers.filter(user => user.status === 'active').length,
    vipUsers: allUsers.filter(user => user.vipLevel > 1).length,
    totalPoints: allUsers.reduce((sum, user) => sum + (user.points || 0), 0),
    totalBalance: allUsers.reduce((sum, user) => sum + (user.balance || 0), 0),
    totalSpent: allUsers.reduce((sum, user) => sum + (user.totalSpent || 0), 0)
  }), [allUsers]);

  if (loading) {
    return <ContentLoading />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <UserCircleIcon className="w-8 h-8 mr-3" />
          小程序用户管理
        </h1>
        <div className="flex gap-2">
          <button 
            className="btn btn-ghost"
            onClick={() => setShowStats(!showStats)}
          >
            <ChartBarIcon className="w-5 h-5 mr-2" />
            {showStats ? '隐藏统计' : '显示统计'}
          </button>
          <button 
            className="btn btn-ghost"
            onClick={exportUsers}
            disabled={exporting}
          >
            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
            {exporting ? '导出中...' : '导出数据'}
          </button>
        </div>
      </div>
      
      {/* 用户统计卡片 */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="stat bg-base-100 shadow rounded-lg">
            <div className="stat-figure text-primary">
              <UsersIcon className="w-8 h-8" />
            </div>
            <div className="stat-title">总用户数</div>
            <div className="stat-value text-primary">{stats.totalUsers}</div>
            <div className="stat-desc">注册用户总数</div>
          </div>
          
          <div className="stat bg-base-100 shadow rounded-lg">
            <div className="stat-figure text-success">
              <UserCircleIcon className="w-8 h-8" />
            </div>
            <div className="stat-title">活跃用户</div>
            <div className="stat-value text-success">{stats.activeUsers}</div>
            <div className="stat-desc">状态为活跃的用户</div>
          </div>
          
          <div className="stat bg-base-100 shadow rounded-lg">
            <div className="stat-figure text-warning">
              <StarIcon className="w-8 h-8" />
            </div>
            <div className="stat-title">VIP用户</div>
            <div className="stat-value text-warning">{stats.vipUsers}</div>
            <div className="stat-desc">VIP等级大于1的用户</div>
          </div>
          
          <div className="stat bg-base-100 shadow rounded-lg">
            <div className="stat-figure text-info">
              <CurrencyDollarIcon className="w-8 h-8" />
            </div>
            <div className="stat-title">累计消费</div>
            <div className="stat-value text-info">¥{stats.totalSpent.toFixed(2)}</div>
            <div className="stat-desc">所有用户累计消费金额</div>
          </div>
        </div>
      )}
      
      {/* 搜索栏 */}
      <div className="bg-base-100 shadow rounded-lg p-4 mb-6">
        <form onSubmit={(e) => e.preventDefault()} className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <div className="">
              <input
                type="text"
                placeholder="搜索用户昵称或手机号..."
                className="input input-bordered w-full pr-12"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              />
              <button type="button" className="absolute right-1 top-1/2 -translate-y-1/2 btn btn-ghost btn-square"
                onClick={() => { setCurrentPage(1); }}
                aria-label="搜索">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="form-control">
            <select
              className="select select-bordered"
              value={vipFilter}
              onChange={(e) => {
                setVipFilter(e.target.value);
              }}
            >
              {vipFilterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>
      
      {/* 用户列表 */}
      <div className="bg-base-100 shadow rounded-lg overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <UserCircleIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">暂无用户数据</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>头像</th>
                    <th>昵称</th>
                    <th>手机号</th>
                    <th>性别</th>
                    <th>城市</th>
                    <th>积分</th>
                    <th>余额</th>
                    <th>VIP等级</th>
                    <th>累计消费</th>
                    <th>最后登录</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="avatar">
                          <div className="w-12 h-12 rounded-full">
                            <img 
                              src={user.avatarUrl || '/images/default-avatar.png'} 
                              alt={user.nickName || '用户'}
                              onError={(e) => {
                                e.target.src = '/images/default-avatar.png';
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium">{user.nickName || '未设置'}</div>
                        <div className="text-sm text-gray-500">ID: {user._id.slice(-8)}</div>
                      </td>
                      <td>
                        <div className="flex items-center">
                          <PhoneIcon className="w-4 h-4 mr-1" />
                          {user.phone || '未绑定'}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-ghost">
                          {user.gender === 1 ? '男' : user.gender === 2 ? '女' : '未知'}
                        </span>
                      </td>
                      <td>{user.city || '未知'}</td>
                      <td>
                        <div className="flex items-center">
                          <GiftIcon className="w-4 h-4 mr-1 text-yellow-500" />
                          {user.points || 0}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="w-4 h-4 mr-1 text-green-500" />
                          ¥{(user.balance || 0).toFixed(2)}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${user.vipLevel > 1 ? 'badge-warning' : 'badge-ghost'}`}>
                          VIP {user.vipLevel || 1}
                        </span>
                      </td>
                      <td>¥{(user.totalSpent || 0).toFixed(2)}</td>
                      <td>
                        <div className="flex items-center">
                          <CalendarDaysIcon className="w-4 h-4 mr-1" />
                          {user.lastLoginTime ? new Date(user.lastLoginTime).toLocaleDateString() : '未知'}
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => viewUserDetails(user)}
                        >
                          <EyeIcon className="w-4 h-4" />
                          详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex justify-center p-4">
                <div className="btn-group">
                  <button
                    className="btn btn-sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`btn btn-sm ${currentPage === page ? 'btn-active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="btn btn-sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 用户详情弹窗 */}
      {showUserModal && selectedUser && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">用户详情</h3>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setShowUserModal(false)}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">基本信息</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <img 
                      src={selectedUser.avatarUrl || '/images/default-avatar.png'} 
                      alt={selectedUser.nickName || '用户'}
                      className="w-16 h-16 rounded-full mr-4"
                      onError={(e) => {
                        e.target.src = '/images/default-avatar.png';
                      }}
                    />
                    <div>
                      <div className="font-medium text-lg">{selectedUser.nickName || '未设置'}</div>
                      <div className="text-sm text-gray-500">ID: {selectedUser._id}</div>
                    </div>
                  </div>
                  <div><strong>手机号:</strong> {selectedUser.phone || '未绑定'}</div>
                  <div><strong>性别:</strong> {selectedUser.gender === 1 ? '男' : selectedUser.gender === 2 ? '女' : '未知'}</div>
                  <div><strong>地区:</strong> {selectedUser.province} {selectedUser.city}</div>
                  <div><strong>国家:</strong> {selectedUser.country}</div>
                  <div><strong>状态:</strong> 
                    <span className={`badge ml-2 ${selectedUser.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                      {selectedUser.status === 'active' ? '活跃' : '非活跃'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 账户信息 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">账户信息</h4>
                <div className="space-y-2">
                  <div><strong>积分余额:</strong> {selectedUser.points || 0}</div>
                  <div><strong>账户余额:</strong> ¥{(selectedUser.balance || 0).toFixed(2)}</div>
                  <div><strong>VIP等级:</strong> 
                    <span className={`badge ml-2 ${selectedUser.vipLevel > 1 ? 'badge-warning' : 'badge-ghost'}`}>
                      VIP {selectedUser.vipLevel || 1}
                    </span>
                  </div>
                  <div><strong>累计消费:</strong> ¥{(selectedUser.totalSpent || 0).toFixed(2)}</div>
                  <div><strong>订单数量:</strong> {selectedUser.orderCount || 0}</div>
                  <div><strong>注册时间:</strong> {selectedUser.createTime ? new Date(selectedUser.createTime).toLocaleString() : '未知'}</div>
                  <div><strong>最后登录:</strong> {selectedUser.lastLoginTime ? new Date(selectedUser.lastLoginTime).toLocaleString() : '未知'}</div>
                </div>
              </div>
            </div>
            
            {/* 订单记录 */}
            <div className="mt-6">
              <h4 className="font-semibold text-lg mb-4">订单记录</h4>
              {userOrdersLoading ? (
                <TableLoading />
              ) : userOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table table-compact w-full">
                    <thead>
                      <tr>
                        <th>订单号</th>
                        <th>状态</th>
                        <th>金额</th>
                        <th>创建时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userOrders.map((order) => (
                        <tr key={order._id}>
                          <td>{order.orderNo || order._id.slice(-8)}</td>
                          <td>
                            <span className={`badge ${
                              order.status === 'completed' ? 'badge-success' :
                              order.status === 'pending' ? 'badge-warning' :
                              'badge-error'
                            }`}>
                              {order.status === 'completed' ? '已完成' :
                               order.status === 'pending' ? '待处理' : '已取消'}
                            </span>
                          </td>
                          <td>¥{(order.totalAmount || 0).toFixed(2)}</td>
                          <td>{order.createTime ? new Date(order.createTime).toLocaleString() : '未知'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无订单记录
                </div>
              )}
            </div>
            
            <div className="modal-action">
              <button className="btn" onClick={() => setShowUserModal(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniProgramUsersPage;
