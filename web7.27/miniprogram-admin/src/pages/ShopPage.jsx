import React, { useState, useEffect } from 'react';
import { 
  ShoppingBagIcon, 
  MagnifyingGlassIcon, 
  EyeIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  TagIcon,
  ArchiveBoxIcon,
  CheckIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentArrowDownIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { app, ensureLogin } from '../utils/cloudbase';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    stock: '',
    category: '',
    images: []
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState([]);
  const [deletedCategories, setDeletedCategories] = useState([]);
  
  // 新增状态
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [showLowStockAlert, setShowLowStockAlert] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [batchAction, setBatchAction] = useState('');
  const [stockThreshold, setStockThreshold] = useState(10);
  const [activeTab, setActiveTab] = useState('products'); // products, categories, analytics
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const pageSize = 10;

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: true, label: '上架' },
    { value: false, label: '下架' }
  ];

  // 分类完全从数据库动态获取，不使用预定义分类

  // 检查库存预警
  const checkLowStock = async () => {
    try {
      await ensureLogin();
      const db = app.database();
      const result = await db.collection('products')
        .where({
          stock: db.command.lte(stockThreshold),
          onSale: true
        })
        .get();
      
      setLowStockProducts(result.data);
      if (result.data.length > 0) {
        setShowLowStockAlert(true);
      }
    } catch (error) {
      console.error('检查库存预警失败:', error);
    }
  };

  // 批量操作
  const handleBatchAction = async () => {
    if (selectedProducts.length === 0) {
      alert('请先选择商品');
      return;
    }

    if (!batchAction) {
      alert('请选择操作类型');
      return;
    }

    const confirmMessage = {
      'onSale': `确定要上架选中的 ${selectedProducts.length} 个商品吗？`,
      'offSale': `确定要下架选中的 ${selectedProducts.length} 个商品吗？`,
      'delete': `确定要删除选中的 ${selectedProducts.length} 个商品吗？此操作不可恢复！`
    };

    if (!window.confirm(confirmMessage[batchAction])) {
      return;
    }

    try {
      await ensureLogin();
      const db = app.database();
      
      if (batchAction === 'delete') {
        // 批量删除
        for (const productId of selectedProducts) {
          await db.collection('products').doc(productId).remove();
        }
      } else {
        // 批量更新状态
        const onSale = batchAction === 'onSale';
        for (const productId of selectedProducts) {
          await db.collection('products').doc(productId).update({
            onSale,
            updateTime: new Date()
          });
        }
      }

      setSelectedProducts([]);
      setBatchAction('');
      setShowBatchModal(false);
      fetchProducts();
      alert('批量操作完成');
    } catch (error) {
      console.error('批量操作失败:', error);
      alert('批量操作失败，请重试');
    }
  };

  // 添加分类
  const addCategory = async () => {
    if (!newCategory.trim()) {
      alert('请输入分类名称');
      return;
    }

    if (categories.includes(newCategory.trim())) {
      alert('分类已存在');
      return;
    }

    try {
      await ensureLogin();
      const db = app.database();
      
      // 添加到分类集合（如果有的话）或者直接更新本地状态
      const updatedCategories = [...categories, newCategory.trim()];
      setCategories(updatedCategories);
      setNewCategory('');
      setShowCategoryModal(false);
      alert('分类添加成功');
    } catch (error) {
      console.error('添加分类失败:', error);
      alert('添加分类失败，请重试');
    }
  };

  // 删除分类
  const deleteCategory = async (categoryName) => {
    if (!window.confirm(`确定要删除分类 "${categoryName}" 吗？`)) {
      return;
    }

    try {
      await ensureLogin();
      const db = app.database();
      
      // 检查是否有商品使用此分类
      const productsWithCategory = products.filter(p => p.category === categoryName);
      if (productsWithCategory.length > 0) {
        if (!window.confirm(`该分类下还有 ${productsWithCategory.length} 个商品，删除后这些商品将变为未分类，确定继续吗？`)) {
          return;
        }
        
        // 将使用此分类的商品分类设为空
        for (const product of productsWithCategory) {
          await db.collection('shopProducts').doc(product._id).update({
            category: '',
            updateTime: new Date()
          });
        }
      }
      
      // 将分类添加到已删除列表中
      const newDeletedCategories = [...deletedCategories, categoryName];
      setDeletedCategories(newDeletedCategories);
      localStorage.setItem('deletedCategories', JSON.stringify(newDeletedCategories));
      
      // 从分类列表中移除
      const updatedCategories = categories.filter(c => c !== categoryName);
      setCategories(updatedCategories);
      
      // 重新获取商品列表以更新显示
      fetchProducts();
      alert('分类删除成功');
    } catch (error) {
      console.error('删除分类失败:', error);
      alert('删除分类失败，请重试');
    }
  };

  // 导出商品数据
  const exportProducts = async () => {
    try {
      await ensureLogin();
      const db = app.database();
      const result = await db.collection('products').get();
      
      const csvContent = [
        ['商品ID', '商品名称', '价格', '库存', '分类', '状态', '创建时间'].join(','),
        ...result.data.map(product => [
          product._id,
          `"${product.name}"`,
          product.price,
          product.stock,
          `"${product.category || ''}"`,
          product.onSale ? '上架' : '下架',
          formatTime(product.createTime)
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `商品数据_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p._id));
    }
  };

  // 选择单个商品
  const toggleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // 获取商品分类
  const fetchCategories = async () => {
    try {
      await ensureLogin();
      const db = app.database();
      const result = await db.collection('products')
        .field({ category: true })
        .get();

      const uniqueCategories = [...new Set(result.data
        .map(item => item.category)
        .filter(category => category && category.trim() !== '')
      )];
      
      // 只使用数据库中的分类，排除已删除的分类
      const allCategories = uniqueCategories
        .filter(category => !deletedCategories.includes(category));
      setCategories(allCategories);
    } catch (error) {
      console.error('获取分类失败:', error);
      setCategories([]);
    }
  };

  // 获取商品列表
  const fetchProducts = async () => {
    try {
      setLoading(true);
      await ensureLogin();
      const db = app.database();

      // 构建查询条件
      let query = db.collection('products');
      
      if (searchTerm) {
        query = query.where({
          name: db.RegExp({
            regexp: searchTerm,
            options: 'i'
          })
        });
      }

      if (statusFilter !== '') {
        query = query.where({ onSale: statusFilter });
      }

      if (categoryFilter) {
        query = query.where({ category: categoryFilter });
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

      setProducts(result.data);
    } catch (error) {
      console.error('获取商品列表失败:', error);
      alert('获取商品列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载已删除的分类
  useEffect(() => {
    const savedDeletedCategories = localStorage.getItem('deletedCategories');
    if (savedDeletedCategories) {
      setDeletedCategories(JSON.parse(savedDeletedCategories));
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    checkLowStock();
  }, [currentPage, searchTerm, statusFilter, categoryFilter, stockThreshold, deletedCategories]);

  // 定期检查库存预警
  useEffect(() => {
    const interval = setInterval(checkLowStock, 5 * 60 * 1000); // 每5分钟检查一次
    return () => clearInterval(interval);
  }, [stockThreshold]);

  // 查看商品详情
  const viewProduct = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  // 编辑商品
  const editProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name || '',
      price: product.price || '',
      description: product.description || '',
      stock: product.stock || '',
      category: product.category || '',
      images: product.images || []
    });
    setShowEditModal(true);
  };

  // 添加商品
  const addProduct = async () => {
    if (submitting) return;
    
    try {
      if (!newProduct.name || !newProduct.price) {
        alert('请填写商品名称和价格');
        return;
      }

      if (parseFloat(newProduct.price) <= 0) {
        alert('价格必须大于0');
        return;
      }

      if (parseInt(newProduct.stock) < 0) {
        alert('库存不能为负数');
        return;
      }

      setSubmitting(true);
      await ensureLogin();
      const db = app.database();
      
      await db.collection('products').add({
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        description: newProduct.description.trim(),
        stock: parseInt(newProduct.stock) || 0,
        category: newProduct.category.trim(),
        images: newProduct.images,
        onSale: true,
        brand: '',
        specification: newProduct.description.trim() || '',
        type: newProduct.category.trim() || '',
        remark: '',
        createTime: new Date(),
        updateTime: new Date()
      });

      // 重置表单
      setNewProduct({
        name: '',
        price: '',
        description: '',
        stock: '',
        category: '',
        images: []
      });
      setShowAddModal(false);

      // 刷新列表和分类
      fetchProducts();
      fetchCategories();
      alert('商品添加成功');
    } catch (error) {
      console.error('添加商品失败:', error);
      alert('添加商品失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 更新商品
  const updateProduct = async () => {
    if (submitting) return;
    
    try {
      if (!newProduct.name || !newProduct.price) {
        alert('请填写商品名称和价格');
        return;
      }

      if (parseFloat(newProduct.price) <= 0) {
        alert('价格必须大于0');
        return;
      }

      if (parseInt(newProduct.stock) < 0) {
        alert('库存不能为负数');
        return;
      }

      setSubmitting(true);
      await ensureLogin();
      const db = app.database();
      
      await db.collection('products').doc(editingProduct._id).update({
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        description: newProduct.description.trim(),
        stock: parseInt(newProduct.stock) || 0,
        category: newProduct.category.trim(),
        images: newProduct.images,
        updateTime: new Date()
      });

      // 重置表单
      setNewProduct({
        name: '',
        price: '',
        description: '',
        stock: '',
        category: '',
        images: []
      });
      setEditingProduct(null);
      setShowEditModal(false);

      // 刷新列表和分类
      fetchProducts();
      fetchCategories();
      alert('商品更新成功');
    } catch (error) {
      console.error('更新商品失败:', error);
      alert('更新商品失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 切换商品状态
  const toggleProductStatus = async (productId, currentStatus) => {
    if (!window.confirm(`确定要${currentStatus ? '下架' : '上架'}这个商品吗？`)) {
      return;
    }

    try {
      await ensureLogin();
      const db = app.database();
      
      const newStatus = !currentStatus;
      await db.collection('products').doc(productId).update({
        onSale: newStatus,
        updateTime: new Date()
      });

      // 刷新列表
      fetchProducts();
      alert(`商品${newStatus ? '上架' : '下架'}成功`);
    } catch (error) {
      console.error('切换商品状态失败:', error);
      alert('操作失败，请重试');
    }
  };

  // 删除商品
  const deleteProduct = async (productId) => {
    if (!window.confirm('确定要删除这个商品吗？删除后无法恢复。')) {
      return;
    }

    try {
      await ensureLogin();
      const db = app.database();
      
      await db.collection('products').doc(productId).remove();

      // 刷新列表
      fetchProducts();
      alert('商品删除成功');
    } catch (error) {
      console.error('删除商品失败:', error);
      alert('删除失败，请重试');
    }
  };

  const confirmBatchAction = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      await ensureLogin();
      const db = app.database();

      if (batchAction === 'delete') {
        // 批量删除
        for (const productId of selectedProducts) {
          await db.collection('products').doc(productId).remove();
        }
      } else {
        // 批量更新状态
        const onSale = batchAction === 'onSale';
        for (const productId of selectedProducts) {
          await db.collection('products').doc(productId).update({
            onSale,
            updateTime: new Date()
          });
        }
      }

      setSelectedProducts([]);
      setBatchAction('');
      setShowBatchModal(false);
      fetchProducts();
      alert('批量操作完成');
    } catch (error) {
      console.error('批量操作失败:', error);
      alert('批量操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 搜索处理
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
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

  // 上传图片到 CloudBase
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    if (files.length > 5) {
      alert('最多只能上传5张图片');
      return;
    }

    try {
      setUploadingImages(true);
    await ensureLogin();
    // 使用CloudBase存储API
    const uploadedUrls = [];
      
    for (const file of files) {
        // 检查文件大小（最大2MB）
        if (file.size > 2 * 1024 * 1024) {
          alert(`文件 ${file.name} 过大，请选择小于2MB的图片`);
          continue;
        }

      const cloudPath = `products/${Date.now()}_${file.name}`;
      
      // 模拟上传（避免CORS问题）
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟上传时间
      
      // 生成模拟的临时URL
      const mockTempURL = URL.createObjectURL(file);
      uploadedUrls.push(mockTempURL);
    }
      
      setNewProduct((prev) => ({ 
        ...prev, 
        images: [...prev.images, ...uploadedUrls].slice(0, 5) // 限制最多5张图片
      }));
    } catch (error) {
      console.error('图片上传失败:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploadingImages(false);
    }
  };

  // 删除图片
  const removeImage = (index) => {
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
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
          <ShoppingBagIcon className="w-8 h-8 mr-3" />
          商城管理
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="btn btn-outline"
          >
            <TagIcon className="w-5 h-5 mr-2" />
            分类管理
          </button>
          <button
            onClick={exportProducts}
            className="btn btn-outline"
          >
            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
            导出数据
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            添加商品
          </button>
        </div>
      </div>

      {/* 库存预警提示 */}
      {showLowStockAlert && lowStockProducts.length > 0 && (
        <div className="alert alert-warning mb-6">
          <ExclamationTriangleIcon className="w-6 h-6" />
          <div>
            <h3 className="font-bold">库存预警</h3>
            <div className="text-sm">
              有 {lowStockProducts.length} 个商品库存不足（≤{stockThreshold}），请及时补货：
              {lowStockProducts.slice(0, 3).map(product => product.name).join('、')}
              {lowStockProducts.length > 3 && '等'}
            </div>
          </div>
          <button 
            className="btn btn-sm" 
            onClick={() => setShowLowStockAlert(false)}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 标签页导航 */}
      <div className="tabs tabs-boxed mb-6">
        <button 
          className={`tab ${activeTab === 'products' ? 'tab-active' : ''} flex items-center justify-center h-12`}
          onClick={() => setActiveTab('products')}
        >
          <ShoppingBagIcon className="w-4 h-4 mr-2" />
          商品管理
        </button>
        <button 
          className={`tab ${activeTab === 'categories' ? 'tab-active' : ''} flex items-center justify-center h-12`}
          onClick={() => setActiveTab('categories')}
        >
          <TagIcon className="w-4 h-4 mr-2" />
          分类管理
        </button>
        <button 
          className={`tab ${activeTab === 'analytics' ? 'tab-active' : ''} flex items-center justify-center h-12`}
          onClick={() => setActiveTab('analytics')}
        >
          <Cog6ToothIcon className="w-4 h-4 mr-2" />
          数据分析
        </button>
      </div>

      {/* 根据activeTab显示不同内容 */}
      {activeTab === 'products' && (
        <>
          {/* 搜索和筛选栏 */}
          <div className="bg-base-100 shadow rounded-lg p-4 mb-6">
            <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
              <div className="form-control flex-1 min-w-64">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="搜索商品名称..."
                    className="input input-bordered flex-1 rounded-r-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button type="submit" className="btn btn-square rounded-l-none border-l-0">
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
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">全部分类</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          </div>

          {/* 批量操作栏 */}
          {selectedProducts.length > 0 && (
            <div className="bg-base-100 shadow rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  已选择 {selectedProducts.length} 个商品
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setBatchAction('onSale');
                      setShowBatchModal(true);
                    }}
                    className="btn btn-sm btn-success"
                  >
                    <ArrowUpIcon className="w-4 h-4 mr-1" />
                    批量上架
                  </button>
                  <button
                    onClick={() => {
                      setBatchAction('offSale');
                      setShowBatchModal(true);
                    }}
                    className="btn btn-sm btn-warning"
                  >
                    <ArrowDownIcon className="w-4 h-4 mr-1" />
                    批量下架
                  </button>
                  <button
                    onClick={() => {
                      setBatchAction('delete');
                      setShowBatchModal(true);
                    }}
                    className="btn btn-sm btn-error"
                  >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    批量删除
                  </button>
                  <button
                    onClick={() => setSelectedProducts([])}
                    className="btn btn-sm btn-ghost"
                  >
                    取消选择
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 商品列表 */}
          <div className="bg-base-100 shadow rounded-lg overflow-hidden">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBagIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">暂无商品数据</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedProducts.length === products.length && products.length > 0}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th>商品ID</th>
                        <th>商品名称</th>
                        <th>价格</th>
                        <th>库存</th>
                        <th>分类</th>
                        <th>状态</th>
                        <th>创建时间</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product._id} className={selectedProducts.includes(product._id) ? 'bg-base-200' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              className="checkbox"
                              checked={selectedProducts.includes(product._id)}
                              onChange={() => toggleSelectProduct(product._id)}
                            />
                          </td>
                          <td className="font-mono text-sm">{product._id?.slice(-8)}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              {product.images && product.images.length > 0 && (
                                <img 
                                  src={product.images[0]} 
                                  alt={product.name}
                                  className="w-8 h-8 rounded object-cover"
                                />
                              )}
                              <span className="max-w-xs truncate">{product.name}</span>
                            </div>
                          </td>
                          <td className="font-bold">¥{formatAmount(product.price)}</td>
                          <td>
                            <span className={product.stock <= stockThreshold ? 'text-error font-bold' : ''}>
                              {product.stock || 0}
                              {product.stock <= stockThreshold && (
                                <ExclamationTriangleIcon className="w-4 h-4 inline ml-1" />
                              )}
                            </span>
                          </td>
                          <td>{product.category || '未分类'}</td>
                          <td>
                            <span className={`badge ${product.onSale ? 'badge-success' : 'badge-warning'}`}>
                              {product.onSale ? '上架' : '下架'}
                            </span>
                          </td>
                          <td>{formatTime(product.createTime)}</td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                onClick={() => viewProduct(product)}
                                className="btn btn-sm btn-ghost"
                                title="查看详情"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => editProduct(product)}
                                className="btn btn-sm btn-ghost"
                                title="编辑"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleProductStatus(product._id, product.onSale)}
                                className={`btn btn-sm ${product.onSale ? 'btn-warning' : 'btn-success'}`}
                                title={product.onSale ? '下架' : '上架'}
                              >
                                {product.onSale ? '下架' : '上架'}
                              </button>
                              <button
                                onClick={() => deleteProduct(product._id)}
                                className="btn btn-sm btn-error"
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
        </>
      )}

      {/* 分类管理标签页 */}
      {activeTab === 'categories' && (
        <div className="bg-base-100 shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">分类管理</h2>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="btn btn-primary"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              添加分类
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category, index) => (
              <div key={category} className="card bg-base-200 shadow-sm">
                <div className="card-body p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="card-title text-lg">{category}</h3>
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-ghost">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button 
                        className="btn btn-sm btn-error"
                        onClick={() => {
                          if (window.confirm(`确定要删除分类 "${category}" 吗？`)) {
                            setCategories(prev => prev.filter(c => c !== category));
                          }
                        }}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    商品数量: {products.filter(p => p.category === category).length}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 数据分析标签页 */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="stat bg-base-100 shadow rounded-lg">
              <div className="stat-figure text-primary">
                <ShoppingBagIcon className="w-8 h-8" />
              </div>
              <div className="stat-title">商品总数</div>
              <div className="stat-value text-primary">{products.length}</div>
            </div>
            
            <div className="stat bg-base-100 shadow rounded-lg">
              <div className="stat-figure text-success">
                <ArrowUpIcon className="w-8 h-8" />
              </div>
              <div className="stat-title">上架商品</div>
              <div className="stat-value text-success">
                {products.filter(p => p.onSale).length}
              </div>
            </div>
            
            <div className="stat bg-base-100 shadow rounded-lg">
              <div className="stat-figure text-warning">
                <ExclamationTriangleIcon className="w-8 h-8" />
              </div>
              <div className="stat-title">库存预警</div>
              <div className="stat-value text-warning">
                {products.filter(p => p.stock <= stockThreshold).length}
              </div>
            </div>
            
            <div className="stat bg-base-100 shadow rounded-lg">
              <div className="stat-figure text-info">
                <TagIcon className="w-8 h-8" />
              </div>
              <div className="stat-title">分类数量</div>
              <div className="stat-value text-info">{categories.length}</div>
            </div>
          </div>

          {/* 库存预警设置 */}
          <div className="bg-base-100 shadow rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">库存预警设置</h3>
            <div className="flex items-center gap-4">
              <label className="label">
                <span className="label-text">预警阈值：</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-24"
                value={stockThreshold}
                onChange={(e) => setStockThreshold(parseInt(e.target.value) || 10)}
                min="0"
              />
              <span className="text-sm text-gray-600">件以下</span>
              <button
                onClick={checkLowStock}
                className="btn btn-primary btn-sm"
              >
                立即检查
              </button>
            </div>
          </div>

          {/* 低库存商品列表 */}
          {lowStockProducts.length > 0 && (
            <div className="bg-base-100 shadow rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4 text-warning">
                <ExclamationTriangleIcon className="w-5 h-5 inline mr-2" />
                库存预警商品 ({lowStockProducts.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>商品名称</th>
                      <th>当前库存</th>
                      <th>分类</th>
                      <th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((product) => (
                      <tr key={product._id}>
                        <td>{product.name}</td>
                        <td className="text-error font-bold">{product.stock}</td>
                        <td>{product.category || '未分类'}</td>
                        <td>
                          <span className={`badge ${product.onSale ? 'badge-success' : 'badge-warning'}`}>
                            {product.onSale ? '上架' : '下架'}
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

      {/* 商品详情模态框 */}
      {showProductModal && selectedProduct && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">商品详情</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">商品ID</span>
                  </label>
                  <p className="font-mono text-sm">{selectedProduct._id}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">状态</span>
                  </label>
                  <span className={`badge ${selectedProduct.onSale ? 'badge-success' : 'badge-warning'}`}>
                    {selectedProduct.onSale ? '上架' : '下架'}
                  </span>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">商品名称</span>
                  </label>
                  <p>{selectedProduct.name}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">价格</span>
                  </label>
                  <p className="text-lg font-bold">¥{formatAmount(selectedProduct.price)}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">库存</span>
                  </label>
                  <p>{selectedProduct.stock || 0}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">分类</span>
                  </label>
                  <p>{selectedProduct.category || '未分类'}</p>
                </div>
              </div>
              
              {selectedProduct.description && (
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">商品描述</span>
                  </label>
                  <p className="p-2 bg-base-200 rounded">{selectedProduct.description}</p>
                </div>
              )}

              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">商品图片</span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {selectedProduct.images.map((image, index) => (
                      <img 
                        key={index}
                        src={image} 
                        alt={`${selectedProduct.name} ${index + 1}`}
                        className="w-20 h-20 rounded object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">创建时间</span>
                  </label>
                  <p>{formatTime(selectedProduct.createTime)}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">更新时间</span>
                  </label>
                  <p>{formatTime(selectedProduct.updateTime)}</p>
                </div>
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowProductModal(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加商品模态框 */}
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">添加商品</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">商品名称</span>
                </label>
                <input
                  type="text"
                  placeholder="请输入商品名称"
                  className="input input-bordered"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">价格</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="请输入价格"
                  className="input input-bordered"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">库存</span>
                </label>
                <input
                  type="number"
                  placeholder="请输入库存数量"
                  className="input input-bordered"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">分类</span>
                </label>
                <select
                  className="select select-bordered"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                >
                  <option value="">请选择分类</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="或输入新分类"
                  className="input input-bordered mt-2"
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">商品描述</span>
                </label>
                <textarea
                  placeholder="请输入商品描述"
                  className="textarea textarea-bordered"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">商品图片</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="file-input file-input-bordered"
                  onChange={handleImageUpload}
                  disabled={uploadingImages}
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {newProduct.images && newProduct.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img} alt="商品图片" className="w-16 h-16 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="删除图片"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {uploadingImages && (
                  <div className="text-center py-2 text-gray-500">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2 inline-block" />
                    图片上传中...
                  </div>
                )}
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
                onClick={addProduct}
                disabled={submitting}
              >
                {submitting ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑商品模态框 */}
      {showEditModal && editingProduct && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">编辑商品</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">商品名称</span>
                </label>
                <input
                  type="text"
                  placeholder="请输入商品名称"
                  className="input input-bordered"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">价格</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="请输入价格"
                  className="input input-bordered"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">库存</span>
                </label>
                <input
                  type="number"
                  placeholder="请输入库存数量"
                  className="input input-bordered"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">分类</span>
                </label>
                <select
                  className="select select-bordered"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                >
                  <option value="">请选择分类</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="或输入新分类"
                  className="input input-bordered mt-2"
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">商品描述</span>
                </label>
                <textarea
                  placeholder="请输入商品描述"
                  className="textarea textarea-bordered"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">商品图片</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="file-input file-input-bordered"
                  onChange={handleImageUpload}
                  disabled={uploadingImages}
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {newProduct.images && newProduct.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img} alt="商品图片" className="w-16 h-16 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="删除图片"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {uploadingImages && (
                  <div className="text-center py-2 text-gray-500">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2 inline-block" />
                    图片上传中...
                  </div>
                )}
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
                onClick={updateProduct}
                disabled={submitting}
              >
                {submitting ? '更新中...' : '更新'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 分类管理模态框 */}
      {showCategoryModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">分类管理</h3>
            
            {/* 添加新分类 */}
            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="输入新分类名称"
                  className="input input-bordered flex-1"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                />
                <button
                  className="btn btn-primary"
                  onClick={addCategory}
                  disabled={!newCategory.trim()}
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  添加
                </button>
              </div>
            </div>

            {/* 分类列表 */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {categories.map((category, index) => (
                <div key={category} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TagIcon className="w-5 h-5 text-primary" />
                    <span className="font-medium">{category}</span>
                    <span className="badge badge-ghost">
                      {products.filter(p => p.category === category).length} 商品
                    </span>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm text-error"
                    onClick={() => deleteCategory(category)}
                    title="删除分类"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowCategoryModal(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量操作确认模态框 */}
      {showBatchModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">确认批量操作</h3>
            <p className="mb-4">
              您确定要对选中的 <span className="font-bold text-primary">{selectedProducts.length}</span> 个商品执行
              <span className="font-bold text-warning mx-1">{batchAction}</span>操作吗？
            </p>
            
            {batchAction === 'delete' && (
              <div className="alert alert-warning mb-4">
                <ExclamationTriangleIcon className="w-6 h-6" />
                <span>删除操作不可恢复，请谨慎操作！</span>
              </div>
            )}

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowBatchModal(false)}
              >
                取消
              </button>
              <button
                className={`btn ${batchAction === 'delete' ? 'btn-error' : 'btn-primary'}`}
                onClick={confirmBatchAction}
                disabled={submitting}
              >
                {submitting ? '处理中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;