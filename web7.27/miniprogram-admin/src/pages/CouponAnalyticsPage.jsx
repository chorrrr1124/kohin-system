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
import { app, ensureLogin } from '../utils/cloudbase';
import { ContentLoading } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const CouponAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    totalUsage: 0,
    conversionRate: 0,
    monthlyTrend: [],
    topCoupons: []
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      console.log('开始加载优惠券分析数据...');
      
      // 确保用户已登录
      await ensureLogin();
      
      // 调用云函数获取分析数据
      const result = await app.callFunction({
        name: 'couponAnalytics',
        data: {
          action: 'getAnalytics'
        }
      });
      
      console.log('云函数返回结果:', result);
      
      if (result.result.success) {
        setAnalyticsData(result.result.data);
        console.log('优惠券分析数据加载成功:', result.result.data);
      } else {
        console.error('获取分析数据失败:', result.result.error);
        addToast(`获取分析数据失败: ${result.result.error}`, 'error');
        
        // 设置默认数据
        setAnalyticsData({
          totalCoupons: 0,
          activeCoupons: 0,
          totalUsage: 0,
          conversionRate: 0,
          monthlyTrend: [],
          topCoupons: []
        });
      }
      
    } catch (error) {
      console.error('加载优惠券分析数据失败:', error);
      addToast(`加载分析数据失败: ${error.message}`, 'error');
      
      // 设置默认数据
      setAnalyticsData({
        totalCoupons: 0,
        activeCoupons: 0,
        totalUsage: 0,
        conversionRate: 0,
        monthlyTrend: [],
        topCoupons: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ContentLoading message="正在加载优惠券分析数据..." />;
  }

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">优惠券分析</h1>
          <p className="text-gray-600 mt-1">分析优惠券使用情况，优化营销策略</p>
        </div>
        <button
          onClick={loadAnalyticsData}
          disabled={loading}
          className="btn btn-outline btn-sm"
        >
          {loading ? '刷新中...' : '刷新数据'}
        </button>
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
          {analyticsData.monthlyTrend.length > 0 ? (
            <div className="h-64 flex items-end justify-between gap-2">
              {analyticsData.monthlyTrend.map((item, index) => {
                const maxUsage = Math.max(...analyticsData.monthlyTrend.map(t => t.usage));
                const height = maxUsage > 0 ? `${(item.usage / maxUsage) * 200}px` : '10px';
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height }}
                    ></div>
                    <span className="text-xs text-gray-600 mt-2">{item.month}</span>
                    <span className="text-xs font-medium">{item.usage}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>暂无月度趋势数据</p>
              </div>
            </div>
          )}
        </div>

        {/* 热门优惠券 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">热门优惠券</h3>
          {analyticsData.topCoupons.length > 0 ? (
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
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <TicketIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>暂无优惠券数据</p>
              </div>
            </div>
          )}
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