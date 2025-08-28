import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { app, ensureLogin } from '../utils/cloudbase';

const InventoryManagePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentCategory, setCurrentCategory] = useState('全部');
  const [currentBrand, setCurrentBrand] = useState('全部');
  const [categories, setCategories] = useState(['全部']);
  const [brands, setBrands] = useState(['全部']);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    onSale: 0,
    lowStock: 0,
    categoryCount: 0
  });

  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    type: '',
    brand: '',
    price: '',
    originalPrice: '',
    stock: '',
    onSale: true,
    description: '',
    imageUrl: '',
    specification: '',
    category: '',
    promotionInfo: '',
    remark: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  // 加载产品数据
  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('🔄 开始加载库存数据...');
      
      await ensureLogin();
      console.log('✅ 登录成功');
      
      const db = app.database();
      console.log('📊 数据库实例:', db);
      
      const result = await db.collection('products')
        .orderBy('createTime', 'desc')
        .get();
      
      console.log('📋 数据库查询结果:', result);
      console.log('📊 查询到的产品数量:', result.data?.length || 0);
      
      const productsData = result.data || [];
      setProducts(productsData);
      processProductData(productsData);
      console.log('✅ 库存数据加载完成');
    } catch (error) {
      console.error('❌ 加载库存数据失败:', error);
      
      // 如果是集合不存在的错误，尝试初始化数据库
      if (error.code === 'DATABASE_COLLECTION_NOT_EXIST') {
        console.log('🔧 检测到集合不存在，尝试初始化数据库...');
        await initializeDatabase();
      } else {
        console.error('❌ 其他错误:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据库集合
  const initializeDatabase = async () => {
    try {
      console.log('🔧 开始初始化数据库集合...');
      
      // 调用云函数初始化数据库
      const result = await app.callFunction({
        name: 'initDatabase',
        data: {}
      });
      
      console.log('✅ 数据库初始化结果:', result);
      
      if (result.result && result.result.success) {
        alert('数据库初始化成功！正在重新加载数据...');
        await loadProducts();
        return true;
      } else {
        console.error('❌ 数据库初始化失败:', result);
        alert('数据库初始化失败: ' + (result.result?.message || '未知错误'));
        return false;
      }
    } catch (error) {
      console.error('❌ 调用初始化云函数失败:', error);
      alert('初始化失败: ' + error.message);
      return false;
    }
  };

  // 处理产品数据
  const processProductData = (productsData) => {
    // 统计数据
    const onSaleCount = productsData.filter(p => p.onSale).length;
    const lowStockCount = productsData.filter(p => p.stock < 10).length;
    
    // 提取所有产品类型
    const allTypes = productsData.map(p => p.type);
    const uniqueCategories = ['全部'].concat(Array.from(new Set(allTypes))).filter(type => type !== null && type !== undefined && type !== '');
    
    // 提取所有品牌
    const allBrands = productsData.map(p => p.brand);
    const uniqueBrands = ['全部'].concat(Array.from(new Set(allBrands))).filter(brand => brand !== null && brand !== undefined && brand !== '');
    
    setCategories(uniqueCategories);
    setBrands(uniqueBrands);
    
    setStats({
      total: productsData.length,
      onSale: onSaleCount,
      lowStock: lowStockCount,
      categoryCount: uniqueCategories.length - 1
    });
  };

  // 获取筛选后的产品
  const getFilteredProducts = () => {
    let filtered = products;
    
    // 按分类筛选
    if (currentCategory !== '全部') {
      filtered = filtered.filter(p => p.type === currentCategory);
    }
    
    // 按品牌筛选
    if (currentBrand !== '全部') {
      filtered = filtered.filter(p => p.brand === currentBrand);
    }
    
    // 按搜索词筛选
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.productId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  // 保存产品
  const saveProduct = async () => {
    try {
      if (!formData.name || !formData.type || !formData.brand) {
        alert('请填写必填字段');
        return;
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        originalPrice: parseFloat(formData.originalPrice) || 0,
        stock: parseInt(formData.stock) || 0,
        updateTime: new Date(),
        createTime: editingProduct ? editingProduct.createTime : new Date()
      };

      if (editingProduct) {
        // 更新产品
        await app.database().collection('products').doc(editingProduct._id).update(productData);
        console.log('✅ 产品更新成功');
      } else {
        // 新增产品
        await app.database().collection('products').add(productData);
        console.log('✅ 产品新增成功');
      }

      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        productId: '',
        name: '',
        type: '',
        brand: '',
        price: '',
        originalPrice: '',
        stock: '',
        onSale: true,
        description: '',
        imageUrl: '',
        specification: '',
        category: '',
        promotionInfo: '',
        remark: ''
      });
      
      await loadProducts();
      alert(editingProduct ? '产品更新成功！' : '产品新增成功！');
    } catch (error) {
      console.error('❌ 保存产品失败:', error);
      alert('保存失败: ' + error.message);
    }
  };

  // 删除产品
  const deleteProduct = async (productId) => {
    if (!confirm('确定要删除这个产品吗？')) return;
    
    try {
      await app.database().collection('products').doc(productId).remove();
      console.log('✅ 产品删除成功');
      await loadProducts();
      alert('产品删除成功！');
    } catch (error) {
      console.error('❌ 删除产品失败:', error);
      alert('删除失败: ' + error.message);
    }
  };

  // 切换产品状态
  const toggleProductStatus = async (product) => {
    try {
      await app.database().collection('products').doc(product._id).update({
        onSale: !product.onSale,
        updateTime: new Date()
      });
      console.log('✅ 产品状态更新成功');
      await loadProducts();
    } catch (error) {
      console.error('❌ 更新产品状态失败:', error);
      alert('更新失败: ' + error.message);
    }
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">仓库库存管理</h1>
        <p className="text-gray-600">管理商城产品库存，查看库存统计和产品信息</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总产品数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">在售中</p>
              <p className="text-2xl font-bold text-green-600">{stats.onSale}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">库存不足</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">产品分类</p>
              <p className="text-2xl font-bold text-purple-600">{stats.categoryCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索产品名称或ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* 分类筛选 */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={currentCategory}
              onChange={(e) => setCurrentCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* 品牌筛选 */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={currentBrand}
              onChange={(e) => setCurrentBrand(e.target.value)}
            >
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData({
                productId: '',
                name: '',
                type: '',
                brand: '',
                price: '',
                originalPrice: '',
                stock: '',
                onSale: true,
                description: '',
                imageUrl: '',
                specification: '',
                category: '',
                promotionInfo: '',
                remark: ''
              });
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增产品
          </button>
        </div>
      </div>

      {/* 产品列表 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">产品列表</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无产品</h3>
            <p className="text-gray-500 mb-4">开始创建您的第一个产品</p>
            <button
              onClick={() => {
                setEditingProduct(null);
                setFormData({
                  productId: '',
                  name: '',
                  type: '',
                  brand: '',
                  price: '',
                  originalPrice: '',
                  stock: '',
                  onSale: true,
                  description: '',
                  imageUrl: '',
                  specification: '',
                  category: '',
                  promotionInfo: '',
                  remark: ''
                });
                setShowModal(true);
              }}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              新增产品
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    产品信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    品牌
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    价格
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    原价
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    库存
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {product.imageUrl ? (
                            <img className="h-10 w-10 rounded-lg object-cover" src={product.imageUrl} alt={product.name} />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">ID: {product.productId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.brand}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{product.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{product.originalPrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stock < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleProductStatus(product)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.onSale 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.onSale ? '在售' : '停售'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setFormData({
                              productId: product.productId || '',
                              name: product.name || '',
                              type: product.type || '',
                              brand: product.brand || '',
                              price: product.price?.toString() || '',
                              originalPrice: product.originalPrice?.toString() || '',
                              stock: product.stock?.toString() || '',
                              onSale: product.onSale !== false,
                              description: product.description || '',
                              imageUrl: product.imageUrl || '',
                              specification: product.specification || '',
                              category: product.category || '',
                              promotionInfo: product.promotionInfo || '',
                              remark: product.remark || ''
                            });
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 新增/编辑产品弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingProduct ? '编辑产品' : '新增产品'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">产品ID *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.productId}
                  onChange={(e) => setFormData({...formData, productId: e.target.value})}
                  placeholder="请输入产品ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">产品名称 *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="请输入产品名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">产品分类 *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  placeholder="请输入产品分类"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">品牌 *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  placeholder="请输入品牌"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">原价</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">库存</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">产品描述</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="请输入产品描述"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">图片URL</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">规格</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.specification}
                  onChange={(e) => setFormData({...formData, specification: e.target.value})}
                  placeholder="请输入产品规格"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">品类</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="请输入产品品类"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">促销信息</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.promotionInfo}
                  onChange={(e) => setFormData({...formData, promotionInfo: e.target.value})}
                  placeholder="请输入产品促销信息"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  value={formData.remark}
                  onChange={(e) => setFormData({...formData, remark: e.target.value})}
                  placeholder="请输入产品备注"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="onSale"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.onSale}
                  onChange={(e) => setFormData({...formData, onSale: e.target.checked})}
                />
                <label htmlFor="onSale" className="ml-2 block text-sm text-gray-900">
                  在售状态
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-outline"
              >
                取消
              </button>
              <button
                onClick={saveProduct}
                className="btn btn-primary"
              >
                {editingProduct ? '更新' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagePage; 