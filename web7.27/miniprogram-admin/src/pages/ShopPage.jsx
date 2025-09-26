import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';import { 
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
  Cog6ToothIcon,
  PhotoIcon,
  CloudIcon
} from '@heroicons/react/24/outline';
import { app, ensureLogin } from '../utils/cloudbase';
import ImageSelector from '../components/ImageSelector';

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
    images: [],
    productId: ''
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState([]);
  const [deletedCategories, setDeletedCategories] = useState([]);
  
  // 图片选择器状态
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [selectedCloudImages, setSelectedCloudImages] = useState([]);
  
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
  
  // 关联仓库产品相关状态
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  
  // 同步相关状态
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncMessage, setSyncMessage] = useState('');
  
  // 本地筛选相关状态
  const [allProducts, setAllProducts] = useState([]); // 存储所有商品数据
  const [filteredProducts, setFilteredProducts] = useState([]); // 存储筛选后的商品数据

  const pageSize = 10;

  // 本地筛选函数
  const applyLocalFilters = () => {
    let filtered = [...allProducts];
    
    // 搜索筛选
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term)
      );
    }
    
    // 状态筛选
    if (statusFilter !== '') {
      const isOnSale = statusFilter === 'true';
      filtered = filtered.filter(product => product.onSale === isOnSale);
    }
    
    // 分类筛选
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    setFilteredProducts(filtered);
    setFilteredProducts(filtered);
      setProducts(filtered);
    
    // 重新计算分页
    const total = filtered.length;
    setTotalPages(Math.ceil(total / pageSize));
    setCurrentPage(1);
  };

  // 搜索处理函数
  const handleSearch = () => {
    applyLocalFilters();
  };

  // 筛选变化处理
  const handleFilterChange = (filterType, value) => {
    if (filterType === 'status') {
      setStatusFilter(value);
    } else if (filterType === 'category') {
      setCategoryFilter(value);
    }
    
    // 延迟执行筛选，避免频繁更新
    setTimeout(() => {
      applyLocalFilters();
    }, 100);
  };

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: true, label: '上架' },
    { value: false, label: '下架' }
  ];

  // 分类完全从数据库动态获取，不使用预定义分类

  // 加载仓库产品数据
  const loadInventoryProducts = async () => {
    try {
      await ensureLogin();
      const db = app.database();
      const result = await db.collection('products') // 修正：应该查询 products 集合
        .orderBy('createTime', 'desc')
        .get();
      
      console.log('🔍 加载到的仓库产品:', result.data);
      setInventoryProducts(result.data);
    } catch (error) {
      console.error('加载仓库产品失败:', error);
    }
  };

  // 同步仓库产品数据到商品管理（只同步库存数量）
  const syncFromInventory = async () => {
    if (syncStatus === 'syncing') return;
    
    try {
      setSyncStatus('syncing');
      setSyncMessage('正在同步库存数据...');
      
      await ensureLogin();
      
      // 调用云函数进行库存同步
      const result = await app.callFunction({
        name: 'inventorySync',
        data: {
          action: 'syncInventoryToShop'
        }
      });
      
      if (result.result.success) {
        setLastSyncTime(new Date());
        setSyncMessage(result.result.message);
        setSyncStatus('success');
        console.log('✅ 库存同步成功:', result.result);
      } else {
        throw new Error(result.result.error || '同步失败');
      }
      
      // 刷新商品列表
      fetchProducts();
      
    } catch (error) {
      console.error('库存同步失败:', error);
      setSyncMessage(`库存同步失败: ${error.message}`);
      setSyncStatus('error');
    }
  };

  // 自动同步函数（静默执行，不显示加载状态）
  const autoSyncFromInventory = async () => {
    try {
      // 静默执行，减少日志输出
      await ensureLogin();
      
      // 调用云函数进行库存同步
      const result = await app.callFunction({
        name: 'inventorySync',
        data: {
          action: 'syncInventoryToShop'
        }
      });
      
      if (result.result.success) {
        setLastSyncTime(new Date());
        setSyncMessage(result.result.message);
        setSyncStatus('success');
        console.log('✅ 自动同步完成');
        
        // 静默刷新商品列表
        fetchProducts();
      } else {
        // 只在控制台记录错误，不显示给用户
        console.warn('自动同步失败:', result.result.error);
        setSyncMessage(`自动同步失败: ${result.result.error}`);
        setSyncStatus('error');
      }
      
    } catch (error) {
      // 只在控制台记录错误，不显示给用户
      console.warn('自动同步失败:', error.message);
      setSyncMessage(`自动同步失败: ${error.message}`);
      setSyncStatus('error');
    }
  };

  // 检查同步状态
  const checkSyncStatus = async () => {
    try {
      await ensureLogin();
      const db = app.database();
      
      // 获取最近同步的商品
      const result = await db.collection('shopProducts')
        .where({
          lastSyncTime: db.command.exists(true)
        })
        .orderBy('lastSyncTime', 'desc')
        .limit(1)
        .get();
      
      if (result.data.length > 0) {
        setLastSyncTime(result.data[0].lastSyncTime);
      }
    } catch (error) {
      console.error('检查同步状态失败:', error);
    }
  };

  // 选择仓库产品
  const selectInventoryProduct = (product) => {
    setNewProduct({
      ...newProduct,
      name: product.name,
      price: product.price || '',
      description: product.description || '',
      stock: product.stock || '',
      category: product.category || '',
      images: product.images || [],
      productId: product._id // 关联仓库产品ID
    });
    setShowProductSelector(false);
  };

  // 检查库存预警
  const checkLowStock = async () => {
    try {
      await ensureLogin();
      const db = app.database();
      const result = await db.collection('shopProducts')
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
          await db.collection('shopProducts').doc(productId).remove();
        }
      } else {
        // 批量更新状态
        const onSale = batchAction === 'onSale';
        for (const productId of selectedProducts) {
          await db.collection('shopProducts').doc(productId).update({
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
      const result = await db.collection('shopProducts').get();
      
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
    if (selectedProducts.length === filteredProducts.length) {
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
      const result = await db.collection('shopProducts')
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

      // 获取所有商品数据，不进行服务端筛选
      const result = await db.collection('shopProducts')
        .orderBy('createTime', 'desc')
        .get();

      setAllProducts(result.data);
      setFilteredProducts(result.data);
      setProducts(result.data);
      
      // 应用当前筛选条件
      applyLocalFilters();
    } catch (error) {
      console.error('获取商品列表失败:', error);
      alert('获取商品列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };


  const computedTotalPages = React.useMemo(() => {
    return Math.max(1, Math.ceil((filteredProducts.length || 0) / pageSize));
  }, [products, pageSize]);

  const paginatedProducts = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [products, currentPage, pageSize]);

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
    checkSyncStatus(); // 检查同步状态
    // 页面加载时自动执行同步
    autoSyncFromInventory();
  }, [stockThreshold, deletedCategories]);

  // 定期检查库存预警
  useEffect(() => {
    const interval = setInterval(checkLowStock, 5 * 60 * 1000); // 每5分钟检查一次
    return () => clearInterval(interval);
  }, [stockThreshold]);

  // 定期自动同步数据
  useEffect(() => {
    const syncInterval = setInterval(() => {
      // 静默执行定期同步
      autoSyncFromInventory();
    }, 30 * 60 * 1000); // 每30分钟自动同步一次
    
    return () => clearInterval(syncInterval);
  }, []);

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
      images: product.images || [],
      productId: product.productId || ''
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
      
      await db.collection('shopProducts').add({
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
        productId: newProduct.productId || '', // 关联的仓库产品ID
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
        images: [],
        productId: ''
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
      
      await db.collection('shopProducts').doc(editingProduct._id).update({
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        description: newProduct.description.trim(),
        stock: parseInt(newProduct.stock) || 0,
        category: newProduct.category.trim(),
        images: newProduct.images,
        productId: newProduct.productId || '', // 关联的仓库产品ID
        updateTime: new Date()
      });

      // 重置表单
      setNewProduct({
        name: '',
        price: '',
        description: '',
        stock: '',
        category: '',
        images: [],
        productId: ''
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
      await db.collection('shopProducts').doc(productId).update({
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
      
      await db.collection('shopProducts').doc(productId).remove();

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
          await db.collection('shopProducts').doc(productId).remove();
        }
      } else {
        // 批量更新状态
        const onSale = batchAction === 'onSale';
        for (const productId of selectedProducts) {
          await db.collection('shopProducts').doc(productId).update({
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

  // 处理云存储图片选择
  const handleCloudImageSelect = (selectedImages) => {
    const imageUrls = selectedImages.map(img => img.url);
    setNewProduct(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls].slice(0, 5) // 限制最多5张图片
    }));
    setSelectedCloudImages(selectedImages);
  };

  // 打开图片选择器
  const openImageSelector = () => {
    setShowImageSelector(true);
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
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <ShoppingBagIcon className="w-8 h-8 mr-3" />
            商城管理
          </h1>
          {/* 同步状态显示 */}
          <div className="mt-2 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                syncStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' :
                syncStatus === 'success' ? 'bg-green-500' :
                syncStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-gray-600">
                {syncStatus === 'syncing' ? '同步中...' :
                 syncStatus === 'success' ? '已同步 (自动)' :
                 syncStatus === 'error' ? '同步失败' : '未同步'}
              </span>
            </div>
            {lastSyncTime && (
              <span className="text-gray-500">
                最后同步: {new Date(lastSyncTime).toLocaleString()}
              </span>
            )}
            {syncMessage && (
              <span className={`text-sm ${
                syncStatus === 'success' ? 'text-green-600' :
                syncStatus === 'error' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {syncMessage}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={syncFromInventory}
            disabled={syncStatus === 'syncing'}
            className={`btn btn-outline btn-sm ${
              syncStatus === 'syncing' ? 'loading' : ''
            }`}
            title="手动同步数据（系统每10分钟自动同步）"
          >
            {syncStatus === 'syncing' ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                同步中
              </>
            ) : (
              <>
                <CloudIcon className="w-4 h-4 mr-1" />
                手动同步
              </>
            )}
          </button>
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
          {/* 搜索和筛选栏 - 使用新的SearchBar组件 */}
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={handleSearch}
            placeholder="搜索商品名称、描述或分类..."
            filterOptions={[
              { value: '', label: '全部状态' },
              { value: true, label: '上架' },
              { value: false, label: '下架' }
            ]}
            filterValue={statusFilter}
            onFilterChange={(e) => handleFilterChange('status', e.target.value)}
            filterLabel="全部状态"
            secondFilterOptions={[
              { value: '', label: '全部分类' },
              ...categories.map(category => ({ value: category, label: category }))
            ]}
            secondFilterValue={categoryFilter}
            onSecondFilterChange={(e) => handleFilterChange('category', e.target.value)}
            secondFilterLabel="全部分类"
          />
          

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
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBagIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">暂无商品数据</p>
              </div>
            ) : (
              <>
                                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full table-fixed">
                    <thead>
                      <tr>
                        <th className="w-12">
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="w-48">产品信息</th>
                        <th className="w-24">分类</th>
                        <th className="w-20">品牌</th>
                        <th className="w-20">价格</th>
                        <th className="w-20">原价</th>
                        <th className="w-16">库存</th>
                        <th className="w-20">状态</th>
                        <th className="w-24">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.map((product) => (
                        <tr key={product._id} className={selectedProducts.includes(product._id) ? 'bg-base-200' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              className="checkbox"
                              checked={selectedProducts.includes(product._id)}
                              onChange={() => toggleSelectProduct(product._id)}
                            />
                          </td>
                          <td >
                            <div className="flex items-center gap-2">
                              {product.images && product.images.length > 0 && (
                                <img 
                                  src={product.images[0]} 
                                  alt={product.name}
                                  className="w-8 h-8 rounded object-cover"
                                />
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate">{product.name}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-primary">{product.category || '未分类'}</span>
                          </td>
                          <td>{product.brand || '-'}</td>
                          <td className="font-bold">¥{formatAmount(product.price)}</td>
                          <td className="text-gray-500">¥{formatAmount(product.originalPrice || 0)}</td>
                          <td>
                            <span className={`badge ${product.stock <= stockThreshold ? 'badge-error' : 'badge-success'}`}>
                              {product.stock || 0}
                              {product.stock <= stockThreshold && (
                                <ExclamationTriangleIcon className="w-4 h-4 inline ml-1" />
                              )}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${product.onSale ? 'badge-success' : 'badge-warning'}`}>
                              {product.onSale ? '在售' : '下架'}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-1">
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
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>


                 {/* 分页 */}
                 {computedTotalPages > 1 && (
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
                         {currentPage} / {computedTotalPages}
                       </button>
                       <button
                         className="join-item btn"
                         disabled={currentPage === computedTotalPages}
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
              <div className="stat-value text-primary">{filteredProducts.length}</div>
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
                  <table className="table table-zebra w-full table-fixed">
                    <thead>
                      <tr>
                        <th className="w-12">
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="w-48">产品信息</th>
                        <th className="w-24">分类</th>
                        <th className="w-20">品牌</th>
                        <th className="w-20">价格</th>
                        <th className="w-20">原价</th>
                        <th className="w-16">库存</th>
                        <th className="w-20">状态</th>
                        <th className="w-24">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.map((product) => (
                        <tr key={product._id} className={selectedProducts.includes(product._id) ? 'bg-base-200' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              className="checkbox"
                              checked={selectedProducts.includes(product._id)}
                              onChange={() => toggleSelectProduct(product._id)}
                            />
                          </td>
                          <td >
                            <div className="flex items-center gap-2">
                              {product.images && product.images.length > 0 && (
                                <img 
                                  src={product.images[0]} 
                                  alt={product.name}
                                  className="w-8 h-8 rounded object-cover"
                                />
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate">{product.name}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-primary">{product.category || '未分类'}</span>
                          </td>
                          <td>{product.brand || '-'}</td>
                          <td className="font-bold">¥{formatAmount(product.price)}</td>
                          <td className="text-gray-500">
                            {product.originalPrice ? `¥${formatAmount(product.originalPrice)}` : '-'}
                          </td>
                          <td>
                            <span className={`badge ${product.stock <= stockThreshold ? 'badge-error' : 'badge-success'}`}>
                              {product.stock || 0}
                              {product.stock <= stockThreshold && (
                                <ExclamationTriangleIcon className="w-4 h-4 inline ml-1" />
                              )}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${product.onSale ? 'badge-success' : 'badge-warning'}`}>
                              {product.onSale ? '在售' : '下架'}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-1">
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
                            </div>
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
          <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">添加商品</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">商品名称</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="请输入商品名称"
                    className="input input-bordered flex-1"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      loadInventoryProducts();
                      setShowProductSelector(true);
                    }}
                    className="btn btn-outline btn-primary flex items-center gap-2"
                    title="从仓库产品中选择"
                  >
                    <ArchiveBoxIcon className="w-4 h-4" />
                    关联仓库产品
                  </button>
                </div>
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
                {/* 图片上传选项 */}
                <div className="flex gap-3 mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="file-input file-input-bordered flex-1"
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                  />
                  <button
                    type="button"
                    onClick={openImageSelector}
                    className="btn btn-outline btn-primary flex items-center gap-2"
                    disabled={uploadingImages}
                  >
                    <CloudIcon className="w-4 h-4" />
                    从云存储选择
                  </button>
                </div>
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
                {/* 上传状态提示 */}
                {uploadingImages && (
                  <div className="text-center py-2 text-gray-500">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2 inline-block" />
                    图片上传中...
                  </div>
                )}

                {/* 图片数量提示 */}
                <div className="text-sm text-gray-500 mt-2">
                  已选择 {newProduct.images?.length || 0} 张图片 (最多5张)
                </div>
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
          <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">编辑商品</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">商品名称</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="请输入商品名称"
                    className="input input-bordered flex-1"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      loadInventoryProducts();
                      setShowProductSelector(true);
                    }}
                    className="btn btn-outline btn-primary flex items-center gap-2"
                    title="从仓库产品中选择"
                  >
                    <ArchiveBoxIcon className="w-4 h-4" />
                    关联仓库产品
                  </button>
                </div>
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
                {/* 图片上传选项 */}
                <div className="flex gap-3 mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="file-input file-input-bordered flex-1"
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                  />
                  <button
                    type="button"
                    onClick={openImageSelector}
                    className="btn btn-outline btn-primary flex items-center gap-2"
                    disabled={uploadingImages}
                  >
                    <CloudIcon className="w-4 h-4" />
                    从云存储选择
                  </button>
                </div>
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
                {/* 上传状态提示 */}
                {uploadingImages && (
                  <div className="text-center py-2 text-gray-500">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2 inline-block" />
                    图片上传中...
                  </div>
                )}

                {/* 图片数量提示 */}
                <div className="text-sm text-gray-500 mt-2">
                  已选择 {newProduct.images?.length || 0} 张图片 (最多5张)
                </div>
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

      {/* 仓库产品选择弹窗 */}
      {showProductSelector && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">选择仓库产品</h3>
            
            {/* 搜索框 */}
            <div className="form-control mb-4">
              <input
                type="text"
                placeholder="搜索产品名称..."
                className="input input-bordered"
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
              />
            </div>

            {/* 产品列表 */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {inventoryProducts
                .filter(product => 
                  product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
                )
                .map(product => (
                  <div
                    key={product._id}
                    className="card card-compact bg-base-100 shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => selectInventoryProduct(product)}
                  >
                    <div className="card-body p-4">
                      <div className="flex items-center gap-4">
                        {/* 产品图片 */}
                        <div className="avatar">
                          <div className="w-16 h-16 rounded">
                            {product.images && product.images.length > 0 ? (
                              <img src={product.images[0]} alt={product.name} className="object-cover" />
                            ) : (
                              <div className="bg-gray-200 flex items-center justify-center">
                                <PhotoIcon className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* 产品信息 */}
                        <div className="flex-1">
                          <h4 className="font-medium text-base">{product.name}</h4>
                          <div className="text-sm text-gray-500 mt-1">
                            <div>分类: {product.category || '未分类'}</div>
                            <div>价格: ¥{product.price || '0'}</div>
                            <div>库存: {product.stock || '0'} {product.unit || '件'}</div>
                          </div>
                          {product.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>
                        
                        {/* 选择按钮 */}
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectInventoryProduct(product);
                          }}
                        >
                          选择
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {inventoryProducts.filter(product => 
              product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
            ).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ArchiveBoxIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>没有找到匹配的仓库产品</p>
              </div>
            )}

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowProductSelector(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图片选择器 */}
      <ImageSelector
        isOpen={showImageSelector}
        onClose={() => setShowImageSelector(false)}
        onSelect={handleCloudImageSelect}
        selectedImages={selectedCloudImages}
        maxSelection={5}
        category="product"
      />
    </div>
  );
};

export default ShopPage;