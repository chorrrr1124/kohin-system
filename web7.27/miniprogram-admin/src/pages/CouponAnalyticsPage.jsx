import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  ArrowLeftIcon,
  TicketIcon,
  ChartBarSquareIcon,
  UsersIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const CouponAnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState({
      totalCoupons: 0,
      activeCoupons: 0,
    totalUsage: 0,
    conversionRate: 0,
    monthlyTrend: [],
    topCoupons: []
  });

  useEffect(() => {
    // 模拟加载分析数据
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    // 这里可以添加真实的数据加载逻辑
    setAnalyticsData({
      totalCoupons: 25,
      activeCoupons: 18,
      totalUsage: 156,
      conversionRate: 12.5,
      monthlyTrend: [
        { month: '1月', usage: 45 },
        { month: '2月', usage: 52 },
        { month: '3月', usage: 38 },
        { month: '4月', usage: 61 },
        { month: '5月', usage: 73 },
        { month: '6月', usage: 89 }
        ],
      topCoupons: [
        { name: '新用户专享券', usage: 45, conversion: 18.2 },
        { name: '满减优惠券', usage: 38, conversion: 15.6 },
        { name: '生日特惠券', usage: 32, conversion: 12.8 }
        ]
    });
  };

    return (
    <div className="p-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-600">
        <Link to="/coupons" className="flex items-center gap-1 hover:text-primary">
          <TicketIcon className="w-4 h-4" />
          优惠券管理
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">优惠券分析</span>
      </div>

      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">优惠券分析</h1>
        <p className="text-gray-600 mt-1">分析优惠券使用情况，优化营销策略</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总优惠券数</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalCoupons}</p>
            </div>
            <TicketIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">生效中</p>
              <p className="text-2xl font-bold text-green-600">{analyticsData.activeCoupons}</p>
            </div>
            <ChartBarSquareIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总使用次数</p>
              <p className="text-2xl font-bold text-purple-600">{analyticsData.totalUsage}</p>
            </div>
            <UsersIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">转化率</p>
              <p className="text-2xl font-bold text-orange-600">{analyticsData.conversionRate}%</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 月度趋势图 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">月度使用趋势</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {analyticsData.monthlyTrend.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${(item.usage / 100) * 200}px` }}
                ></div>
                <span className="text-xs text-gray-600 mt-2">{item.month}</span>
                <span className="text-xs font-medium">{item.usage}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 热门优惠券 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">热门优惠券</h3>
          <div className="space-y-3">
            {analyticsData.topCoupons.map((coupon, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{coupon.name}</p>
                  <p className="text-sm text-gray-600">使用次数: {coupon.usage}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">{coupon.conversion}%</p>
                  <p className="text-xs text-gray-500">转化率</p>
                </div>
              </div>
            ))}
            </div>
        </div>
      </div>

      {/* 返回按钮 */}
      <div className="flex justify-start">
        <Link 
          to="/coupons"
          className="btn btn-outline gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          返回优惠券管理
        </Link>
      </div>
    </div>
  );
};

export default CouponAnalyticsPage;