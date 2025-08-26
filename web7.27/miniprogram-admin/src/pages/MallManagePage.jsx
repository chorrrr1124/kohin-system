import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Upload, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar, 
  Tag, 
  Gift, 
  Image as ImageIcon,
  ShoppingBag,
  Settings,
  Clock,
  DollarSign,
  Store,
  Home,
  Search,
  Filter,
  Download,
  Copy,
  Users,
  Percent
} from 'lucide-react'
import { app, ensureLogin } from '../utils/cloudbase'

const MallManagePage = () => {
  const [activeTab, setActiveTab] = useState('banners')
  const [banners, setBanners] = useState([])
  const [coupons, setCoupons] = useState([])
  const [categories, setCategories] = useState([])
  const [homepageConfig, setHomepageConfig] = useState({
    title: '夏日消暑·就喝「丘大叔」',
    subtitle: 'Lemon tea for Uncle Q',
    giftNote: '【赠6元代金券×1】',
    validityNote: '*自购买之日起3年内有效，可转赠可自用',
    prices: [
      { price: 30, originalPrice: 30 },
      { price: 86, originalPrice: 100 },
      { price: 66, originalPrice: 66 },
      { price: 168, originalPrice: 200 }
    ]
  })
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // 优惠券管理相关状态
  const [couponSearchTerm, setCouponSearchTerm] = useState('')
  const [couponStatusFilter, setCouponStatusFilter] = useState('all')
  const [couponTypeFilter, setCouponTypeFilter] = useState('all')
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [couponForm, setCouponForm] = useState({
    name: '',
    type: 'discount', // discount: 满减券, percent: 折扣券
    amount: '',
    percent: '',
    minAmount: '',
    maxAmount: '',
    maxCount: '',
    validDays: '',
    description: '',
    useLimit: '',
    categoryLimit: '',
    productLimit: '',
    status: 'active'
  })

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'homepage':
          await loadHomepageConfig()
          break
        case 'banners':
          await loadBanners()
          break
        case 'coupons':
          await loadCoupons()
          break
        case 'categories':
          await loadCategories()
          break
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHomepageConfig = async () => {
    try {
      await ensureLogin()
      const db = app.database()
      
      const result = await db.collection('homepage_config')
        .where({ type: 'promo' })
        .orderBy('updateTime', 'desc')
        .limit(1)
        .get()

      if (result.data.length > 0) {
        setHomepageConfig(result.data[0].config)
      }
    } catch (error) {
      console.error('加载首页配置失败:', error)
      // 使用默认配置
    }
  }

  const saveHomepageConfig = async () => {
    if (submitting) return
    
    try {
      setSubmitting(true)
      await ensureLogin()
      const db = app.database()
      
      // 检查是否已存在配置
      const existing = await db.collection('homepage_config')
        .where({ type: 'promo' })
        .get()

      if (existing.data.length > 0) {
        // 更新现有配置
        await db.collection('homepage_config')
          .doc(existing.data[0]._id)
          .update({
            config: homepageConfig,
            updateTime: new Date()
          })
      } else {
        // 创建新配置
        await db.collection('homepage_config').add({
          type: 'promo',
          config: homepageConfig,
          createTime: new Date(),
          updateTime: new Date()
        })
      }

      alert('首页配置保存成功！')
    } catch (error) {
      console.error('保存首页配置失败:', error)
      alert('保存失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const loadBanners = async () => {
    // 这里调用云开发API获取轮播图数据
    try {
      // 模拟数据，实际项目中替换为真实API调用
      const mockData = [
        {
          _id: '1',
          title: '新品上市',
          imageUrl: '/images/banner1.jpg',
          linkType: 'page',
          linkUrl: '/pages/products/products',
          status: 'active',
          sort: 1,
          startTime: '2024-01-01',
          endTime: '2024-12-31',
          createTime: '2024-01-01'
        }
      ]
      setBanners(mockData)
    } catch (error) {
      console.error('加载轮播图失败:', error)
    }
  }

  const loadCoupons = async () => {
    try {
      await ensureLogin()
      const db = app.database()
      
      const result = await db.collection('coupons')
        .orderBy('createTime', 'desc')
        .get()

      setCoupons(result.data || [])
    } catch (error) {
      console.error('加载优惠券失败:', error)
      // 使用模拟数据作为备选
      const mockData = [
        {
          _id: '1',
          name: '新用户专享券',
          type: 'discount',
          amount: 10,
          minAmount: 100,
          maxCount: 1000,
          usedCount: 150,
          status: 'active',
          validDays: 30,
          description: '新用户专享优惠券',
          createTime: new Date('2024-01-01'),
          updateTime: new Date('2024-01-01')
        },
        {
          _id: '2',
          name: '全场9折券',
          type: 'percent',
          percent: 90,
          minAmount: 50,
          maxAmount: 100,
          maxCount: 500,
          usedCount: 80,
          status: 'active',
          validDays: 15,
          description: '全场商品9折优惠',
          createTime: new Date('2024-01-15'),
          updateTime: new Date('2024-01-15')
        }
      ]
      setCoupons(mockData)
    }
  }

  const loadCategories = async () => {
    try {
      const mockData = [
        {
          _id: '1',
          name: '热销商品',
          icon: '/images/category/hot.png',
          type: 'hot',
          sort: 1,
          status: 'active'
        }
      ]
      setCategories(mockData)
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  }

  const handleAdd = () => {
    setEditingItem(null)
    setModalType(activeTab)
    setShowModal(true)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setModalType(activeTab)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除吗？')) return
    
    try {
      // 这里调用删除API
      console.log('删除项目:', id)
      loadData()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      // 这里调用状态切换API
      console.log('切换状态:', id, newStatus)
      loadData()
    } catch (error) {
      console.error('状态切换失败:', error)
    }
  }

  // 优惠券管理相关函数
  const handleAddCoupon = () => {
    setEditingCoupon(null)
    setCouponForm({
      name: '',
      type: 'discount',
      amount: '',
      percent: '',
      minAmount: '',
      maxAmount: '',
      maxCount: '',
      validDays: '',
      description: '',
      useLimit: '',
      categoryLimit: '',
      productLimit: '',
      status: 'active'
    })
    setShowCouponModal(true)
  }

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon)
    setCouponForm({
      name: coupon.name || '',
      type: coupon.type || 'discount',
      amount: coupon.amount || '',
      percent: coupon.percent || '',
      minAmount: coupon.minAmount || '',
      maxAmount: coupon.maxAmount || '',
      maxCount: coupon.maxCount || '',
      validDays: coupon.validDays || '',
      description: coupon.description || '',
      useLimit: coupon.useLimit || '',
      categoryLimit: coupon.categoryLimit || '',
      productLimit: coupon.productLimit || '',
      status: coupon.status || 'active'
    })
    setShowCouponModal(true)
  }

  const handleSaveCoupon = async () => {
    if (submitting) return
    
    try {
      setSubmitting(true)
      await ensureLogin()
      const db = app.database()
      
      const couponData = {
        ...couponForm,
        updateTime: new Date()
      }

      if (editingCoupon) {
        // 更新优惠券
        await db.collection('coupons')
          .doc(editingCoupon._id)
          .update(couponData)
      } else {
        // 创建新优惠券
        couponData.createTime = new Date()
        await db.collection('coupons').add(couponData)
      }

      setShowCouponModal(false)
      loadCoupons()
      alert(editingCoupon ? '优惠券更新成功！' : '优惠券创建成功！')
    } catch (error) {
      console.error('保存优惠券失败:', error)
      alert('保存失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCoupon = async (id) => {
    if (!confirm('确定要删除这个优惠券吗？删除后无法恢复。')) return
    
    try {
      await ensureLogin()
      const db = app.database()
      
      await db.collection('coupons').doc(id).remove()
      loadCoupons()
      alert('优惠券删除成功！')
    } catch (error) {
      console.error('删除优惠券失败:', error)
      alert('删除失败，请重试')
    }
  }

  const handleToggleCouponStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      await ensureLogin()
      const db = app.database()
      
      await db.collection('coupons').doc(id).update({
        status: newStatus,
        updateTime: new Date()
      })
      
      loadCoupons()
      alert(`优惠券已${newStatus === 'active' ? '启用' : '停用'}！`)
    } catch (error) {
      console.error('切换优惠券状态失败:', error)
      alert('操作失败，请重试')
    }
  }

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.name.toLowerCase().includes(couponSearchTerm.toLowerCase()) ||
                         coupon.description?.toLowerCase().includes(couponSearchTerm.toLowerCase())
    const matchesStatus = couponStatusFilter === 'all' || coupon.status === couponStatusFilter
    const matchesType = couponTypeFilter === 'all' || coupon.type === couponTypeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const renderBannerList = () => (
    <div className="space-y-4">
      {banners.map((banner) => (
        <div key={banner._id} className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-12 bg-gray-200 rounded-lg overflow-hidden">
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{banner.title}</h3>
                <p className="text-sm text-gray-500">
                  排序: {banner.sort} | 链接类型: {banner.linkType}
                </p>
                <p className="text-sm text-gray-500">
                  有效期: {banner.startTime} 至 {banner.endTime}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleStatusToggle(banner._id, banner.status)}
                className={`p-2 rounded-lg ${
                  banner.status === 'active' 
                    ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                    : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {banner.status === 'active' ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button
                onClick={() => handleEdit(banner)}
                className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(banner._id)}
                className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderCouponList = () => (
    <div className="space-y-6">
      {/* 搜索和筛选 */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜索优惠券名称或描述..."
                value={couponSearchTerm}
                onChange={(e) => setCouponSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={couponStatusFilter}
              onChange={(e) => setCouponStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="active">生效中</option>
              <option value="inactive">已停用</option>
            </select>
            
            <select
              value={couponTypeFilter}
              onChange={(e) => setCouponTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部类型</option>
              <option value="discount">满减券</option>
              <option value="percent">折扣券</option>
            </select>
          </div>
        </div>
      </div>

      {/* 优惠券列表 */}
      <div className="space-y-4">
        {filteredCoupons.map((coupon) => (
          <div key={coupon._id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    coupon.type === 'discount' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {coupon.type === 'discount' ? <DollarSign size={20} /> : <Percent size={20} />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{coupon.name}</h3>
                    <p className="text-sm text-gray-500">{coupon.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    coupon.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {coupon.status === 'active' ? '生效中' : '已停用'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">优惠内容:</span>
                    <span className="ml-2 text-red-600 font-semibold">
                      {coupon.type === 'discount' 
                        ? `满${coupon.minAmount}减${coupon.amount}`
                        : `${coupon.percent}折`
                      }
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">使用情况:</span>
                    <span className="ml-2">{coupon.usedCount || 0}/{coupon.maxCount}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">有效期:</span>
                    <span className="ml-2">{coupon.validDays}天</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">创建时间:</span>
                    <span className="ml-2">
                      {coupon.createTime ? new Date(coupon.createTime).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleToggleCouponStatus(coupon._id, coupon.status)}
                  className={`p-2 rounded-lg ${
                    coupon.status === 'active' 
                      ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                      : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                  }`}
                  title={coupon.status === 'active' ? '停用' : '启用'}
                >
                  {coupon.status === 'active' ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => handleEditCoupon(coupon)}
                  className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  title="编辑"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteCoupon(coupon._id)}
                  className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                  title="删除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredCoupons.length === 0 && (
          <div className="text-center py-12">
            <Gift className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">暂无优惠券</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderCategoryList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => (
        <div key={category._id} className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={category.icon} 
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-500">类型: {category.type}</p>
              </div>
            </div>
            
            <span className={`px-2 py-1 rounded-full text-xs ${
              category.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {category.status === 'active' ? '显示' : '隐藏'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">排序: {category.sort}</span>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleStatusToggle(category._id, category.status)}
                className={`p-1 rounded ${
                  category.status === 'active' 
                    ? 'text-green-600 hover:bg-green-50' 
                    : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                {category.status === 'active' ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button
                onClick={() => handleEdit(category)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => handleDelete(category._id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const tabs = [
    { key: 'banners', label: '轮播图管理', icon: ShoppingBag },
    { key: 'coupons', label: '优惠券管理', icon: Gift },
    { key: 'categories', label: '分类管理', icon: Store }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">商城装修管理</h1>
        <p className="text-gray-600">管理商城的轮播图、优惠券、分类等装修内容</p>
      </div>

      {/* 标签页 */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {tabs.find(t => t.key === activeTab)?.label}
            </h2>
            {activeTab === 'coupons' ? (
              <button
                onClick={handleAddCoupon}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                <span>添加优惠券</span>
              </button>
            ) : (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                <span>添加{activeTab === 'banners' ? '轮播图' : '分类'}</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div>
              {activeTab === 'banners' && renderBannerList()}
              {activeTab === 'coupons' && renderCouponList()}
              {activeTab === 'categories' && renderCategoryList()}
            </div>
          )}
        </div>
      </div>

      {/* 优惠券编辑模态框 */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingCoupon ? '编辑优惠券' : '添加优惠券'}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">优惠券名称 *</label>
                  <input
                    type="text"
                    value={couponForm.name}
                    onChange={(e) => setCouponForm({...couponForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入优惠券名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">优惠券类型 *</label>
                  <select
                    value={couponForm.type}
                    onChange={(e) => setCouponForm({...couponForm, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="discount">满减券</option>
                    <option value="percent">折扣券</option>
                  </select>
                </div>
              </div>

              {couponForm.type === 'discount' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">优惠金额 *</label>
                    <input
                      type="number"
                      value={couponForm.amount}
                      onChange={(e) => setCouponForm({...couponForm, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">使用门槛 *</label>
                    <input
                      type="number"
                      value={couponForm.minAmount}
                      onChange={(e) => setCouponForm({...couponForm, minAmount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">折扣比例 *</label>
                    <input
                      type="number"
                      value={couponForm.percent}
                      onChange={(e) => setCouponForm({...couponForm, percent: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="90 (表示9折)"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">使用门槛</label>
                    <input
                      type="number"
                      value={couponForm.minAmount}
                      onChange={(e) => setCouponForm({...couponForm, minAmount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大发放数量 *</label>
                  <input
                    type="number"
                    value={couponForm.maxCount}
                    onChange={(e) => setCouponForm({...couponForm, maxCount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">有效期(天) *</label>
                  <input
                    type="number"
                    value={couponForm.validDays}
                    onChange={(e) => setCouponForm({...couponForm, validDays: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">优惠券描述</label>
                <textarea
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({...couponForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入优惠券描述"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={couponForm.status}
                  onChange={(e) => setCouponForm({...couponForm, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">生效中</option>
                  <option value="inactive">已停用</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCouponModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveCoupon}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '保存中...' : (editingCoupon ? '保存' : '创建')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 其他模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? '编辑' : '添加'}
              {modalType === 'banners' ? '轮播图' : '分类'}
            </h3>
            
            <div className="space-y-4">
              {modalType === 'banners' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入轮播图标题"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">图片</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                      <p className="text-sm text-gray-500">点击上传图片</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">链接类型</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="page">页面</option>
                      <option value="product">商品</option>
                    </select>
                  </div>
                </>
              )}
              
              {modalType === 'categories' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">分类名称</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入分类名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">分类图标</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                      <p className="text-sm text-gray-500">点击上传图标</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingItem ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MallManagePage