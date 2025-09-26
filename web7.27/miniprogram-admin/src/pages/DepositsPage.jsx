import React, { useState, useEffect } from 'react';
import { CreditCardIcon, MagnifyingGlassIcon, EyeIcon, PlusIcon, TrashIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { app, ensureLogin } from '../utils/cloudbase';

const DepositsPage = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDeposit, setEditDeposit] = useState(null);
  const [newDeposit, setNewDeposit] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    amount: '',
    quantity: '',
    productName: '',
    type: 'cash',
    description: '',
    expireDate: ''
  });

  // 新增客户列表状态
  const [customers, setCustomers] = useState([]);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);

  // 当前详情中该客户的全部预存记录
  const [customerDeposits, setCustomerDeposits] = useState([]);

  // 固定列显示（删除列显示功能）
  const visibleCols = {
    id: false,
    name: true,
    phone: true,
    type: true,
    product: true,
    amountOrQty: true,
    balance: true,
    expire: false,
    created: true,
    actions: true,
  };

  // 列显示持久化功能移除

  const pageSize = 10;

  // 与库存管理页一致：本地筛选与分页
  const filteredDeposits = React.useMemo(() => {
    const keyword = (searchTerm || '').trim().toLowerCase();
    const type = (typeFilter || '').trim();
    let list = deposits || [];
    // 类型筛选（'' 表示全部）
    if (type) {
      list = list.filter(item => item.type === type);
    }
    // 关键词筛选（姓名/电话/产品名/ID后8位）
    if (keyword) {
      list = list.filter((item) => {
        const name = (item.customerName || '').toLowerCase();
        const phone = String(item.customerPhone || '').toLowerCase();
        const productName = (item.productName || '').toLowerCase();
        const shortId = (item._id ? String(item._id).slice(-8) : '').toLowerCase();
        return (
          name.includes(keyword) ||
          phone.includes(keyword) ||
          productName.includes(keyword) ||
          shortId.includes(keyword)
        );
      });
    }
    return list;
  }, [deposits, searchTerm, typeFilter]);

  const computedTotalPages = React.useMemo(() => {
    return Math.max(1, Math.ceil((filteredDeposits.length || 0) / pageSize));
  }, [filteredDeposits, pageSize]);

  const paginatedDeposits = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDeposits.slice(start, start + pageSize);
  }, [filteredDeposits, currentPage, pageSize]);


  const typeOptions = [
    { value: '', label: '全部类型' },
    { value: 'cash', label: '金额预存' },
    { value: 'product', label: '产品预存' }
  ];



  const typeLabels = {
    cash: '金额预存',
    product: '产品预存'
  };

  // 获取客户列表
  const fetchCustomers = async () => {
    try {
      await ensureLogin();
      const db = app.database();
      const result = await db.collection('customers')
        .orderBy('createTime', 'desc')
        .get();
      setCustomers(result.data);
    } catch (error) {
      console.error('获取客户列表失败:', error);
    }
  };

  // 获取预存记录列表
  const fetchDeposits = async () => {
    try {
      setLoading(true);
      await ensureLogin();
      const db = app.database();

      // 构建查询条件
      let query = db.collection('prepaidRecords');
      
      // 搜索条件：客户姓名或手机号
      if (searchTerm) {
        query = query.where(db.command.or([
          {
            customerName: db.RegExp({
              regexp: searchTerm,
              options: 'i'
            })
          },
          {
            customerPhone: db.RegExp({
              regexp: searchTerm,
              options: 'i'
            })
          }
        ]));
      }


      // 类型筛选
      if (typeFilter) {
        query = query.where({ type: typeFilter });
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

      setDeposits(result.data);
    } catch (error) {
      console.error('获取预存记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
    fetchCustomers();
  }, [currentPage, typeFilter]);

  // 全局刷新函数，供其他页面调用
  useEffect(() => {
    window.refreshPrepaidRecords = () => {
      fetchDeposits();
    };
    
    return () => {
      delete window.refreshPrepaidRecords;
    };
  }, []);

  // 移除输入即搜的远程请求，输入仅做本地筛选；按回车或点击按钮再触发远程加载

  // 取消输入即搜，改为仅在 Enter 或点击搜索时触发

  // 查看预存记录详情（为产品型记录补全产品名称）
  const viewDeposit = async (deposit) => {
    let enriched = deposit;
    try {
      if (deposit && deposit.type === 'product' && !deposit.productName && deposit.productId) {
        await ensureLogin();
        const db = app.database();
        const res = await db.collection('products').doc(deposit.productId).get();
        const product = Array.isArray(res.data) ? res.data[0] : null;
        const nameFromProduct = product && (product.name || product.title || product.productName);
        enriched = { ...deposit, productName: nameFromProduct || '产品预存' };
      }
      // 拉取该客户的所有预存记录按时间倒序
      if (deposit && (deposit.customerId || deposit.customerPhone || deposit.customerName)) {
        const db = app.database();
        let q = db.collection('prepaidRecords');
        if (deposit.customerId) {
          q = q.where({ customerId: deposit.customerId });
        } else if (deposit.customerPhone) {
          q = q.where({ customerPhone: deposit.customerPhone });
        } else if (deposit.customerName) {
          q = q.where({ customerName: deposit.customerName });
        }
        const all = await q.orderBy('createTime', 'desc').limit(100).get();
        setCustomerDeposits(all.data || []);
      } else {
        setCustomerDeposits([]);
      }
    } catch (e) {
      console.warn('补全产品名称失败，将使用兜底文案:', e);
      enriched = { ...deposit, productName: deposit.productName || '产品预存' };
      setCustomerDeposits([]);
    }
    setSelectedDeposit(enriched);
    setShowDepositModal(true);
  };

  // 编辑预存记录
  const startEditDeposit = (deposit) => {
    setEditDeposit(deposit);
    setNewDeposit({
      customerId: deposit.customerId || '',
      customerName: deposit.customerName || '',
      customerPhone: deposit.customerPhone || '',
      amount: deposit.amount || '',
      quantity: deposit.quantity || '',
      productName: deposit.productName || '',
      type: deposit.type || 'cash',
      description: deposit.description || '',
      expireDate: deposit.expireDate ? new Date(deposit.expireDate).toISOString().split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  // 更新预存记录
  const updateDeposit = async () => {
    try {
      if (!editDeposit) return;
      
      if (!newDeposit.customerName) {
        alert('请填写客户姓名');
        return;
      }

      if (newDeposit.type === 'cash' && !newDeposit.amount) {
        alert('请填写预存金额');
        return;
      }

      if (newDeposit.type === 'product' && (!newDeposit.productName || !newDeposit.quantity)) {
        alert('请填写产品名称和数量');
        return;
      }

      await ensureLogin();
      const db = app.database();
      
      const updateData = {
        customerName: newDeposit.customerName,
        customerPhone: newDeposit.customerPhone,
        updateTime: new Date()
      };

      if (newDeposit.type === 'cash') {
        updateData.amount = parseFloat(newDeposit.amount);
        updateData.balance = parseFloat(newDeposit.amount);
      } else {
        updateData.productName = newDeposit.productName;
        updateData.quantity = parseInt(newDeposit.quantity);
        updateData.balance = parseInt(newDeposit.quantity);
      }

      if (newDeposit.expireDate) {
        updateData.expireDate = new Date(newDeposit.expireDate);
      }

      await db.collection('prepaidRecords').doc(editDeposit._id).update(updateData);

      setEditDeposit(null);
      setShowEditModal(false);
      // 重置表单
      setNewDeposit({
        customerId: '',
        customerName: '',
        customerPhone: '',
        amount: '',
        quantity: '',
        productName: '',
        type: 'cash',
        description: '',
        expireDate: ''
      });

      // 刷新列表
      fetchDeposits();
      alert('更新成功');
    } catch (error) {
      console.error('更新预存记录失败:', error);
      alert('更新失败');
    }
  };

  // 删除预存记录
  const deleteDeposit = async (deposit) => {
    if (!window.confirm('确定要删除该预存记录吗？')) return;
    
    try {
      await ensureLogin();
      const db = app.database();
      await db.collection('prepaidRecords').doc(deposit._id).remove();
      fetchDeposits();
      alert('删除成功');
    } catch (error) {
      console.error('删除预存记录失败:', error);
      alert('删除失败');
    }
  };

  // 添加预存记录
  const addDeposit = async () => {
    try {
      if (!newDeposit.customerName) {
        alert('请填写客户姓名');
        return;
      }

      if (!newDeposit.customerPhone) {
        alert('请填写客户电话');
        return;
      }

      if (newDeposit.type === 'cash' && !newDeposit.amount) {
        alert('请填写预存金额');
        return;
      }

      if (newDeposit.type === 'product' && (!newDeposit.productName || !newDeposit.quantity)) {
        alert('请填写产品名称和数量');
        return;
      }

      await ensureLogin();
      const db = app.database();
      
      let customerId = newDeposit.customerId;
      
      // 如果没有客户ID，则查找或创建客户记录
      if (!customerId) {
        // 先查找是否已存在相同电话的客户
        const existingCustomers = await db.collection('customers')
          .where({
            $or: [
              { phone: newDeposit.customerPhone },
              { 'contacts.phone': newDeposit.customerPhone }
            ]
          })
          .get();
        
        if (existingCustomers.data.length > 0) {
          // 使用已存在的客户
          customerId = existingCustomers.data[0]._id;
          console.log('找到已存在客户:', existingCustomers.data[0].name);
        } else {
          // 创建新客户记录
          const customerData = {
            name: newDeposit.customerName,
            phone: newDeposit.customerPhone,
            address: newDeposit.customerAddress || '',
            contacts: [{
              name: newDeposit.customerName,
              phone: newDeposit.customerPhone,
              isPrimary: true
            }],
            createTime: new Date(),
            updateTime: new Date(),
            status: 'active'
          };
          
          const customerResult = await db.collection('customers').add(customerData);
          customerId = customerResult.id;
          console.log('创建新客户记录:', newDeposit.customerName);
        }
      }
      
      const addData = {
        customerId: customerId,
        customerName: newDeposit.customerName,
        customerPhone: newDeposit.customerPhone,
        customerAddress: newDeposit.customerAddress || '',
        type: newDeposit.type,
        status: 'active',
        source: 'manual',
        createTime: new Date(),
        updateTime: new Date()
      };

      if (newDeposit.type === 'cash') {
        addData.amount = parseFloat(newDeposit.amount);
        addData.balance = parseFloat(newDeposit.amount);
        addData.productName = '预存金额';
      } else {
        addData.productName = newDeposit.productName;
        addData.quantity = parseInt(newDeposit.quantity);
        addData.balance = parseInt(newDeposit.quantity);
      }

      if (newDeposit.expireDate) {
        addData.expireDate = new Date(newDeposit.expireDate);
      }

      if (newDeposit.description) {
        addData.description = newDeposit.description;
      }

      await db.collection('prepaidRecords').add(addData);

      // 重置表单
      setNewDeposit({
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        amount: '',
        quantity: '',
        productName: '',
        type: 'cash',
        description: '',
        expireDate: ''
      });
      setShowAddModal(false);

      // 刷新列表
      fetchDeposits();
      alert('添加成功');
    } catch (error) {
      console.error('添加预存记录失败:', error);
      alert('添加失败: ' + error.message);
    }
  };

  // 选择客户
  const selectCustomer = (customer) => {
    setNewDeposit({
      ...newDeposit,
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone || (customer.contacts && customer.contacts[0] ? customer.contacts[0].phone : ''),
      customerAddress: customer.address || ''
    });
    setShowCustomerSelect(false);
  };

  // 搜索处理
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDeposits();
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '未知';
    const d = new Date(timestamp);
    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString();
    return (
      <span className="whitespace-pre leading-tight inline-block text-left">
        {date}
        <br />
        {time}
      </span>
    );
  };

  // 格式化金额
  const formatAmount = (amount) => {
    return typeof amount === 'number' ? amount.toFixed(2) : '0.00';
  };

  // 表格加载组件
  const TableLoading = () => (
    <div className="flex items-center justify-center py-12">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <CreditCardIcon className="w-8 h-8 mr-3" />
          预存记录管理
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          添加预存记录
        </button>
      </div>

      {/* 搜索和筛选栏（采用库存页布局 + 商品页筛选样式） */}
      <div className="bg-base-100 shadow rounded-lg p-4 mb-6">
        <form className="flex gap-4 flex-wrap items-center" onSubmit={(e) => e.preventDefault()}>
          {/* 搜索输入，右侧放大镜按钮 */}
          <div className="relative flex-1 min-w-64">
              <input
                type="text"
                placeholder="搜索客户姓名或手机号..."
              className="input input-bordered w-full pr-12"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setCurrentPage(1);
                  fetchDeposits();
                }
              }}
              />
            <button
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2 btn btn-ghost btn-square"
              onClick={() => { setCurrentPage(1); fetchDeposits(); }}
              aria-label="搜索"
            >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>
            </div>

          {/* 类型筛选（商品页同款样式） */}
          <div className="form-control">
            <select
              className="select select-bordered"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {/* 预存记录列表 */}
      <div className="bg-base-100 shadow rounded-lg overflow-hidden">
        {loading ? (
          <TableLoading />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full table-fixed">
                <thead>
                  <tr>
                    {visibleCols.id && <th className="w-24">记录ID</th>}
                    {visibleCols.name && <th className="w-24">客户姓名</th>}
                    {visibleCols.phone && <th className="w-32">客户电话</th>}
                    {visibleCols.type && <th className="w-20 text-sm whitespace-nowrap">类型</th>}
                    {visibleCols.product && <th className="w-20">产品</th>}
                    {visibleCols.amountOrQty && <th className="w-24">预存数量</th>}
                    {visibleCols.balance && <th className="w-16">剩余</th>}
                    {visibleCols.expire && <th className="w-28">过期时间</th>}
                    {visibleCols.created && <th className="w-16 text-left">创建时间</th>}
                    {visibleCols.actions && <th className="w-24">操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredDeposits.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-12">
                        <CreditCardIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">暂无预存记录数据</p>
                      </td>
                    </tr>
                  ) : (
                  paginatedDeposits.map((deposit) => (
                    <tr key={deposit._id}>
                      {visibleCols.id && <td className="font-mono text-sm">{deposit._id?.slice(-8)}</td>}
                      {visibleCols.name && <td>{deposit.customerName || '未知客户'}</td>}
                      {visibleCols.phone && <td>{(() => {
                        console.log(`记录 ${deposit.customerName} 电话数据:`, {
                          _id: deposit._id,
                          customerPhone: deposit.customerPhone,
                          phone: deposit.phone,
                          allFields: Object.keys(deposit),
                          rawData: deposit
                        });
                        
                        // 强制刷新检查
                        const phoneValue = deposit.customerPhone || deposit.phone || '未设置';
                        console.log(`${deposit.customerName} 最终显示电话: ${phoneValue}`);
                        
                        return phoneValue;
                      })()}</td>}
                      {visibleCols.type && <td className="text-sm whitespace-nowrap">{typeLabels[deposit.type] || deposit.type}</td>}
                      {visibleCols.product && <td>{deposit.type === 'product' ? (deposit.productName || '产品预存') : '-'}</td>}
                      {visibleCols.amountOrQty && <td>{deposit.quantity || 0}</td>}
                      {visibleCols.balance && <td className="font-bold">{deposit.type === 'cash' ? formatAmount(deposit.balance || 0) : (deposit.balance || 0)}</td>}
                      {visibleCols.expire && <td>{deposit.expireDate ? new Date(deposit.expireDate).toLocaleDateString() : '无期限'}</td>}
                      {visibleCols.created && <td className="w-16 text-left align-top">{formatTime(deposit.createTime)}</td>}
                      {visibleCols.actions && (
                        <td className="whitespace-nowrap">
                        <button
                          onClick={() => viewDeposit(deposit)}
                          className="btn btn-sm btn-ghost"
                          title="查看详情"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEditDeposit(deposit)}
                          className="btn btn-sm btn-ghost"
                          title="编辑"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteDeposit(deposit)}
                          className="btn btn-sm btn-ghost"
                          title="删除"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                      )}
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {computedTotalPages > 1 && (
              <div className="flex justify-center p-4">
                <div className="join">
                  <button
                    className="join-item btn"
                    disabled={loading || currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    上一页
                  </button>
                  <button className="join-item btn btn-active">
                    第 {currentPage} 页，共 {computedTotalPages} 页
                  </button>
                  <button
                    className="join-item btn"
                    disabled={loading || currentPage === computedTotalPages}
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

      {/* 预存记录详情模态框 */}
      {showDepositModal && selectedDeposit && (
        <div className="modal modal-open">
          <div className="modal-box">
            <button
              type="button"
              className="absolute top-4 right-4 p-1 hover:bg-gray-200 rounded-full transition-colors"
              onClick={() => setShowDepositModal(false)}
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
            <h3 className="font-bold text-lg mb-4 mr-8">预存详情</h3>
            <div className="space-y-3">
              {/* 记录ID隐藏 */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold">客户姓名</span>
                </label>
                <p>{selectedDeposit.customerName || '未知客户'}</p>
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-semibold">客户电话</span>
                </label>
                <p>{selectedDeposit.customerPhone || '未设置'}</p>
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-semibold">类型</span>
                </label>
                <p>{typeLabels[selectedDeposit.type] || selectedDeposit.type}</p>
              </div>
              {selectedDeposit.type === 'product' && (
              <div>
                <label className="label">
                    <span className="label-text font-semibold">产品名称</span>
                  </label>
                  <p>{selectedDeposit.productName || '产品预存'}</p>
                </div>
              )}
              <div>
                <label className="label">
                  <span className="label-text font-semibold">预存数量</span>
                </label>
                <p>{selectedDeposit.quantity || 0}</p>
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-semibold">剩余</span>
                </label>
                <p className="text-lg font-bold">{selectedDeposit.balance || 0}</p>
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-semibold">过期时间</span>
                </label>
                <p>{selectedDeposit.expireDate ? new Date(selectedDeposit.expireDate).toLocaleDateString() : '无期限'}</p>
              </div>
              {/* 状态显示移除 */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold">创建时间</span>
                </label>
                <p>{formatTime(selectedDeposit.createTime)}</p>
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-semibold">更新时间</span>
                </label>
                <p>{formatTime(selectedDeposit.updateTime)}</p>
              </div>
              {selectedDeposit.description && (
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">描述</span>
                  </label>
                  <p className="p-2 bg-base-200 rounded">{selectedDeposit.description}</p>
                </div>
              )}

              {/* 客户所有预存记录列表 */}
              {customerDeposits.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-lg mb-3">该客户的所有预存记录</h4>
                  {/* 产品预存记录表格 */}
                  {customerDeposits.filter(record => record.type === 'product').length > 0 && (
                    <div className="mb-6">
                      <h5 className="font-medium text-md mb-2 text-primary">产品预存记录</h5>
                      <div className="overflow-x-auto">
                        <table className="table table-sm table-zebra w-full">
                          <thead>
                            <tr>
                              <th>记录ID</th>
                              <th>产品名称</th>
                              <th>预存数量</th>
                              <th>剩余数量</th>
                              <th>预存时间</th>
                              <th>状态</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerDeposits.filter(record => record.type === 'product').map((record) => (
                              <tr key={record._id}>
                                <td className="font-mono text-xs">{record._id?.slice(-8)}</td>
                                <td>{record.productName || '产品预存'}</td>
                                <td>{record.quantity || 0}</td>
                                <td className="font-bold">{record.balance || 0}</td>
                                <td className="text-sm">{formatTime(record.createTime)}</td>
                                <td>
                                  <span className={`badge ${record.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                                    {record.status === 'active' ? '有效' : '已失效'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 金额预存记录表格 */}
                  {customerDeposits.filter(record => record.type === 'cash').length > 0 && (
                    <div>
                      <h5 className="font-medium text-md mb-2 text-success">金额预存记录</h5>
                      <div className="overflow-x-auto">
                        <table className="table table-sm table-zebra w-full">
                          <thead>
                            <tr>
                              <th>记录ID</th>
                              <th>预存金额</th>
                              <th>剩余金额</th>
                              <th>预存时间</th>
                              <th>状态</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerDeposits.filter(record => record.type === 'cash').map((record) => (
                              <tr key={record._id}>
                                <td className="font-mono text-xs">{record._id?.slice(-8)}</td>
                                <td className="font-bold text-success">¥{formatAmount(record.amount)}</td>
                                <td className="font-bold text-success">¥{formatAmount(record.balance || 0)}</td>
                                <td className="text-sm">{formatTime(record.createTime)}</td>
                                <td>
                                  <span className={`badge ${record.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                                    {record.status === 'active' ? '有效' : '已失效'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowDepositModal(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加预存记录模态框 */}
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <button
              type="button"
              className="absolute top-4 right-4 p-1 hover:bg-gray-200 rounded-full transition-colors"
              onClick={() => setShowAddModal(false)}
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
            <h3 className="font-bold text-lg mb-4 mr-8">添加预存记录</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">客户</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="请输入客户姓名"
                    className="input input-bordered flex-1"
                    value={newDeposit.customerName}
                    onChange={(e) => setNewDeposit({...newDeposit, customerName: e.target.value})}
                  />
                  <button
                    className="btn btn-sm"
                    onClick={() => setShowCustomerSelect(!showCustomerSelect)}
                  >
                    选择
                  </button>
                </div>
                {showCustomerSelect && (
                  <div className="absolute z-10 bg-base-100 rounded-lg shadow-lg w-full max-h-60 overflow-y-auto border border-gray-200">
                    <div className="p-2 text-sm text-gray-500 border-b">
                      选择客户 ({customers.length} 个客户)
                    </div>
                    {customers.filter(customer => 
                      !newDeposit.customerName || customer.name.toLowerCase().includes(newDeposit.customerName.toLowerCase())
                    ).map(customer => (
                      <div
                        key={customer._id}
                        className="p-3 cursor-pointer hover:bg-base-200 border-b border-gray-100"
                        onClick={() => selectCustomer(customer)}
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-500">
                          {customer.phone || '无电话'} 
                          {customer.address && ` • ${customer.address}`}
                        </div>
                      </div>
                    ))}
                    {customers.length === 0 && (
                      <div className="p-3 text-gray-500 text-center">
                        暂无客户数据
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">客户电话 <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="tel"
                  placeholder="请输入客户电话"
                  className="input input-bordered"
                  value={newDeposit.customerPhone}
                  onChange={(e) => setNewDeposit({...newDeposit, customerPhone: e.target.value})}
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">客户地址</span>
                </label>
                <input
                  type="text"
                  placeholder="请输入客户地址（可选）"
                  className="input input-bordered"
                  value={newDeposit.customerAddress}
                  onChange={(e) => setNewDeposit({...newDeposit, customerAddress: e.target.value})}
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">预存类型</span>
                </label>
                <select
                  className="select select-bordered"
                  value={newDeposit.type}
                  onChange={(e) => setNewDeposit({...newDeposit, type: e.target.value})}
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">预存数量</span>
                </label>
                <input
                  type="number"
                  placeholder="请输入数量或金额"
                  className="input input-bordered"
                  value={newDeposit.amount}
                  onChange={(e) => setNewDeposit({...newDeposit, amount: e.target.value})}
                />
              </div>
              {newDeposit.type === 'product' && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">产品名称</span>
                  </label>
                  <input
                    type="text"
                    placeholder="请输入产品名称"
                    className="input input-bordered"
                    value={newDeposit.productName}
                    onChange={(e) => setNewDeposit({...newDeposit, productName: e.target.value})}
                  />
                </div>
              )}
              {newDeposit.type === 'product' && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">数量</span>
                  </label>
                  <input
                    type="number"
                    placeholder="请输入数量"
                    className="input input-bordered"
                    value={newDeposit.quantity}
                    onChange={(e) => setNewDeposit({...newDeposit, quantity: e.target.value})}
                  />
                </div>
              )}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">过期时间</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered"
                  value={newDeposit.expireDate}
                  onChange={(e) => setNewDeposit({...newDeposit, expireDate: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">描述</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder="预存记录的描述"
                  value={newDeposit.description}
                  onChange={(e) => setNewDeposit({...newDeposit, description: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowAddModal(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={addDeposit}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑预存记录模态框 */}
      {showEditModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <button
              type="button"
              className="absolute top-4 right-4 p-1 hover:bg-gray-200 rounded-full transition-colors"
              onClick={() => setShowEditModal(false)}
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
            <h3 className="font-bold text-lg mb-4 mr-8">编辑预存记录</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">客户</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="请输入客户姓名"
                    className="input input-bordered flex-1"
                    value={newDeposit.customerName}
                    onChange={(e) => setNewDeposit({...newDeposit, customerName: e.target.value})}
                  />
                  <button
                    className="btn btn-sm"
                    onClick={() => setShowCustomerSelect(!showCustomerSelect)}
                  >
                    选择
                  </button>
                </div>
                {showCustomerSelect && (
                  <div className="absolute z-10 bg-base-100 rounded-lg shadow-lg w-full max-h-60 overflow-y-auto border border-gray-200">
                    <div className="p-2 text-sm text-gray-500 border-b">
                      选择客户 ({customers.length} 个客户)
                    </div>
                    {customers.filter(customer => 
                      !newDeposit.customerName || customer.name.toLowerCase().includes(newDeposit.customerName.toLowerCase())
                    ).map(customer => (
                      <div
                        key={customer._id}
                        className="p-3 cursor-pointer hover:bg-base-200 border-b border-gray-100"
                        onClick={() => selectCustomer(customer)}
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-500">
                          {customer.phone || '无电话'} 
                          {customer.address && ` • ${customer.address}`}
                        </div>
                      </div>
                    ))}
                    {customers.length === 0 && (
                      <div className="p-3 text-gray-500 text-center">
                        暂无客户数据
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">预存类型</span>
                </label>
                <select
                  className="select select-bordered"
                  value={newDeposit.type}
                  onChange={(e) => setNewDeposit({...newDeposit, type: e.target.value})}
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">预存数量</span>
                </label>
                <input
                  type="number"
                  placeholder="请输入数量或金额"
                  className="input input-bordered"
                  value={newDeposit.amount}
                  onChange={(e) => setNewDeposit({...newDeposit, amount: e.target.value})}
                />
              </div>
              {newDeposit.type === 'product' && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">产品名称</span>
                  </label>
                  <input
                    type="text"
                    placeholder="请输入产品名称"
                    className="input input-bordered"
                    value={newDeposit.productName}
                    onChange={(e) => setNewDeposit({...newDeposit, productName: e.target.value})}
                  />
                </div>
              )}
              {newDeposit.type === 'product' && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">数量</span>
                  </label>
                  <input
                    type="number"
                    placeholder="请输入数量"
                    className="input input-bordered"
                    value={newDeposit.quantity}
                    onChange={(e) => setNewDeposit({...newDeposit, quantity: e.target.value})}
                  />
                </div>
              )}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">过期时间</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered"
                  value={newDeposit.expireDate}
                  onChange={(e) => setNewDeposit({...newDeposit, expireDate: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">描述</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder="预存记录的描述"
                  value={newDeposit.description}
                  onChange={(e) => setNewDeposit({...newDeposit, description: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowEditModal(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={updateDeposit}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositsPage;