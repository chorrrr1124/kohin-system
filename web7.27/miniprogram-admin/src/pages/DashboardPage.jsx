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

  useEffect(() => {
    // 模拟数据加载
    const loadData = async () => {
      setLoading(true);
      try {
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 设置模拟数据
        setStats({
          totalCustomers: 1250,
          todayOrders: 45,
          todayPendingOrders: 12,
          todayCompletedOrders: 33,
          totalPrepaidRecords: 89,
          activePrepaidRecords: 67,
          totalPrepaidBalance: 12500,
          todayRevenue: 8500,
          totalRevenue: 125000,
          lowStockProducts: 5,
          totalProducts: 156,
          customersByNature: {
            '个人用户': 1200,
            '企业用户': 50
          },
          ordersByStatus: {
            '待处理': 12,
            '已完成': 33
          },
          recentStats: {
            last7Days: 320,
            last30Days: 1250
          },
          dailyRevenue: [],
          monthlyOrders: []
        });
        
        setRecentOrders([
          { id: '1', customerName: '张三', amount: 299, status: '已完成', createTime: new Date() },
          { id: '2', customerName: '李四', amount: 599, status: '待处理', createTime: new Date() },
          { id: '3', customerName: '王五', amount: 199, status: '已完成', createTime: new Date() }
        ]);
        
        setLowStockProducts([
          { id: '1', name: '商品A', stock: 5, minStock: 10 },
          { id: '2', name: '商品B', stock: 3, minStock: 10 }
        ]);
        
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <ContentLoading />;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">仪表板</h1>
          <p className="text-base-content/70 mt-1">欢迎回来，管理员</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="btn btn-outline btn-sm"
          >
            {showCharts ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            {showCharts ? '隐藏图表' : '显示图表'}
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 总客户数 */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-base-content/70">总客户数</p>
                <p className="text-2xl font-bold text-base-content">{stats.totalCustomers.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <UsersIcon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* 今日订单 */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-base-content/70">今日订单</p>
                <p className="text-2xl font-bold text-base-content">{stats.todayOrders}</p>
                <p className="text-xs text-base-content/50">
                  待处理: {stats.todayPendingOrders} | 已完成: {stats.todayCompletedOrders}
                </p>
              </div>
              <div className="p-3 bg-success/10 rounded-full">
                <ShoppingBagIcon className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
        </div>

        {/* 今日收入 */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-base-content/70">今日收入</p>
                <p className="text-2xl font-bold text-base-content">¥{stats.todayRevenue.toLocaleString()}</p>
                <p className="text-xs text-base-content/50">
                  总收入: ¥{stats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-warning/10 rounded-full">
                <CurrencyDollarIcon className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>
        </div>

        {/* 库存预警 */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-base-content/70">库存预警</p>
                <p className="text-2xl font-bold text-base-content">{stats.lowStockProducts}</p>
                <p className="text-xs text-base-content/50">
                  总商品: {stats.totalProducts}
                </p>
              </div>
              <div className="p-3 bg-error/10 rounded-full">
                <ExclamationTriangleIcon className="w-6 h-6 text-error" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 最近订单 */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="card-title">最近订单</h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>订单ID</th>
                  <th>客户</th>
                  <th>金额</th>
                  <th>状态</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customerName}</td>
                    <td>¥{order.amount}</td>
                    <td>
                      <span className={`badge ${
                        order.status === '已完成' ? 'badge-success' : 'badge-warning'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{order.createTime.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 库存预警 */}
      {lowStockProducts.length > 0 && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-error">库存预警</h3>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>商品名称</th>
                    <th>当前库存</th>
                    <th>最低库存</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.stock}</td>
                      <td>{product.minStock}</td>
                      <td>
                        <span className="badge badge-error">库存不足</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
