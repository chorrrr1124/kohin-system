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
import MobileCard, { MobileStatCard, MobileListItem } from '../components/MobileCard';
import MobileTable, { MobileStatusBadge, MobileTimeDisplay } from '../components/MobileTable';
import { isMobile } from '../utils/deviceDetection';

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
        <MobileStatCard
          title="总客户数"
          value={stats.totalCustomers.toLocaleString()}
          icon={<UsersIcon className="w-6 h-6" />}
          color="blue"
        />

        {/* 今日订单 */}
        <MobileStatCard
          title="今日订单"
          value={stats.todayOrders}
          subtitle={`待处理: ${stats.todayPendingOrders} | 已完成: ${stats.todayCompletedOrders}`}
          icon={<ShoppingBagIcon className="w-6 h-6" />}
          color="green"
        />

        {/* 今日收入 */}
        <MobileStatCard
          title="今日收入"
          value={`¥${stats.todayRevenue.toLocaleString()}`}
          subtitle={`总收入: ¥${stats.totalRevenue.toLocaleString()}`}
          icon={<CurrencyDollarIcon className="w-6 h-6" />}
          color="yellow"
        />

        {/* 库存预警 */}
        <MobileStatCard
          title="库存预警"
          value={stats.lowStockProducts}
          subtitle={`总商品: ${stats.totalProducts}`}
          icon={<ExclamationTriangleIcon className="w-6 h-6" />}
          color="red"
        />
      </div>

      {/* 最近订单 */}
      <MobileCard title="最近订单">
        <MobileTable
          data={recentOrders}
          columns={[
            {
              key: 'id',
              title: '订单ID',
              render: (value) => value
            },
            {
              key: 'customerName',
              title: '客户',
              render: (value) => value
            },
            {
              key: 'amount',
              title: '金额',
              render: (value) => `¥${value}`
            },
            {
              key: 'status',
              title: '状态',
              render: (value) => <MobileStatusBadge status={value} type="order" />
            },
            {
              key: 'createTime',
              title: '时间',
              render: (value) => <MobileTimeDisplay time={value} format="relative" />
            }
          ]}
        />
      </MobileCard>

      {/* 库存预警 */}
      {lowStockProducts.length > 0 && (
        <MobileCard title="库存预警" className="border-l-4 border-l-red-500">
          <MobileTable
            data={lowStockProducts}
            columns={[
              {
                key: 'name',
                title: '商品名称',
                render: (value) => value
              },
              {
                key: 'stock',
                title: '当前库存',
                render: (value) => value
              },
              {
                key: 'minStock',
                title: '最低库存',
                render: (value) => value
              },
              {
                key: 'status',
                title: '状态',
                render: (value, row) => (
                  <MobileStatusBadge 
                    status="库存不足" 
                    type="inventory" 
                  />
                )
              }
            ]}
          />
        </MobileCard>
      )}
    </div>
  );
};

export default DashboardPage;
