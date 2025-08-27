import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Gift, DollarSign, Calendar, Target, Award, Activity } from 'lucide-react';

const CouponAnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalCoupons: 0,
      activeCoupons: 0,
      totalIssued: 0,
      totalUsed: 0,
      totalSavings: 0,
      conversionRate: 0
    },
    usageByType: [],
    usageByGameplay: [],
    dailyUsage: [],
    topPerformingCoupons: [],
    userEngagement: []
  });
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // 模拟数据加载
      const mockData = {
        overview: {
          totalCoupons: 45,
          activeCoupons: 32,
          totalIssued: 1250,
          totalUsed: 890,
          totalSavings: 15680.50,
          conversionRate: 71.2
        },
        usageByType: [
          { name: '满减券', value: 450, percentage: 50.6 },
          { name: '折扣券', value: 320, percentage: 36.0 },
          { name: '免邮券', value: 120, percentage: 13.4 }
        ],
        usageByGameplay: [
          { name: '普通', value: 380, color: '#8884d8' },
          { name: '限时抢购', value: 220, color: '#82ca9d' },
          { name: '新人专享', value: 150, color: '#ffc658' },
          { name: '会员专享', value: 90, color: '#ff7300' },
          { name: '分享获得', value: 50, color: '#00ff88' }
        ],
        dailyUsage: [
          { date: '01-20', issued: 45, used: 32 },
          { date: '01-21', issued: 52, used: 38 },
          { date: '01-22', issued: 48, used: 35 },
          { date: '01-23', issued: 65, used: 48 },
          { date: '01-24', issued: 58, used: 42 },
          { date: '01-25', issued: 72, used: 55 },
          { date: '01-26', issued: 68, used: 51 }
        ],
        topPerformingCoupons: [
          { name: '新人专享10元券', issued: 200, used: 180, rate: 90.0, savings: 1800 },
          { name: '满100减20券', issued: 150, used: 120, rate: 80.0, savings: 2400 },
          { name: '8折优惠券', issued: 180, used: 135, rate: 75.0, savings: 2025 },
          { name: '免邮券', issued: 120, used: 85, rate: 70.8, savings: 850 },
          { name: '生日专享券', issued: 80, used: 52, rate: 65.0, savings: 1040 }
        ],
        userEngagement: [
          { metric: '平均领取时间', value: '2.3分钟', trend: 'up' },
          { metric: '平均使用时间', value: '1.8天', trend: 'down' },
          { metric: '重复使用率', value: '45.2%', trend: 'up' },
          { metric: '分享转化率', value: '12.8%', trend: 'up' }
        ]
      };
      
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('加载分析数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题和时间范围选择 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 优惠券数据分析</h1>
          <p className="text-gray-600 mt-1">优惠券使用效果统计与分析</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="select select-bordered"
          >
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
            <option value="90d">最近90天</option>
            <option value="1y">最近1年</option>
          </select>
        </div>
      </div>

      {/* 概览统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总优惠券数</p>
              <p className="text-2xl font-bold text-blue-600">{analyticsData.overview.totalCoupons}</p>
            </div>
            <Gift className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">生效中</p>
              <p className="text-2xl font-bold text-green-600">{analyticsData.overview.activeCoupons}</p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总发放量</p>
              <p className="text-2xl font-bold text-purple-600">{analyticsData.overview.totalIssued}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总使用量</p>
              <p className="text-2xl font-bold text-orange-600">{analyticsData.overview.totalUsed}</p>
            </div>
            <Target className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总节省金额</p>
              <p className="text-2xl font-bold text-red-600">¥{analyticsData.overview.totalSavings}</p>
            </div>
            <DollarSign className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">使用转化率</p>
              <p className="text-2xl font-bold text-indigo-600">{analyticsData.overview.conversionRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 优惠券类型使用分布 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 优惠券类型使用分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.usageByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.usageByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 玩法类型使用统计 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎮 玩法类型使用统计</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.usageByGameplay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 每日使用趋势 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 每日使用趋势</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analyticsData.dailyUsage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="issued" stroke="#8884d8" name="发放量" />
            <Line type="monotone" dataKey="used" stroke="#82ca9d" name="使用量" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 表现最佳的优惠券 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 表现最佳的优惠券</h3>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>优惠券名称</th>
                <th>发放量</th>
                <th>使用量</th>
                <th>使用率</th>
                <th>节省金额</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.topPerformingCoupons.map((coupon, index) => (
                <tr key={index}>
                  <td className="font-medium">{coupon.name}</td>
                  <td>{coupon.issued}</td>
                  <td>{coupon.used}</td>
                  <td>
                    <span className={`badge ${
                      coupon.rate >= 80 ? 'badge-success' :
                      coupon.rate >= 60 ? 'badge-warning' : 'badge-error'
                    }`}>
                      {coupon.rate}%
                    </span>
                  </td>
                  <td className="text-red-600 font-semibold">¥{coupon.savings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 用户参与度指标 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 用户参与度指标</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analyticsData.userEngagement.map((metric, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.metric}</p>
                  <p className="text-xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className={`text-2xl ${
                  metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {metric.trend === 'up' ? '📈' : '📉'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CouponAnalyticsPage;