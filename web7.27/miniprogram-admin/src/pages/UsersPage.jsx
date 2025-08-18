import React, { useState, useEffect } from 'react';
import { UsersIcon, MagnifyingGlassIcon, EyeIcon, PlusIcon, PencilIcon, TrashIcon, PhoneIcon, ChartBarIcon, GiftIcon, CurrencyDollarIcon, CalendarDaysIcon, DocumentArrowDownIcon, StarIcon } from '@heroicons/react/24/outline';
import { app, ensureLogin } from '../utils/cloudbase';
import { ContentLoading, TableLoading, CardLoading } from '../components/LoadingSpinner';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [natureFilter, setNatureFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    nature: '',
    source: '',
    remark: '',
    contacts: [{ name: '', phone: '', address: '' }]
  });

  // 客户详情相关
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerPrepaidRecords, setCustomerPrepaidRecords] = useState([]);
  const [contactsParsed, setContactsParsed] = useState([]);
  
  // 客户统计和增强功能
  const [showStats, setShowStats] = useState(false);
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    newCustomersThisMonth: 0,
    activeCustomers: 0,
    totalRevenue: 0
  });
  const [exporting, setExporting] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedCustomerForPoints, setSelectedCustomerForPoints] = useState(null);
  const [pointsOperation, setPointsOperation] = useState({ type: 'add', amount: 0, reason: '' });

  // 新增/编辑表单字段
  const [customerForm, setCustomerForm] = useState({
    name: '',
    nature: '',
    source: '',
    remark: '',
    contacts: [{ name: '', phone: '', address: '' }]
  });
  
  const natureOptions = ['金额预存客户', '产品预存客户', '零售客户'];
  const sourceOptions = ['淘宝', '微信', '其他'];

  // 客户性质筛选选项
  const natureFilterOptions = [
    { value: '', label: '全部性质' },
    { value: '金额预存客户', label: '金额预存客户' },
    { value: '产品预存客户', label: '产品预存客户' },
    { value: '零售客户', label: '零售客户' }
  ];

  const pageSize = 10;

  // 获取客户统计数据
  const fetchCustomerStats = async () => {
    try {
      await ensureLogin();
      const db = app.database();
      
      // 获取客户总数
      const totalResult = await db.collection('customers').count();
      
      // 获取本月新增客户数
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const newCustomersResult = await db.collection('customers')
        .where({
          createTime: db.command.gte(currentMonth)
        })
        .count();
      
      // 获取活跃客户数（有订单记录的客户）
      const ordersResult = await db.collection('orders')
        .field({ customerId: true })
        .get();
      const activeCustomerIds = [...new Set(ordersResult.data.map(order => order.customerId))];
      
      // 计算总收入
      const revenueResult = await db.collection('orders')
        .where({ status: 'completed' })
        .get();
      const totalRevenue = revenueResult.data.reduce((sum, order) => sum + (order.total || order.totalPrice || 0), 0);
      
      setCustomerStats({
        totalCustomers: totalResult.total,
        newCustomersThisMonth: newCustomersResult.total,
        activeCustomers: activeCustomerIds.length,
        totalRevenue: totalRevenue
      });
    } catch (error) {
      console.error('获取客户统计失败:', error);
    }
  };

  // 获取客户列表
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      await ensureLogin();
      const db = app.database();
      let query = db.collection('customers');
      
      // 构建搜索条件
      if (searchTerm) {
        query = query.where(db.command.or([
          {
          name: db.RegExp({
            regexp: searchTerm,
            options: 'i'
          })
          },
          {
            phone: db.RegExp({
              regexp: searchTerm,
              options: 'i'
            })
          }
        ]));
      }

      // 客户性质筛选
      if (natureFilter) {
        query = query.where({ nature: natureFilter });
      }

      const countResult = await query.count();
      const total = countResult.total;
      setTotalPages(Math.ceil(total / pageSize));
      
      const result = await query
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .orderBy('createTime', 'desc')
        .get();
      
      setCustomers(result.data);
    } catch (error) {
      console.error('获取客户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    if (showStats) {
      fetchCustomerStats();
    }
  }, [currentPage, searchTerm, natureFilter, showStats]);

  // 导出客户数据
  const exportCustomers = async () => {
    try {
      setExporting(true);
      await ensureLogin();
      const db = app.database();
      
      let query = db.collection('customers');
      
      // 应用搜索和筛选条件
      if (searchTerm) {
        query = query.where(db.command.or([
          { name: db.RegExp({ regexp: searchTerm, options: 'i' }) },
          { phone: db.RegExp({ regexp: searchTerm, options: 'i' }) }
        ]));
      }
      
      if (natureFilter) {
        query = query.where({ nature: natureFilter });
      }
      
      const result = await query.orderBy('createTime', 'desc').get();
      
      // 构建CSV数据
      const csvData = [
        ['客户ID', '姓名', '客户性质', '手机号', '来源', '创建时间', '备注']
      ];
      
      result.data.forEach(customer => {
        csvData.push([
          customer._id,
          customer.name || '',
          customer.nature || '',
          getCustomerPhone(customer),
          customer.source || '',
          formatTime(customer.createTime),
          customer.remark || ''
        ]);
      });
      
      // 创建并下载CSV文件
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `客户数据_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败');
    } finally {
      setExporting(false);
    }
  };

  // 积分管理
  const handlePointsOperation = async () => {
    if (!selectedCustomerForPoints || !pointsOperation.amount || !pointsOperation.reason) {
      alert('请填写完整信息');
      return;
    }
    
    try {
      await ensureLogin();
      const db = app.database();
      
      // 更新客户积分
      const currentPoints = selectedCustomerForPoints.points || 0;
      const newPoints = pointsOperation.type === 'add' 
        ? currentPoints + parseInt(pointsOperation.amount)
        : Math.max(0, currentPoints - parseInt(pointsOperation.amount));
      
      await db.collection('customers').doc(selectedCustomerForPoints._id).update({
        points: newPoints,
        updateTime: new Date()
      });
      
      // 记录积分变动历史
      await db.collection('pointsHistory').add({
        customerId: selectedCustomerForPoints._id,
        customerName: selectedCustomerForPoints.name,
        type: pointsOperation.type,
        amount: parseInt(pointsOperation.amount),
        reason: pointsOperation.reason,
        beforePoints: currentPoints,
        afterPoints: newPoints,
        createTime: new Date()
      });
      
      setShowPointsModal(false);
      setSelectedCustomerForPoints(null);
      setPointsOperation({ type: 'add', amount: 0, reason: '' });
      fetchCustomers();
      alert('积分操作成功');
    } catch (error) {
      console.error('积分操作失败:', error);
      alert('积分操作失败');
    }
  };

  // 查看客户详情
  const viewCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
    
    // 解析联系人信息
    try {
      let contacts = [];
      if (customer.contacts) {
        if (typeof customer.contacts === 'string') {
          contacts = JSON.parse(customer.contacts);
        } else {
          contacts = customer.contacts;
        }
      }
      setContactsParsed(Array.isArray(contacts) ? contacts : [contacts].filter(Boolean));
    } catch (e) {
      setContactsParsed([]);
    }
    
    // 查询订单历史
    try {
      await ensureLogin();
      const db = app.database();
      const ordersRes = await db.collection('orders')
        .where({ customerId: customer._id })
        .orderBy('createTime', 'desc')
        .limit(10)
        .get();
      setCustomerOrders(ordersRes.data);
    } catch (e) {
      setCustomerOrders([]);
    }

    // 查询预存记录
    try {
      await ensureLogin();
      const db = app.database();
      const prepaidRes = await db.collection('prepaidRecords')
        .where({ customerId: customer._id })
        .orderBy('createTime', 'desc')
        .limit(10)
        .get();
      setCustomerPrepaidRecords(prepaidRes.data);
    } catch (e) {
      setCustomerPrepaidRecords([]);
    }
  };

  // 新增客户
  const addCustomer = async () => {
    if (!customerForm.name || !customerForm.nature || !customerForm.source) {
      alert('请填写所有必填项');
      return;
    }
    
    if (!customerForm.contacts[0].name || !customerForm.contacts[0].phone) {
      alert('请填写联系人姓名和电话');
      return;
    }
    
    try {
      await ensureLogin();
      const db = app.database();
      await db.collection('customers').add({
        name: customerForm.name,
        nature: customerForm.nature,
        source: customerForm.source,
        remark: customerForm.remark || '',
        contacts: JSON.stringify(customerForm.contacts),
        phone: customerForm.contacts[0].phone,
        createTime: new Date(),
        updateTime: new Date()
      });
      
      // 重置表单
      setCustomerForm({
        name: '',
        nature: '',
        source: '',
        remark: '',
        contacts: [{ name: '', phone: '', address: '' }]
      });
      setShowAddModal(false);
      fetchCustomers();
      alert('添加成功');
    } catch (error) {
      console.error('添加客户失败:', error);
      alert('添加失败');
    }
  };

  // 编辑客户
  const startEditCustomer = (customer) => {
    setEditCustomer(customer);
    let contacts = [{ name: '', phone: '', address: '' }];
    try {
      if (customer.contacts) {
        contacts = typeof customer.contacts === 'string' ? JSON.parse(customer.contacts) : customer.contacts;
        if (!Array.isArray(contacts)) contacts = [contacts];
      }
    } catch { 
      contacts = [{ name: '', phone: '', address: '' }]; 
    }
    
    setCustomerForm({
      name: customer.name || '',
      nature: customer.nature || '',
      source: customer.source || '',
      remark: customer.remark || '',
      contacts
    });
    setShowEditModal(true);
  };

  const updateCustomer = async () => {
    if (!editCustomer) return;
    if (!customerForm.name || !customerForm.nature || !customerForm.source || !customerForm.contacts[0].name || !customerForm.contacts[0].phone) {
      alert('请填写所有必填项');
      return;
    }
    
    try {
      await ensureLogin();
      const db = app.database();
      await db.collection('customers').doc(editCustomer._id).update({
        name: customerForm.name,
        nature: customerForm.nature,
        source: customerForm.source,
        remark: customerForm.remark || '',
        contacts: JSON.stringify(customerForm.contacts),
        phone: customerForm.contacts[0].phone,
        updateTime: new Date()
      });
      
      setEditCustomer(null);
      setShowEditModal(false);
      fetchCustomers();
      alert('更新成功');
    } catch (error) {
      console.error('编辑客户失败:', error);
      alert('更新失败');
    }
  };

  // 删除客户
  const deleteCustomer = async (customer) => {
    if (!window.confirm('确定要删除该客户吗？删除后无法恢复。')) return;
    
    try {
      await ensureLogin();
      const db = app.database();
      await db.collection('customers').doc(customer._id).remove();
      fetchCustomers();
      alert('删除成功');
    } catch (error) {
      console.error('删除客户失败:', error);
      alert('删除失败');
    }
  };



  // 搜索处理
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCustomers();
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '未知';
    return new Date(timestamp).toLocaleString();
  };

  // 获取客户手机号 - 修复显示逻辑
  const getCustomerPhone = (customer) => {
    // 优先使用phone字段
    if (customer.phone) {
      return customer.phone;
    }
    
    // 如果没有phone字段，尝试从contacts中获取
    if (customer.contacts) {
      try {
        let contacts = [];
        if (typeof customer.contacts === 'string') {
          contacts = JSON.parse(customer.contacts);
        } else {
          contacts = customer.contacts;
        }
        
        if (Array.isArray(contacts) && contacts.length > 0 && contacts[0].phone) {
          return contacts[0].phone;
        }
      } catch (e) {
        console.error('解析contacts失败:', e);
      }
    }
    
    return '未设置';
  };

  // 添加联系人
  const addContact = () => {
    setCustomerForm({
      ...customerForm,
      contacts: [...customerForm.contacts, { name: '', phone: '', address: '' }]
    });
  };

  // 删除联系人
  const removeContact = (index) => {
    if (customerForm.contacts.length > 1) {
      const newContacts = customerForm.contacts.filter((_, i) => i !== index);
      setCustomerForm({ ...customerForm, contacts: newContacts });
    }
  };

  // 更新联系人
  const updateContact = (index, field, value) => {
    const newContacts = [...customerForm.contacts];
    newContacts[index][field] = value;
    setCustomerForm({ ...customerForm, contacts: newContacts });
  };

  if (loading) {
    return <ContentLoading text="客户数据加载中..." />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <UsersIcon className="w-8 h-8 mr-3" />
          客户管理
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
            onClick={exportCustomers}
            disabled={exporting}
          >
            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
            {exporting ? '导出中...' : '导出数据'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <PlusIcon className="w-5 h-5 mr-2" />新增客户
          </button>
        </div>
      </div>
      
      {/* 客户统计卡片 */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-base-100 shadow rounded-lg p-4">
            <div className="flex items-center">
              <UsersIcon className="w-8 h-8 text-primary mr-3" />
              <div>
                <p className="text-sm text-gray-500">客户总数</p>
                <p className="text-2xl font-bold">{customerStats.totalCustomers}</p>
              </div>
            </div>
          </div>
          <div className="bg-base-100 shadow rounded-lg p-4">
            <div className="flex items-center">
              <CalendarDaysIcon className="w-8 h-8 text-success mr-3" />
              <div>
                <p className="text-sm text-gray-500">本月新增</p>
                <p className="text-2xl font-bold">{customerStats.newCustomersThisMonth}</p>
              </div>
            </div>
          </div>
          <div className="bg-base-100 shadow rounded-lg p-4">
            <div className="flex items-center">
              <StarIcon className="w-8 h-8 text-warning mr-3" />
              <div>
                <p className="text-sm text-gray-500">活跃客户</p>
                <p className="text-2xl font-bold">{customerStats.activeCustomers}</p>
              </div>
            </div>
          </div>
          <div className="bg-base-100 shadow rounded-lg p-4">
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-8 h-8 text-info mr-3" />
              <div>
                <p className="text-sm text-gray-500">总收入</p>
                <p className="text-2xl font-bold">¥{customerStats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 搜索栏 */}
      <div className="bg-base-100 shadow rounded-lg p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
          <div className="form-control flex-1 min-w-64">
            <div className="input-group">
              <input
                type="text"
                placeholder="搜索客户姓名或手机号..."
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
              value={natureFilter}
              onChange={(e) => {
                setNatureFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              {natureFilterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>
      
      {/* 客户列表 */}
      <div className="bg-base-100 shadow rounded-lg overflow-hidden">
        {customers.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">暂无客户数据</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>客户ID</th>
                    <th>姓名</th>
                    <th>客户性质</th>
                    <th>手机号</th>
                    <th>积分</th>
                    <th>来源</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer._id}>
                      <td className="font-mono text-sm">{customer._id?.slice(-8)}</td>
                      <td className="font-semibold">{customer.name}</td>
                      <td>
                        <span className={`badge ${
                          customer.nature === '金额预存客户' ? 'badge-success' :
                          customer.nature === '产品预存客户' ? 'badge-info' :
                          'badge-warning'
                        }`}>
                          {customer.nature}
                        </span>
                      </td>
                      <td>{getCustomerPhone(customer)}</td>
                      <td>
                        <div className="flex items-center">
                          <StarIcon className="w-4 h-4 text-warning mr-1" />
                          <span className="font-semibold">{customer.points || 0}</span>
                        </div>
                      </td>
                      <td>{customer.source || '未知'}</td>
                      <td>{formatTime(customer.createTime)}</td>
                      <td>
                        <div className="flex gap-1">
                        <button
                          onClick={() => viewCustomer(customer)}
                          className="btn btn-sm btn-ghost"
                          title="查看详情"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomerForPoints(customer);
                            setShowPointsModal(true);
                          }}
                          className="btn btn-sm btn-ghost"
                          title="积分管理"
                        >
                          <GiftIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEditCustomer(customer)}
                          className="btn btn-sm btn-ghost"
                          title="编辑"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCustomer(customer)}
                            className="btn btn-sm btn-ghost"
                          title="删除"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
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
      {/* 客户详情模态框 */}
      {showCustomerModal && selectedCustomer && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">客户详情</h3>
            {/* 基本信息 */}
            <div className="mb-4">
              <div className="font-bold mb-2">基本信息</div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-semibold">姓名：</span>{selectedCustomer.name || '未设置'}</div>
                <div><span className="font-semibold">手机号：</span>{selectedCustomer.phone || '未设置'}</div>
                <div><span className="font-semibold">来源：</span>{selectedCustomer.source || '未设置'}</div>
                <div>
                  <span className="font-semibold">积分：</span>
                  <span className="inline-flex items-center ml-1">
                    <StarIcon className="w-4 h-4 text-warning mr-1" />
                    {selectedCustomer.points || 0}
                  </span>
                </div>
                <div><span className="font-semibold">创建时间：</span>{formatTime(selectedCustomer.createTime || selectedCustomer.createDate)}</div>
                {selectedCustomer.nature && <div><span className="font-semibold">客户类型：</span>{selectedCustomer.nature}</div>}
                {selectedCustomer.natureCategory && <div><span className="font-semibold">客户分类：</span>{selectedCustomer.natureCategory}</div>}
                {selectedCustomer.remark && <div className="col-span-2"><span className="font-semibold">备注：</span>{selectedCustomer.remark}</div>}
              </div>
            </div>
            {/* 联系人信息 */}
            <div className="mb-4">
              <div className="font-bold mb-2">联系人信息</div>
              {contactsParsed.length === 0 ? (
                <div className="text-gray-500">暂无联系人信息</div>
              ) : (
                <div className="space-y-2">
                  {contactsParsed.map((c, idx) => (
                    <div key={idx} className="p-2 bg-base-200 rounded">
                      <div><span className="font-semibold">姓名：</span>{c.name || c.contactName || '-'}</div>
                      <div><span className="font-semibold">电话：</span>{c.phone || c.contactPhone || '-'}</div>
                      <div><span className="font-semibold">地址：</span>{c.address || c.addressDetail || c.detail || '-'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* 订单历史 */}
            <div>
              <div className="font-bold mb-2">订单历史</div>
              {customerOrders.length === 0 ? (
                <div className="text-gray-500">暂无订单</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>订单号</th>
                        <th>下单时间</th>
                        <th>金额</th>
                        <th>状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerOrders.map(order => (
                        <tr key={order._id}>
                          <td>{order.id || order._id}</td>
                          <td>{formatTime(order.createTime || order.date)}</td>
                          <td>¥{order.total || (order.totalPrice ? order.totalPrice.toFixed(2) : '0.00')}</td>
                          <td>
                            <span className={`badge ${order.status === 'completed' ? 'badge-success' : order.status === 'pending' ? 'badge-warning' : 'badge-info'}`}>
                              {order.status === 'completed' ? '已完成' : order.status === 'pending' ? '待付款' : order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {/* 预存记录 */}
            <div>
              <div className="font-bold mb-2">预存记录</div>
              {customerPrepaidRecords.length === 0 ? (
                <div className="text-gray-500">暂无预存记录</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>记录ID</th>
                        <th>预存金额</th>
                        <th>预存时间</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerPrepaidRecords.map(record => (
                        <tr key={record._id}>
                          <td>{record._id}</td>
                          <td>¥{record.amount || '0.00'}</td>
                          <td>{formatTime(record.createTime || record.date)}</td>
                          <td>
                            -
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowCustomerModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
      {/* 新增客户模态框 */}
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg mb-4">新增客户</h3>
            <div className="space-y-4">
              <div className="font-bold">基本信息</div>
              <div className="form-control">
                <label className="label"><span className="label-text">客户名称 *</span></label>
                <input type="text" className="input input-bordered" value={customerForm.name} onChange={e => setCustomerForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">客户性质 *</span></label>
                <select className="select select-bordered" value={customerForm.nature} onChange={e => setCustomerForm(f => ({ ...f, nature: e.target.value }))}>
                  <option value="">请选择客户性质</option>
                  {natureOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">客户来源 *</span></label>
                <select className="select select-bordered" value={customerForm.source} onChange={e => setCustomerForm(f => ({ ...f, source: e.target.value }))}>
                  <option value="">请选择客户来源</option>
                  {sourceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">备注</span></label>
                <textarea className="textarea textarea-bordered" value={customerForm.remark} onChange={e => setCustomerForm(f => ({ ...f, remark: e.target.value }))} />
              </div>
              <div className="font-bold">联系人信息</div>
              <div className="form-control">
                <label className="label"><span className="label-text">姓名 *</span></label>
                <input type="text" className="input input-bordered" value={customerForm.contacts[0].name} onChange={e => updateContact(0, 'name', e.target.value)} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">电话 *</span></label>
                <input type="text" className="input input-bordered" value={customerForm.contacts[0].phone} onChange={e => updateContact(0, 'phone', e.target.value)} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">地址</span></label>
                <input type="text" className="input input-bordered" value={customerForm.contacts[0].address} onChange={e => updateContact(0, 'address', e.target.value)} />
              </div>
              <button className="btn btn-sm btn-ghost" onClick={addContact}>
                <PlusIcon className="w-4 h-4 mr-1" />添加联系人
              </button>
              <div className="flex justify-end gap-2">
              <button className="btn" onClick={() => setShowAddModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={addCustomer}>添加</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 编辑客户模态框 */}
      {showEditModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg mb-4">编辑客户</h3>
            <div className="space-y-4">
              <div className="font-bold">基本信息</div>
              <div className="form-control">
                <label className="label"><span className="label-text">客户名称 *</span></label>
                <input type="text" className="input input-bordered" value={customerForm.name} onChange={e => setCustomerForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">客户性质 *</span></label>
                <select className="select select-bordered" value={customerForm.nature} onChange={e => setCustomerForm(f => ({ ...f, nature: e.target.value }))}>
                  <option value="">请选择客户性质</option>
                  {natureOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">客户来源 *</span></label>
                <select className="select select-bordered" value={customerForm.source} onChange={e => setCustomerForm(f => ({ ...f, source: e.target.value }))}>
                  <option value="">请选择客户来源</option>
                  {sourceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">备注</span></label>
                <textarea className="textarea textarea-bordered" value={customerForm.remark} onChange={e => setCustomerForm(f => ({ ...f, remark: e.target.value }))} />
              </div>
              <div className="font-bold">联系人信息</div>
              {customerForm.contacts.map((contact, index) => (
                <div key={index} className="form-control">
                  <label className="label"><span className="label-text">联系人 {index + 1}</span></label>
                  <div className="flex gap-2">
                    <input type="text" className="input input-bordered flex-1" value={contact.name} onChange={e => updateContact(index, 'name', e.target.value)} />
                    <input type="text" className="input input-bordered" value={contact.phone} onChange={e => updateContact(index, 'phone', e.target.value)} />
                    <input type="text" className="input input-bordered" value={contact.address} onChange={e => updateContact(index, 'address', e.target.value)} />
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => removeContact(index)}>
                      <TrashIcon className="w-4 h-4" />
                    </button>
              </div>
                </div>
              ))}
              <button className="btn btn-sm btn-ghost" onClick={addContact}>
                <PlusIcon className="w-4 h-4 mr-1" />添加联系人
              </button>
              <div className="flex justify-end gap-2">
                <button className="btn" onClick={() => setShowEditModal(false)}>取消</button>
                <button className="btn btn-primary" onClick={updateCustomer}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 积分管理模态框 */}
      {showPointsModal && selectedCustomerForPoints && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">积分管理</h3>
            <div className="mb-4">
              <p><span className="font-semibold">客户：</span>{selectedCustomerForPoints.name}</p>
              <p><span className="font-semibold">当前积分：</span>
                <span className="inline-flex items-center ml-1">
                  <StarIcon className="w-4 h-4 text-warning mr-1" />
                  {selectedCustomerForPoints.points || 0}
                </span>
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">操作类型</span></label>
                <select 
                  className="select select-bordered"
                  value={pointsOperation.type}
                  onChange={(e) => setPointsOperation({...pointsOperation, type: e.target.value})}
                >
                  <option value="add">增加积分</option>
                  <option value="subtract">扣减积分</option>
                </select>
              </div>
              
              <div className="form-control">
                <label className="label"><span className="label-text">积分数量</span></label>
                <input 
                  type="number" 
                  className="input input-bordered"
                  value={pointsOperation.amount}
                  onChange={(e) => setPointsOperation({...pointsOperation, amount: e.target.value})}
                  min="1"
                />
              </div>
              
              <div className="form-control">
                <label className="label"><span className="label-text">操作原因</span></label>
                <textarea 
                  className="textarea textarea-bordered"
                  value={pointsOperation.reason}
                  onChange={(e) => setPointsOperation({...pointsOperation, reason: e.target.value})}
                  placeholder="请输入积分变动原因..."
                />
              </div>
            </div>
            
            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => {
                  setShowPointsModal(false);
                  setSelectedCustomerForPoints(null);
                  setPointsOperation({ type: 'add', amount: 0, reason: '' });
                }}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handlePointsOperation}>
                确认操作
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;