import React, { useState, useEffect } from 'react';
import { CreditCardIcon, EyeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { app, ensureLogin } from '../utils/cloudbase';
import { ContentLoading, CardLoading } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const PaymentsPage = () => {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    successCount: 0,
    pendingCount: 0,
    failedCount: 0
  });
  const { addToast } = useToast();
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
    search: ''
  });

  // 获取支付记录
  const fetchPayments = async () => {
    setLoading(true);
    try {
      await ensureLogin();
      const db = app.database();
      
      let query = db.collection('payments').orderBy('createdAt', 'desc');
      
      // 应用筛选条件
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      
      const result = await query.limit(100).get();
      const paymentsData = result.data || []; // 确保有默认值
      setPayments(paymentsData);
      
      // 计算统计数据
      const totalAmount = paymentsData.reduce((sum, payment) => {
        return sum + (payment.status === 'success' ? payment.amount : 0);
      }, 0);
      
      const successCount = paymentsData.filter(p => p.status === 'success').length;
      const pendingCount = paymentsData.filter(p => p.status === 'pending').length;
      const failedCount = paymentsData.filter(p => p.status === 'failed').length;
      
      setStats({
        totalAmount,
        successCount,
        pendingCount,
        failedCount
      });
    } catch (error) {
      console.error('获取支付记录失败:', error);
      addToast('获取支付记录失败', 'error');
      // 确保在错误情况下也设置空数组
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // 更新支付状态
  const updatePaymentStatus = async (paymentId, newStatus) => {
    setLoading(true);
    try {
      await ensureLogin();
      const db = app.database();
      await db.collection('payments').doc(paymentId).update({
        status: newStatus,
        updatedAt: new Date()
      });
      addToast('支付状态更新成功', 'success');
      fetchPayments();
    } catch (error) {
      console.error('更新支付状态失败:', error);
      addToast('更新支付状态失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 获取状态标签样式
  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return 'badge badge-success';
      case 'pending':
        return 'badge badge-warning';
      case 'failed':
        return 'badge badge-error';
      default:
        return 'badge badge-ghost';
    }
  };

  // 获取状态文本
  const getStatusText = (status) => {
    switch (status) {
      case 'success':
        return '支付成功';
      case 'pending':
        return '待支付';
      case 'failed':
        return '支付失败';
      default:
        return '未知状态';
    }
  };

  // 获取支付方式文本
  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'wechat':
        return '微信支付';
      case 'alipay':
        return '支付宝';
      case 'balance':
        return '余额支付';
      default:
        return method || '未知';
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filters]);

  if (loading && payments.length === 0) {
    return <ContentLoading />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">支付管理</h1>
        <p className="text-gray-600 mt-1">查看和管理所有支付记录</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCardIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总交易金额</p>
              <p className="text-2xl font-bold text-gray-900">¥{stats.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">成功支付</p>
              <p className="text-2xl font-bold text-gray-900">{stats.successCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <EyeIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">待支付</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">支付失败</p>
              <p className="text-2xl font-bold text-gray-900">{stats.failedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">
              <span className="label-text">支付状态</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">全部状态</option>
              <option value="success">支付成功</option>
              <option value="pending">待支付</option>
              <option value="failed">支付失败</option>
            </select>
          </div>

          <div>
            <label className="label">
              <span className="label-text">搜索</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="订单号、用户ID等"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="flex items-end">
            <button
              className="btn btn-primary w-full"
              onClick={fetchPayments}
            >
              刷新数据
            </button>
          </div>
        </div>
      </div>

      {/* 支付记录表格 */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>订单号</th>
                <th>用户ID</th>
                <th>支付方式</th>
                <th>金额</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {payments && payments.length > 0 ? payments.map((payment) => (
                <tr key={payment._id}>
                  <td className="font-mono text-sm">{payment.orderId || payment._id}</td>
                  <td>{payment.userId || '-'}</td>
                  <td>{getPaymentMethodText(payment.paymentMethod)}</td>
                  <td className="font-medium">¥{payment.amount?.toFixed(2) || '0.00'}</td>
                  <td>
                    <span className={getStatusBadge(payment.status)}>
                      {getStatusText(payment.status)}
                    </span>
                  </td>
                  <td>
                    {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '-'}
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      {payment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updatePaymentStatus(payment._id, 'success')}
                            className="btn btn-success btn-sm"
                          >
                            确认支付
                          </button>
                          <button
                            onClick={() => updatePaymentStatus(payment._id, 'failed')}
                            className="btn btn-error btn-sm"
                          >
                            标记失败
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        title="查看详情"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    暂无支付记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
