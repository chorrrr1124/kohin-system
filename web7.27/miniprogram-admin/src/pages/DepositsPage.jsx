import React, { useState, useEffect } from 'react';
import { CreditCardIcon, MagnifyingGlassIcon, EyeIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { app, ensureLogin } from '../utils/cloudbase';

const DepositsPage = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  const pageSize = 10;

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'active', label: '有效' },
    { value: 'used', label: '已用完' },
    { value: 'expired', label: '已过期' }
  ];

  const typeOptions = [
    { value: '', label: '全部类型' },
    { value: 'cash', label: '金额预存' },
    { value: 'product', label: '产品预存' }
  ];

  const statusLabels = {
    active: '有效',
    used: '已用完',
    expired: '已过期'
  };

  const statusColors = {
    active: 'badge-success',
    used: 'badge-warning',
    expired: 'badge-error'
  };

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

      // 状态筛选
      if (statusFilter) {
        query = query.where({ status: statusFilter });
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
  }, [currentPage, searchTerm, statusFilter, typeFilter]);

  // 查看预存记录详情
  const viewDeposit = (deposit) => {
    setSelectedDeposit(deposit);
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
      
      const addData = {
        customerId: newDeposit.customerId || '',
        customerName: newDeposit.customerName,
        customerPhone: newDeposit.customerPhone || '',
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

      await db.collection('prepaidRecords').add(addData);

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
      setShowAddModal(false);

      // 刷新列表
      fetchDeposits();
      alert('添加成功');
    } catch (error) {
      console.error('添加预存记录失败:', error);
      alert('添加失败');
    }
  };

  // 选择客户
  const selectCustomer = (customer) => {
    setNewDeposit({
      ...newDeposit,
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone || (customer.contacts && customer.contacts[0] ? customer.contacts[0].phone : '')
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
    return new Date(timestamp).toLocaleString();
  };

  // 格式化金额
  const formatAmount = (amount) => {
    return typeof amount === 'number' ? amount.toFixed(2) : '0.00';
  };

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

      {/* 搜索和筛选栏 */}
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
        {deposits.length === 0 ? (
          <div className="text-center py-12">
            <CreditCardIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">暂无预存记录数据</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>记录ID</th>
                    <th>客户姓名</th>
                    <th>客户电话</th>
                    <th>类型</th>
                    <th>数量/金额</th>
                    <th>余额</th>
                    <th>过期时间</th>
                    <th>状态</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((deposit) => (
                    <tr key={deposit._id}>
                      <td className="font-mono text-sm">{deposit._id?.slice(-8)}</td>
                      <td>{deposit.customerName || '未知客户'}</td>
                      <td>{deposit.customerPhone || '未设置'}</td>
                      <td>{typeLabels[deposit.type] || deposit.type}</td>
                      <td>{deposit.type === 'cash' ? formatAmount(deposit.amount) : deposit.quantity}</td>
                      <td className="font-bold">{deposit.balance || 0}</td>
                      <td>{deposit.expireDate ? new Date(deposit.expireDate).toLocaleDateString() : '无期限'}</td>
                      <td>
                        <span className={`badge ${statusColors[deposit.status] || 'badge-neutral'}`}>
                          {statusLabels[deposit.status] || deposit.status}
                        </span>
                      </td>
                      <td>{formatTime(deposit.createTime)}</td>
                      <td>
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
                    第 {currentPage} 页，共 {totalPages} 页
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

      {/* 预存记录详情模态框 */}
      {showDepositModal && selectedDeposit && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">预存记录详情</h3>
            <div className="space-y-3">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">记录ID</span>
                </label>
                <p className="font-mono text-sm">{selectedDeposit._id}</p>
              </div>
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
              <div>
                <label className="label">
                  <span className="label-text font-semibold">数量/金额</span>
                </label>
                <p>{selectedDeposit.type === 'cash' ? formatAmount(selectedDeposit.amount) : selectedDeposit.quantity}</p>
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-semibold">余额</span>
                </label>
                <p className="text-lg font-bold">{selectedDeposit.balance || 0}</p>
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-semibold">过期时间</span>
                </label>
                <p>{selectedDeposit.expireDate ? new Date(selectedDeposit.expireDate).toLocaleDateString() : '无期限'}</p>
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-semibold">状态</span>
                </label>
                <span className={`badge ${statusColors[selectedDeposit.status] || 'badge-neutral'}`}>
                  {statusLabels[selectedDeposit.status] || selectedDeposit.status}
                </span>
              </div>
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
            <h3 className="font-bold text-lg mb-4">添加预存记录</h3>
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
                    onClick={() => setShowCustomerSelect(true)}
                    disabled={!newDeposit.customerName}
                  >
                    选择
                  </button>
                </div>
                {showCustomerSelect && (
                  <div className="absolute z-10 bg-base-100 rounded-lg shadow-lg w-full max-h-60 overflow-y-auto">
                    {customers.filter(customer => 
                      customer.name.toLowerCase().includes(newDeposit.customerName.toLowerCase())
                    ).map(customer => (
                      <div
                        key={customer._id}
                        className="p-2 cursor-pointer hover:bg-base-200"
                        onClick={() => selectCustomer(customer)}
                      >
                        {customer.name} ({customer.phone || '无电话'})
                      </div>
                    ))}
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
                  <span className="label-text">预存数量/金额</span>
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
            <h3 className="font-bold text-lg mb-4">编辑预存记录</h3>
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
                    onClick={() => setShowCustomerSelect(true)}
                    disabled={!newDeposit.customerName}
                  >
                    选择
                  </button>
                </div>
                {showCustomerSelect && (
                  <div className="absolute z-10 bg-base-100 rounded-lg shadow-lg w-full max-h-60 overflow-y-auto">
                    {customers.filter(customer => 
                      customer.name.toLowerCase().includes(newDeposit.customerName.toLowerCase())
                    ).map(customer => (
                      <div
                        key={customer._id}
                        className="p-2 cursor-pointer hover:bg-base-200"
                        onClick={() => selectCustomer(customer)}
                      >
                        {customer.name} ({customer.phone || '无电话'})
                      </div>
                    ))}
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
                  <span className="label-text">预存数量/金额</span>
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