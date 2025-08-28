import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  BuildingStorefrontIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { app, ensureLogin } from '../utils/cloudbase';
import { useNavigate } from 'react-router-dom';
import { ContentLoading, CardLoading } from '../components/LoadingSpinner';
import { useResponsive } from '../utils/responsive';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    todayOrders: 0,
    todayPendingOrders: 0,
    todayCompletedOrders: 0,
    totalPrepaidRecords: 0,
    activePrepaidRecords: 0,
    totalPrepaidBalance: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    totalProducts: 0,
    customersByNature: {},
    ordersByStatus: {},
    recentStats: {
      last7Days: 0,
      last30Days: 0
    },
    dailyRevenue: [],
    monthlyOrders: []
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  // 获取当天0点时间戳
  const getTodayStart = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  };

  // 获取7天前时间戳
  const get7DaysAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  };

  // 获取30天前时间戳
  const get30DaysAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  };

  // 获取统计数据
  const fetchStats = async () => {
    try {
      setLoading(true);
      await ensureLogin();
      const db = app.database();
      const todayStart = getTodayStart();
      const weekAgo = get7DaysAgo();
      const monthAgo = get30DaysAgo();

      // 并行获取所有统计数据
      const [
        customersResult,
        todayOrdersResult,
        prepaidRecordsResult,
        productsResult,
        recentOrdersResult
      ] = await Promise.all([
        // 客户统计
        Promise.all([
          db.collection('customers').count(),
          db.collection('customers').get() // 获取详细数据用于分类统计
        ]),
        
        // 订单统计
        Promise.all([
          db.collection('orders').where({ createTime: db.command.gte(todayStart) }).get(),
          db.collection('orders').where({ createTime: db.command.gte(weekAgo) }).count(),
          db.collection('orders').where({ createTime: db.command.gte(monthAgo) }).count(),
          db.collection('orders').get() // 获取所有订单用于收入计算
        ]),
        
        // 预存记录统计
        Promise.all([
          db.collection('prepaidRecords').count(),
          db.collection('prepaidRecords').where({ status: 'active' }).get()
        ]),
        
        // 产品统计
        Promise.all([
          db.collection('products').count(),
        db.collection('products').where({ stock: db.command.lte(10) }).get()
        ]),
        
        // 最近订单
        db.collection('orders').orderBy('createTime', 'desc').limit(8).get()
      ]);

      // 处理客户数据
      const [customersCount, customersData] = customersResult;
      const customersByNature = customersData.data.reduce((acc, customer) => {
        const nature = customer.nature || '未分类';
        acc[nature] = (acc[nature] || 0) + 1;
        return acc;
      }, {});

      // 处理订单数据
      const [todayOrdersData, weekOrdersCount, monthOrdersCount, allOrdersData] = todayOrdersResult;
      const todayOrders = todayOrdersData.data;
      
      // 按状态分类今日订单
      const ordersByStatus = todayOrders.reduce((acc, order) => {
        const status = order.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // 计算收入（排除预存扣除订单）
      const todayRevenue = todayOrders
        .filter(order => order.status === 'completed' && !['prepaid', 'prestore'].includes(order.paymentMethod))
        .reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);

      const totalRevenue = allOrdersData.data
        .filter(order => order.status === 'completed' && !['prepaid', 'prestore'].includes(order.paymentMethod))
        .reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);

      // 处理预存记录数据
      const [prepaidCount, activePrepaidData] = prepaidRecordsResult;
      const totalPrepaidBalance = activePrepaidData.data.reduce((sum, record) => {
        if (record.type === 'cash') {
          return sum + (record.balance || 0);
        } else {
          // 产品预存也计入余额（可以用数量 * 估算价值）
          return sum + (record.balance || 0) * 10; // 假设每个产品价值10元
        }
      }, 0);

      // 处理产品数据
      const [productsCount, lowStockData] = productsResult;



      // 生成图表数据
      const dailyRevenue = [];
      const monthlyOrders = [];
      
      // 生成最近7天的收入数据（模拟数据，实际应从数据库获取）
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayRevenue = Math.random() * 1000 + 200; // 模拟数据
        dailyRevenue.push({
          date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
          revenue: dayRevenue
        });
      }
      
      // 生成最近12个月的订单数据（模拟数据）
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthOrders = Math.floor(Math.random() * 50) + 10; // 模拟数据
        monthlyOrders.push({
          month: date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' }),
          orders: monthOrders
        });
      }

      setStats(prevStats => ({
        ...prevStats,
        totalCustomers: customersCount.total,
        todayOrders: todayOrders.length,
        todayPendingOrders: ordersByStatus.pending || 0,
        todayCompletedOrders: ordersByStatus.completed || 0,
        totalPrepaidRecords: prepaidCount.total,
        activePrepaidRecords: activePrepaidData.data.length,
        totalPrepaidBalance,
        todayRevenue,
        totalRevenue,
        lowStockProducts: lowStockData.data.length,
        totalProducts: productsCount.total,
        customersByNature,
        ordersByStatus,
        recentStats: {
          last7Days: weekOrdersCount.total,
          last30Days: monthOrdersCount.total
        },
        dailyRevenue,
        monthlyOrders
      }));

      setRecentOrders(recentOrdersResult.data);
      setLowStockProducts(lowStockData.data.slice(0, 5)); // 只显示前5个低库存产品

    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // 设置自动刷新（每5分钟）
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 状态标签和颜色（与小程序端保持一致）
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

  // 格式化金额
  const formatAmount = (amount) => {
    return typeof amount === 'number' ? amount.toFixed(2) : '0.00';
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '未知';
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return <ContentLoading />;
  }

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-center'} mb-6`}>
        <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>管理仪表板</h1>
        <div className={`flex gap-2 ${isMobile ? 'justify-center' : ''}`}>
          <button 
            onClick={() => setShowCharts(!showCharts)}
            className="btn btn-sm btn-outline"
          >
            {showCharts ? (
              <>
                <EyeSlashIcon className="w-4 h-4 mr-1" />
                隐藏图表
              </>
            ) : (
              <>
                <EyeIcon className="w-4 h-4 mr-1" />
                显示图表
              </>
            )}
          </button>
          <button 
            onClick={fetchStats}
            className="btn btn-sm btn-outline"
            disabled={loading}
          >
            {loading ? '刷新中...' : '刷新数据'}
          </button>
        </div>
      </div>

      {/* 主要统计卡片 */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-${isMobile ? '4' : '6'} mb-${isMobile ? '6' : '8'}`}>
        {/* 总客户数 */}
        <div className="stat bg-base-100 shadow rounded-lg cursor-pointer transition group hover:bg-primary hover:text-primary-content" onClick={() => navigate('/users')}>
          <div className="stat-figure text-primary group-hover:text-primary-content">
            <UsersIcon className="w-8 h-8" />
          </div>
          <div className="stat-title text-base-content group-hover:text-primary-content">总客户数</div>
          <div className="stat-value text-primary group-hover:text-primary-content">{stats.totalCustomers}</div>
          <div className="stat-desc text-base-content group-hover:text-primary-content">
            预存客户: {(stats.customersByNature['金额预存客户'] || 0) + (stats.customersByNature['产品预存客户'] || 0)}
          </div>
        </div>

        {/* 当天订单数 */}
        <div className="stat bg-base-100 shadow rounded-lg cursor-pointer transition group hover:bg-secondary hover:text-secondary-content" onClick={() => navigate('/orders')}>
          <div className="stat-figure text-secondary group-hover:text-secondary-content">
            <ShoppingBagIcon className="w-8 h-8" />
          </div>
          <div className="stat-title text-base-content group-hover:text-secondary-content">今日订单</div>
          <div className="stat-value text-secondary group-hover:text-secondary-content">{stats.todayOrders}</div>
          <div className="stat-desc text-base-content group-hover:text-secondary-content">
            待付款: {stats.todayPendingOrders} | 已完成: {stats.todayCompletedOrders}
          </div>
        </div>

        {/* 预存记录 */}
        <div className="stat bg-base-100 shadow rounded-lg cursor-pointer transition group hover:bg-accent hover:text-accent-content" onClick={() => navigate('/deposits')}>
          <div className="stat-figure text-accent group-hover:text-accent-content">
            <CreditCardIcon className="w-8 h-8" />
          </div>
          <div className="stat-title text-base-content group-hover:text-accent-content">预存记录</div>
          <div className="stat-value text-accent group-hover:text-accent-content">{stats.totalPrepaidRecords}</div>
          <div className="stat-desc text-base-content group-hover:text-accent-content">
            有效: {stats.activePrepaidRecords} | 余额: ¥{formatAmount(stats.totalPrepaidBalance)}
          </div>
        </div>

        {/* 今日收入 */}
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-figure text-success">
            <CurrencyDollarIcon className="w-8 h-8" />
          </div>
          <div className="stat-title">今日收入</div>
          <div className="stat-value text-success">¥{formatAmount(stats.todayRevenue)}</div>
          <div className="stat-desc">总收入: ¥{formatAmount(stats.totalRevenue)}</div>
        </div>
      </div>

      {/* 次要统计信息 */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-${isMobile ? '4' : '6'} mb-${isMobile ? '6' : '8'}`}>
        {/* 订单趋势 */}
        <div className={`bg-base-100 shadow rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            订单趋势
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>近7天:</span>
              <span className="font-semibold">{stats.recentStats.last7Days}</span>
            </div>
            <div className="flex justify-between">
              <span>近30天:</span>
              <span className="font-semibold">{stats.recentStats.last30Days}</span>
            </div>
            <div className="flex justify-between">
              <span>平均每日:</span>
              <span className="font-semibold">{Math.round(stats.recentStats.last7Days / 7)}</span>
            </div>
          </div>
        </div>

        {/* 客户分布 */}
        <div className="bg-base-100 shadow rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <UsersIcon className="w-5 h-5 mr-2" />
            客户分布
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.customersByNature).map(([nature, count]) => (
              <div key={nature} className="flex justify-between">
                <span>{nature}:</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 产品状态 */}
        <div className="bg-base-100 shadow rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <BuildingStorefrontIcon className="w-5 h-5 mr-2" />
            产品状态
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>总产品数:</span>
              <span className="font-semibold">{stats.totalProducts}</span>
            </div>
            <div className="flex justify-between">
              <span>低库存:</span>
              <span className={`font-semibold ${stats.lowStockProducts > 0 ? 'text-warning' : 'text-success'}`}>
                {stats.lowStockProducts}
              </span>
            </div>
            {stats.lowStockProducts > 0 && (
              <div className="text-xs text-warning flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                需要补货
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      {showCharts && (
        <div className={`grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-2'} gap-${isMobile ? '4' : '6'} mb-${isMobile ? '6' : '8'}`}>
          {/* 收入趋势图 */}
          <div className={`bg-base-100 shadow rounded-lg ${isMobile ? 'p-4' : 'p-6'}`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <ArrowTrendingUpIcon className="w-5 h-5 mr-2 text-success" />
              近7天收入趋势
            </h3>
            <div className={`${isMobile ? 'h-48' : 'h-64'}`}>
              <div className={`flex items-end justify-between ${isMobile ? 'h-32' : 'h-48'} px-2`}>
                {stats.dailyRevenue.map((item, index) => {
                  const maxRevenue = Math.max(...stats.dailyRevenue.map(d => d.revenue));
                  const height = (item.revenue / maxRevenue) * 100;
                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div className="text-xs text-gray-500 mb-1">¥{item.revenue.toFixed(0)}</div>
                      <div 
                        className="bg-success rounded-t w-8 transition-all duration-300 hover:bg-success/80"
                        style={{ height: `${height}%` }}
                        title={`${item.date}: ¥${item.revenue.toFixed(2)}`}
                      ></div>
                      <div className="text-xs text-gray-600 mt-2">{item.date}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 客户分布饼图 */}
          <div className={`bg-base-100 shadow rounded-lg ${isMobile ? 'p-4' : 'p-6'}`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <ChartPieIcon className="w-5 h-5 mr-2 text-primary" />
              客户性质分布
            </h3>
            <div className="h-64 flex items-center justify-center">
              <div className="relative w-48 h-48">
                {Object.keys(stats.customersByNature).length > 0 ? (
                  <div className="w-full h-full rounded-full border-8 border-primary relative overflow-hidden">
                    {/* 简化的饼图显示 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{stats.totalCustomers}</div>
                        <div className="text-sm text-gray-500">总客户数</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <ChartPieIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <div>暂无数据</div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {Object.entries(stats.customersByNature).map(([nature, count], index) => {
                const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-warning'];
                return (
                  <div key={nature} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} mr-2`}></div>
                      <span className="text-sm">{nature}</span>
                    </div>
                    <span className="font-semibold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 详细信息区域 */}
      <div className={`grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-2'} gap-${isMobile ? '4' : '6'}`}>
        {/* 最近订单 */}
        <div className="bg-base-100 shadow rounded-lg p-6">
          <h2 
            className="text-xl font-semibold mb-4 flex items-center cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate('/orders')}
            title="点击查看全部订单"
          >
            <ChartBarIcon className="w-6 h-6 mr-2" />
            最近订单
          </h2>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无订单数据
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`table table-zebra w-full ${isMobile ? 'table-xs' : ''}`}>
                <thead>
                  <tr>
                    <th>订单号</th>
                    <th>客户</th>
                    <th>金额</th>
                    <th>状态</th>
                    <th>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-base-200 cursor-pointer" onClick={() => navigate('/orders')}>
                      <td className="font-mono text-sm">{order.id || order._id?.slice(-8)}</td>
                      <td>{order.customerName || order.customer || '未知客户'}</td>
                      <td className="font-semibold">¥{formatAmount(order.totalAmount || order.total)}</td>
                      <td>
                        <span className={`badge badge-sm ${statusColors[order.status] || 'badge-neutral'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td className="text-sm">
                        {formatTime(order.createTime || order.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 低库存产品 */}
        <div className="bg-base-100 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <ExclamationTriangleIcon className="w-6 h-6 mr-2 text-warning" />
            低库存产品
          </h2>
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-success mb-2">库存正常</div>
              <div className="text-sm">所有产品库存充足</div>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product._id} className="flex justify-between items-center p-3 bg-warning/10 rounded">
                  <div>
                    <div className="font-semibold">{product.productName || product.name}</div>
                    <div className="text-sm text-gray-500">类型: {product.type || '未分类'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-warning font-bold">{product.quantity || 0}</div>
                    <div className="text-xs text-gray-500">剩余</div>
                  </div>
                </div>
              ))}
              <button 
                className="btn btn-warning btn-sm w-full"
                onClick={() => navigate('/products')}
              >
                查看全部库存
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;