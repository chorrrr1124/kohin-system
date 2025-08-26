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
        query = query.where({ status: statusFilter });
      }

      if (paymentFilter) {
        query = query.where({ paymentMethod: paymentFilter });
      }

      if (dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        query = query.where({
          createTime: db.command.gte(startDate).and(db.command.lte(endDate))
        });
      }
      
      const result = await query.orderBy('createTime', 'desc').get();
      const exportData = result.data;
      
      // 转换为CSV格式
      const csvHeaders = [
        '订单号', '客户姓名', '订单金额', '支付方式', '订单状态', 
        '商品信息', '创建时间', '更新时间', '备注'
      ];
      
      const csvRows = exportData.map(order => [
        order.id || order._id,
        order.customerName || order.customer || '未知客户',
        (order.totalAmount || order.total || 0).toFixed(2),
        paymentMethodLabels[order.paymentMethod] || order.paymentMethod,
        statusLabels[order.status] || order.status,
        order.items ? order.items.map(item => `${item.name || item.productName}×${item.quantity}`).join('; ') : '',
        formatTime(order.createTime || order.date),
        formatTime(order.updateTime),
        order.remark || ''
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      // 下载CSV文件
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `订单数据_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('导出成功！');
    } catch (error) {
      console.error('导出订单数据失败:', error);
      alert('导出失败');
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
        query = query.where({ status: statusFilter });
      }

      if (paymentFilter) {
        query = query.where({ paymentMethod: paymentFilter });
      }

      if (dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        query = query.where({
          createTime: db.command.gte(startDate).and(db.command.lte(endDate))
        });
      }

      // 获取总数
      const countResult = await query.count();
      const total = countResult.total;
      setTotalPages(Math.ceil(total / pageSize));

      // 获取分页数据
      const result = await query
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .orderBy('createTime', 'desc')
        .get();

      setOrders(result.data);
    } catch (error) {
      console.error('获取订单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
  }, [currentPage, searchTerm, statusFilter, paymentFilter, dateRange]);

  useEffect(() => {
    fetchOrderStats();
  }, []);

  // 查看订单详情
  const viewOrder = async (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
    
    // 如果有客户ID，查询客户详情
    if (order.customerId) {
      try {
        await ensureLogin();
        const db = app.database();
        const customerRes = await db.collection('customers').doc(order.customerId).get();
        if (customerRes.data) {
          setSelectedOrder({...order, customerInfo: customerRes.data});
        }
      } catch (error) {
        console.error('获取客户信息失败:', error);
      }
    }
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

      // 刷新列表
      fetchOrders();
      alert('状态更新成功');
    } catch (error) {
      console.error('更新订单状态失败:', error);
      alert('状态更新失败');
    }
  };

  // 批量更新订单状态
  const batchUpdateStatus = async (newStatus) => {
    if (selectedOrders.length === 0) {
      alert('请选择要更新的订单');
      return;
    }

    if (!window.confirm(`确定要将选中的 ${selectedOrders.length} 个订单状态更新为"${statusLabels[newStatus]}"吗？`)) {
      return;
    }

    try {
      await ensureLogin();
      const db = app.database();
      
      // 批量更新
      const promises = selectedOrders.map(orderId => 
        db.collection('orders').doc(orderId).update({
          status: newStatus,
          updateTime: new Date()
        })
      );
      
      await Promise.all(promises);
      
      setSelectedOrders([]);
      fetchOrders();
      alert('批量更新成功');
    } catch (error) {
      console.error('批量更新失败:', error);
      alert('批量更新失败');
    }
  };

  // 删除订单
  const deleteOrder = async (orderId) => {
    if (!window.confirm('确定要删除该订单吗？删除后无法恢复。')) return;
    
    try {
      await ensureLogin();
      const db = app.database();
      await db.collection('orders').doc(orderId).remove();
      fetchOrders();
      alert('删除成功');
    } catch (error) {
      console.error('删除订单失败:', error);
      alert('删除失败');
    }
  };

  // 选择/取消选择订单
  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order._id));
    }
  };

  // 搜索处理
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '未知';
    return new Date(timestamp).toLocaleString();
  };

  // 格式化金额
  const formatAmount = (amount) => {
    return typeof amount === 'number' ? amount.toFixed(2) : '0.00';
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

  // 获取状态操作按钮文本
  const getStatusButtonText = (currentStatus) => {
    const buttonTexts = {
      'pending': '确认付款',
      'pending_shipment': '发货',
      'shipped': '确认完成'
    };
    return buttonTexts[currentStatus] || '更新状态';
  };

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
          <div className="form-control flex-1 min-w-64">
            <div className="input-group">
              <input
                type="text"
                placeholder="搜索订单号或客户姓名..."
                className="input input-bordered w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn btn-square">
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
          <div className="form-control">
            <label className="label">
              <span className="label-text">开始日期</span>
            </label>
            <input
              type="date"
              className="input input-bordered"
              value={dateRange.start}
              onChange={(e) => {
                setDateRange({...dateRange, start: e.target.value});
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">结束日期</span>
            </label>
            <input
              type="date"
              className="input input-bordered"
              value={dateRange.end}
              onChange={(e) => {
                setDateRange({...dateRange, end: e.target.value});
                setCurrentPage(1);
              }}
            />
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
        </form>
      </div>

      {/* 订单列表 */}
      <div className="bg-base-100 shadow rounded-lg overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBagIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">暂无订单数据</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedOrders.length === orders.length && orders.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>订单号</th>
                    <th>客户</th>
                    <th>金额</th>
                    <th>支付方式</th>
                    <th>状态</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={selectedOrders.includes(order._id)}
                          onChange={() => toggleOrderSelection(order._id)}
                        />
                      </td>
                      <td className="font-mono text-sm">{order.id || order._id?.slice(-8)}</td>
                      <td>{order.customerName || order.customer || '未知客户'}</td>
                      <td className="font-bold">¥{formatAmount(order.totalAmount || order.total)}</td>
                      <td>
                        <span className={`badge ${paymentMethodColors[order.paymentMethod] || 'badge-neutral'}`}>
                          {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${statusColors[order.status] || 'badge-neutral'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td>{formatTime(order.createTime || order.date)}</td>
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex justify-center p-4">
                <div className="join">
                  <button
                    className="join-item btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    上一页
                  </button>
                  <button className="join-item btn btn-active">
                    {currentPage} / {totalPages}
                  </button>
                  <button
                    className="join-item btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    下一页
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
            <button
              type="button"
              className="absolute top-4 right-4 p-1 hover:bg-gray-200 rounded-full transition-colors"
              onClick={() => setShowOrderModal(false)}
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
            <h3 className="font-bold text-lg mb-4 mr-8">订单详情</h3>
            <div className="grid grid-cols-2 gap-6">
              {/* 基本信息 */}
              <div>
                <h4 className="font-semibold mb-2">基本信息</h4>
                <div className="space-y-2">
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">订单号</span>
                    </label>
                    <p className="font-mono">{selectedOrder.id || selectedOrder._id}</p>
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">客户姓名</span>
                    </label>
                    <p>{selectedOrder.customerName || selectedOrder.customer || '未知客户'}</p>
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">订单金额</span>
                    </label>
                    <p className="text-lg font-bold">¥{formatAmount(selectedOrder.totalAmount || selectedOrder.total)}</p>
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">支付方式</span>
                    </label>
                    <span className={`badge ${paymentMethodColors[selectedOrder.paymentMethod] || 'badge-neutral'}`}>
                      {paymentMethodLabels[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}
                    </span>
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">订单状态</span>
                    </label>
                    <span className={`badge ${statusColors[selectedOrder.status] || 'badge-neutral'}`}>
                      {statusLabels[selectedOrder.status] || selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">创建时间</span>
                    </label>
                    <p>{formatTime(selectedOrder.createTime || selectedOrder.date)}</p>
                  </div>
                </div>
              </div>

              {/* 商品信息 */}
              <div>
                <h4 className="font-semibold mb-2">商品信息</h4>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th>商品名称</th>
                          <th>数量</th>
                          <th>单价</th>
                          <th>小计</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.name || item.productName}</td>
                            <td>{item.quantity}</td>
                            <td>¥{formatAmount(item.price)}</td>
                            <td>¥{formatAmount(item.quantity * item.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">暂无商品信息</p>
                )}
              </div>

              {/* 收货地址 */}
              {selectedOrder.address && (
                <div className="col-span-2">
                  <h4 className="font-semibold mb-2">收货地址</h4>
                  <div className="bg-base-200 p-3 rounded">
                    <p><strong>收货人：</strong>{selectedOrder.address.name}</p>
                    <p><strong>联系电话：</strong>{selectedOrder.address.phone}</p>
                    <p><strong>收货地址：</strong>{selectedOrder.address.fullAddress || selectedOrder.address.address}</p>
                  </div>
                </div>
              )}

              {/* 备注信息 */}
              {selectedOrder.remark && (
                <div className="col-span-2">
                  <h4 className="font-semibold mb-2">备注信息</h4>
                  <div className="bg-base-200 p-3 rounded">
                    <p>{selectedOrder.remark}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => setShowOrderModal(false)}
              >
                关闭
              </button>
              {getNextStatus(selectedOrder.status) && (
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrder._id, getNextStatus(selectedOrder.status));
                    setShowOrderModal(false);
                  }}
                  className={`btn ${
                    selectedOrder.status === 'pending' ? 'btn-info' :
                    selectedOrder.status === 'pending_shipment' ? 'btn-primary' :
                    'btn-success'
                  }`}
                >
                  {getStatusButtonText(selectedOrder.status)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;