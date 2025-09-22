import React, { useState, useEffect } from 'react';
import { 
  ShoppingBagIcon, 
  MagnifyingGlassIcon, 
  EyeIcon, 
  CheckIcon, 
  XMarkIcon, 
  TruckIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  PrinterIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { app, ensureLogin } from '../utils/cloudbase';
import { ContentLoading, TableLoading, CardLoading } from '../components/LoadingSpinner';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showStats, setShowStats] = useState(false);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    pending_shipment: 0,
    shipped: 0,
    completed: 0,
    cancelled: 0,
    totalAmount: 0,
    todayOrders: 0
  });
  const [exporting, setExporting] = useState(false);

  const pageSize = 10;

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待付款' },
    { value: 'pending_shipment', label: '待发货' },
    { value: 'shipped', label: '已发货' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' }
  ];

  const statusLabels = {
    pending: '待付款',
    pending_shipment: '待发货',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消'
  };

  const statusColors = {
    pending: 'badge-warning',
    pending_shipment: 'badge-info',
    shipped: 'badge-primary',
    completed: 'badge-success',
    cancelled: 'badge-error'
  };

  // 支付方式映射
  const paymentMethodLabels = {
    wechat: '微信支付',
    prestore: '预存扣费',
    prepaid: '预存产品',
    cash: '现金支付',
    alipay: '支付宝'
  };

  const paymentMethodColors = {
    wechat: 'badge-success',
    prestore: 'badge-info',
    prepaid: 'badge-info',
    cash: 'badge-warning',
    alipay: 'badge-primary'
  };

  const paymentFilterOptions = [
    { value: '', label: '全部支付方式' },
    { value: 'wechat', label: '微信支付' },
    { value: 'prestore', label: '预存扣费' },
    { value: 'prepaid', label: '预存产品' },
    { value: 'cash', label: '现金支付' },
    { value: 'alipay', label: '支付宝' }
  ];

  // 获取订单统计
  const fetchOrderStats = async () => {
    try {
      await ensureLogin();
      const db = app.database();
      
      // 获取所有订单统计
      const allOrdersRes = await db.collection('orders').get();
      const allOrders = allOrdersRes.data;
      
      // 今日订单
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createTime || order.date);
        return orderDate >= today;
      });
      
      // 计算统计数据
      const stats = {
        total: allOrders.length,
        pending: allOrders.filter(o => o.status === 'pending').length,
        pending_shipment: allOrders.filter(o => o.status === 'pending_shipment').length,
        shipped: allOrders.filter(o => o.status === 'shipped').length,
        completed: allOrders.filter(o => o.status === 'completed').length,
        cancelled: allOrders.filter(o => o.status === 'cancelled').length,
        totalAmount: allOrders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0),
        todayOrders: todayOrders.length
      };
      
      setOrderStats(stats);
    } catch (error) {
      console.error('获取订单统计失败:', error);
    }
  };

  // 导出订单数据
  const exportOrders = async () => {
    try {
      setExporting(true);
      await ensureLogin();
      const db = app.database();
      
      // 构建查询条件
      let query = db.collection('orders');
      
      if (searchTerm) {
        query = query.where(db.command.or([
          {
            id: db.RegExp({
              regexp: searchTerm,
              options: 'i'
            })
          },
          {
            customerName: db.RegExp({
              regexp: searchTerm,
              options: 'i'
            })
          }
        ]));
      }
      
      if (statusFilter) {
        query = query.where({
          status: statusFilter
        });
      }
      
      if (paymentFilter) {
        query = query.where({
          paymentMethod: paymentFilter
        });
      }
      
      if (dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        
        query = query.where({
          createTime: db.command.gte(startDate).and(db.command.lte(endDate))
        });
      }
      
      const result = await query.get();
      const ordersToExport = result.data;
      
      // 转换为CSV格式
      const csvContent = [
        ['订单号', '客户', '金额', '支付方式', '状态', '创建时间'].join(','),
        ...ordersToExport.map(order => [
          order.id || order._id?.slice(-8) || '',
          order.customerName || order.customer || '未知客户',
          order.totalAmount || order.total || 0,
          paymentMethodLabels[order.paymentMethod] || order.paymentMethod,
          statusLabels[order.status] || order.status,
          formatTime(order.createTime || order.date)
        ].join(','))
      ].join('\n');
      
      // 下载文件
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `订单数据_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  // 获取订单列表
  const fetchOrders = async () => {
    try {
      setLoading(true);
      await ensureLogin();
      const db = app.database();
      const result = await db.collection('orders').orderBy('createTime', 'desc').get();
      setOrders(result.data);
    } catch (error) {
      console.error('获取订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
  }, []);

  // 搜索处理
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  // 更新订单状态
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await ensureLogin();
      const db = app.database();
      await db.collection('orders').doc(orderId).update({
        status: newStatus,
        updateTime: new Date()
      });
      
      // 更新本地状态
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      
      // 重新获取统计
      fetchOrderStats();
    } catch (error) {
      console.error('更新订单状态失败:', error);
      alert('更新失败，请重试');
    }
  };

  // 批量更新状态
  const batchUpdateStatus = async (newStatus) => {
    try {
      await ensureLogin();
      const db = app.database();
      
      const updatePromises = selectedOrders.map(orderId => 
        db.collection('orders').doc(orderId).update({
          status: newStatus,
          updateTime: new Date()
        })
      );
      
      await Promise.all(updatePromises);
      
      // 更新本地状态
      setOrders(orders.map(order => 
        selectedOrders.includes(order._id) ? { ...order, status: newStatus } : order
      ));
      
      setSelectedOrders([]);
      fetchOrderStats();
    } catch (error) {
      console.error('批量更新失败:', error);
      alert('批量更新失败，请重试');
    }
  };

  // 查看订单详情
  const viewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // 切换订单选择
  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // 切换全选
  const toggleSelectAll = () => {
    if (selectedOrders.length === paginatedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(paginatedOrders.map(order => order._id));
    }
  };

  // 获取下一个状态
  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'pending': 'pending_shipment',
      'pending_shipment': 'shipped',
      'shipped': 'completed'
    };
    return statusFlow[currentStatus];
  };

  // 获取状态按钮文本
  const getStatusButtonText = (status) => {
    const buttonTexts = {
      'pending': '确认付款',
      'pending_shipment': '发货',
      'shipped': '完成'
    };
    return buttonTexts[status];
  };

  // 格式化金额
  const formatAmount = (amount) => {
    return (amount || 0).toFixed(2);
  };

  // 格式化时间 - 分离日期和时间
  const formatTime = (time) => {
    if (!time) return { date: '', time: '' };
    const date = new Date(time);
    return {
      date: date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      time: date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
  };

  // 筛选订单
  const filteredOrders = React.useMemo(() => {
    const { keyword, status, payment } = {
      keyword: searchTerm.toLowerCase().trim(),
      status: statusFilter,
      payment: paymentFilter
    };

    let list = orders || [];

    // 状态筛选
    if (status) {
      list = list.filter(item => item.status === status);
    }

    // 支付方式筛选
    if (payment) {
      list = list.filter(item => item.paymentMethod === payment);
    }

    // 日期范围筛选
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      list = list.filter(item => {
        const orderDate = new Date(item.createTime || item.date);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    // 关键词筛选（订单号/客户名/ID后8位）
    if (keyword) {
      list = list.filter((item) => {
        const orderId = (item.id || '').toLowerCase();
        const customerName = (item.customerName || item.customer || '').toLowerCase();
        const shortId = (item._id ? String(item._id).slice(-8) : '').toLowerCase();
        return (
          orderId.includes(keyword) ||
          customerName.includes(keyword) ||
          shortId.includes(keyword)
        );
      });
    }

    return list;
  }, [orders, searchTerm, statusFilter, paymentFilter, dateRange]);

  // 计算总页数
  const computedTotalPages = React.useMemo(() => {
    return Math.max(1, Math.ceil((filteredOrders.length || 0) / pageSize));
  }, [filteredOrders, pageSize]);

  // 分页数据
  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // 更新总页数
  React.useEffect(() => {
    setTotalPages(computedTotalPages);
    // 如果当前页超出范围，重置到第一页
    if (currentPage > computedTotalPages) {
      setCurrentPage(1);
    }
  }, [computedTotalPages, currentPage]);

  if (loading) {
    return <ContentLoading />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <ShoppingBagIcon className="w-8 h-8 mr-3" />
          订单管理
        </h1>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="btn btn-outline"
          >
            <ChartBarIcon className="w-4 h-4 mr-1" />
            {showStats ? '隐藏统计' : '显示统计'}
          </button>
          <button
            onClick={exportOrders}
            className="btn btn-primary"
            disabled={exporting}
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
            {exporting ? '导出中...' : '导出数据'}
          </button>
        </div>
      </div>

      {/* 订单统计卡片 */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="stat bg-base-100 shadow rounded-lg">
            <div className="stat-figure text-primary">
              <ShoppingBagIcon className="w-8 h-8" />
            </div>
            <div className="stat-title">总订单数</div>
            <div className="stat-value text-primary">{orderStats.total}</div>
          </div>
          <div className="stat bg-base-100 shadow rounded-lg">
            <div className="stat-figure text-success">
              <CheckIcon className="w-8 h-8" />
            </div>
            <div className="stat-title">已完成</div>
            <div className="stat-value text-success">{orderStats.completed}</div>
          </div>
          <div className="stat bg-base-100 shadow rounded-lg">
            <div className="stat-figure text-info">
              <ClockIcon className="w-8 h-8" />
            </div>
            <div className="stat-title">今日订单</div>
            <div className="stat-value text-info">{orderStats.todayOrders}</div>
          </div>
          <div className="stat bg-base-100 shadow rounded-lg">
            <div className="stat-figure text-warning">
              <span className="text-2xl">¥</span>
            </div>
            <div className="stat-title">总金额</div>
            <div className="stat-value text-warning">¥{orderStats.totalAmount.toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        {/* 批量操作按钮 */}
        {selectedOrders.length > 0 && (
          <div className="flex gap-2">
            <span className="text-sm text-gray-500">已选择 {selectedOrders.length} 个订单</span>
            <button
              onClick={() => batchUpdateStatus('pending_shipment')}
              className="btn btn-sm btn-info"
            >
              批量确认付款
            </button>
            <button
              onClick={() => batchUpdateStatus('shipped')}
              className="btn btn-sm btn-primary"
            >
              批量发货
            </button>
            <button
              onClick={() => batchUpdateStatus('completed')}
              className="btn btn-sm btn-success"
            >
              批量完成
            </button>
          </div>
        )}
      </div>

      {/* 搜索和筛选栏 */}
      <div className="bg-base-100 shadow rounded-lg p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
          {/* 第一行：搜索框和状态筛选 */}
          <div className="flex gap-4 flex-wrap items-center">
            <div className="form-control flex-1 min-w-[600px]">
              <div className="flex">
                <input
                  type="text"
                  placeholder="搜索订单号或客户姓名..."
                  className="input input-bordered flex-1 rounded-r-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="btn btn-square rounded-l-none border-l-0">
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="form-control">
              <select
                className="select select-bordered"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control">
              <select
                className="select select-bordered"
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {paymentFilterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* 第二行：日期范围选择器和清除按钮 */}
          <div className="flex gap-4 flex-wrap items-end">
            <div className="form-control">
              <label className="label">
                <span className="label-text">日期范围</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="date"
                    className="input input-bordered pr-8"
                    value={dateRange.start}
                    onChange={(e) => {
                      setDateRange({...dateRange, start: e.target.value});
                      setCurrentPage(1);
                    }}
                    placeholder="开始日期"
                  />
                  <CalendarDaysIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <span className="text-gray-500 font-medium">至</span>
                <div className="relative">
                  <input
                    type="date"
                    className="input input-bordered pr-8"
                    value={dateRange.end}
                    onChange={(e) => {
                      setDateRange({...dateRange, end: e.target.value});
                      setCurrentPage(1);
                    }}
                    placeholder="结束日期"
                  />
                  <CalendarDaysIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="form-control">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setDateRange({ start: '', end: '' });
                  setCurrentPage(1);
                }}
              >
                <CalendarDaysIcon className="w-4 h-4 mr-1" />
                清除日期
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 订单列表 */}
      <div className="bg-base-100 shadow rounded-lg overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBagIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">暂无订单数据</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full table-fixed">
                <thead>
                  <tr>
                    <th className="w-8">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="w-28">订单号</th>
                    <th className="w-24">客户</th>
                    <th className="w-16">金额</th>
                    <th className="w-20">支付方式</th>
                    <th className="w-16">状态</th>
                    <th className="w-20">创建时间</th>
                    <th className="w-20">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => {
                    const timeInfo = formatTime(order.createTime || order.date);
                    return (
                      <tr key={order._id}>
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedOrders.includes(order._id)}
                            onChange={() => toggleOrderSelection(order._id)}
                          />
                        </td>
                        <td className="font-mono text-sm w-28">{order.id || order._id?.slice(-8)}</td>
                        <td className="w-24">{order.customerName || order.customer || '未知客户'}</td>
                        <td className="font-bold w-16">¥{formatAmount(order.totalAmount || order.total)}</td>
                        <td className="w-20">
                          <span className={`badge ${paymentMethodColors[order.paymentMethod] || 'badge-neutral'}`}>
                            {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                          </span>
                        </td>
                        <td className="w-16">
                          <span className={`badge ${statusColors[order.status] || 'badge-neutral'}`}>
                            {statusLabels[order.status] || order.status}
                          </span>
                        </td>
                        <td className="w-20">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{timeInfo.date}</span>
                            <span className="text-xs text-gray-500">{timeInfo.time}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button
                              onClick={() => viewOrder(order)}
                              className="btn btn-sm btn-ghost"
                              title="查看详情"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            
                            {/* 状态操作按钮 */}
                            {getNextStatus(order.status) && (
                              <button
                                onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                                className={`btn btn-sm ${
                                  order.status === 'pending' ? 'btn-info' :
                                  order.status === 'pending_shipment' ? 'btn-primary' :
                                  'btn-success'
                                }`}
                                title={getStatusButtonText(order.status)}
                              >
                                {order.status === 'pending_shipment' ? 
                                  <TruckIcon className="w-4 h-4" /> : 
                                  <CheckIcon className="w-4 h-4" />
                                }
                              </button>
                            )}
                            
                            {/* 取消订单按钮 */}
                            {(order.status === 'pending' || order.status === 'pending_shipment') && (
                              <button
                                onClick={() => updateOrderStatus(order._id, 'cancelled')}
                                className="btn btn-sm btn-error"
                                title="取消订单"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {computedTotalPages > 1 && (
              <div className="flex justify-center p-4">
                <div className="join">
                  <button
                    className="join-item btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    «
                  </button>
                  {Array.from({ length: computedTotalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`join-item btn ${currentPage === page ? 'btn-active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="join-item btn"
                    disabled={currentPage === computedTotalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 订单详情模态框 */}
      {showOrderModal && selectedOrder && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">订单详情</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">基本信息</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">订单号:</span> {selectedOrder.id || selectedOrder._id?.slice(-8)}</p>
                  <p><span className="font-medium">客户:</span> {selectedOrder.customerName || selectedOrder.customer}</p>
                  <p><span className="font-medium">金额:</span> ¥{formatAmount(selectedOrder.totalAmount || selectedOrder.total)}</p>
                  <p><span className="font-medium">支付方式:</span> {paymentMethodLabels[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</p>
                  <p><span className="font-medium">状态:</span> 
                    <span className={`badge ml-2 ${statusColors[selectedOrder.status] || 'badge-neutral'}`}>
                      {statusLabels[selectedOrder.status] || selectedOrder.status}
                    </span>
                  </p>
                  <p><span className="font-medium">创建时间:</span> {formatTime(selectedOrder.createTime || selectedOrder.date).date} {formatTime(selectedOrder.createTime || selectedOrder.date).time}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">商品信息</h4>
                {selectedOrder.products && selectedOrder.products.length > 0 ? (
                  <div className="space-y-2">
                    {selectedOrder.products.map((product, index) => (
                      <div key={index} className="border rounded p-2 text-sm">
                        <p><span className="font-medium">商品:</span> {product.name}</p>
                        <p><span className="font-medium">数量:</span> {product.quantity}</p>
                        <p><span className="font-medium">单价:</span> ¥{formatAmount(product.price)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">暂无商品信息</p>
                )}
              </div>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowOrderModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
