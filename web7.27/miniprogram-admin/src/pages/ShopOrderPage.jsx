import React, { useState, useEffect } from 'react';
import { 
  ShoppingCartIcon, 
  PlusIcon, 
  MinusIcon, 
  TrashIcon,
  CreditCardIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  WalletIcon,
  GiftIcon,
  CurrencyDollarIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { app, ensureLogin } from '../utils/cloudbase';

const ShopOrderPage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderForm, setOrderForm] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    paymentMethod: 'cash',
    notes: '',
    usePrepaid: false,
    prepaidAmount: 0,
    prepaidProducts: [],
    prepaidType: 'amount'
  });
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // 客户选择弹窗
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');

  // 预存信息
  const [prepaidRecords, setPrepaidRecords] = useState([]);
  const [showPrepaidSelector, setShowPrepaidSelector] = useState(false);

  // 预存产品创建相关状态
  const [createPrepaidMode, setCreatePrepaidMode] = useState(false);
  const [prepaidProductData, setPrepaidProductData] = useState({
    selectedProducts: [],
    totalAmount: 0
  });

  // 预存扣费相关状态
  const [prepaidDeductionMode, setPrepaidDeductionMode] = useState(false);
  const [hasPrepaidProducts, setHasPrepaidProducts] = useState(false);

  const paymentMethods = [
    { value: 'cash', label: '现金支付', icon: BanknotesIcon, color: 'badge-success' },
    { value: 'wechat', label: '微信支付', icon: WalletIcon, color: 'badge-primary' },
    { value: 'alipay', label: '支付宝', icon: CreditCardIcon, color: 'badge-info' },
    { value: 'prestore', label: '预存扣费', icon: WalletIcon, color: 'badge-info' }
  ];

  // 加载商品数据
  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  // 加载客户预存记录
  useEffect(() => {
    if (orderForm.customerId) {
      loadPrepaidRecords();
    }
  }, [orderForm.customerId, cart]);

  const loadProducts = async () => {
    try {
      const db = app.database();
      const result = await db.collection('products').get();
      setProducts(result.data || []);
    } catch (error) {
    setProducts([]);
      console.error('加载商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const db = app.database();
      const result = await db.collection('customers').get();
      setCustomers(result.data || []);
    } catch (error) {
    setProducts([]);
      setCustomers([]);
    console.error('加载客户失败:', error);
    }
  };

  const loadPrepaidRecords = async () => {
    try {
      const db = app.database();
      
      if (cart.length > 0) {
        const productIds = cart.map(item => item.productId);
        const result = await db.collection('prepaidRecords')
          .where({
            customerId: orderForm.customerId,
            type: 'product',
            productId: db.command.in(productIds),
            status: 'active'
          })
          .get();
        setPrepaidRecords(result.data || []);
      } else {
        const result = await db.collection('prepaidRecords')
          .where({
            customerId: orderForm.customerId,
            status: 'active'
          })
          .get();
        setPrepaidRecords(result.data || []);
      }
    } catch (error) {
    setProducts([]);
      setPrepaidRecords([]);
    console.error('加载预存记录失败:', error);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product._id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.productId === product._id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product._id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        stock: product.stock
      }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const selectCustomer = (c) => {
    console.log('选择客户:', c);
    
    // 构建完整地址
    let fullAddress = '';
    if (c.address) {
      if (typeof c.address === 'string') {
        fullAddress = c.address;
      } else if (c.address.fullAddress) {
        fullAddress = c.address.fullAddress;
      } else if (c.address.address) {
        fullAddress = c.address.address;
      } else if (c.address.province || c.address.city || c.address.district || c.address.detail) {
        const parts = [
          c.address.province,
          c.address.city,
          c.address.district,
          c.address.detail
        ].filter(Boolean);
        fullAddress = parts.join('');
      } else {
        // 更多字段命名兼容：provinceName/cityName/districtName/countyName/area/areaName + detail/addressDetail/detailInfo/street
        const provinceVal = c.address.provinceName || c.address.province || '';
        const cityVal = c.address.cityName || c.address.city || '';
        const districtVal = c.address.districtName || c.address.countyName || c.address.area || c.address.areaName || c.address.district || '';
        const streetVal = c.address.streetName || c.address.street || '';
        const detailVal = c.address.addressDetail || c.address.detailInfo || c.address.detail || '';
        const namedParts = [provinceVal, cityVal, districtVal, streetVal, detailVal].filter(Boolean);
        if (namedParts.length > 0) {
          fullAddress = namedParts.join('');
        } else if (Array.isArray(c.address.region) && c.address.region.length > 0) {
          // region: [province, city, district]
          fullAddress = [...c.address.region, c.address.addressDetail || c.address.detailInfo || c.address.detail || c.address.street || '']
            .filter(Boolean)
            .join('');
        } else if (c.address.address_component) {
          // 腾讯地图风格 address_component
          const ac = c.address.address_component;
          fullAddress = [ac.province, ac.city, ac.district, ac.street, ac.street_number, c.address.addressDetail || c.address.detail]
            .filter(Boolean)
            .join('');
        }
      }
    }

    // 回退解析 contacts 获取电话与地址
    let firstContact = null;
    try {
      if (c.contacts) {
        const contactsParsed = typeof c.contacts === 'string' ? JSON.parse(c.contacts) : c.contacts;
        if (Array.isArray(contactsParsed) && contactsParsed.length > 0) {
          firstContact = contactsParsed[0];
        }
      }
    } catch (e) {
      console.error('解析客户 contacts 失败:', e);
    }

    // 处理电话回退
    const phoneValue = c.phone || (firstContact && firstContact.phone) || '';
    // 处理地址回退
    if (!fullAddress && firstContact) {
      const source = (firstContact.address && typeof firstContact.address === 'object')
        ? firstContact.address
        : firstContact;

      const provinceVal = (source && (source.provinceName || source.province)) || '';
      const cityVal = (source && (source.cityName || source.city)) || '';
      const districtVal = (source && (source.districtName || source.countyName || source.area || source.areaName || source.district)) || '';
      const streetVal = (source && (source.streetName || source.street)) || '';
      const detailVal = (source && (source.addressDetail || source.detailInfo || source.detail)) || '';

      if (provinceVal || cityVal || districtVal || (Array.isArray(source.region) && source.region.length > 0) || source.address_component) {
        // 优先结构化/region
        if (Array.isArray(source.region) && source.region.length > 0) {
          fullAddress = [...source.region, detailVal || streetVal || (firstContact.address && typeof firstContact.address === 'string' ? firstContact.address : '')]
            .filter(Boolean)
            .join('');
        } else if (source.address_component) {
          const ac = source.address_component;
          fullAddress = [ac.province, ac.city, ac.district, ac.street, ac.street_number, detailVal || streetVal]
            .filter(Boolean)
            .join('');
        } else {
          fullAddress = [provinceVal, cityVal, districtVal, streetVal, detailVal]
            .filter(Boolean)
            .join('');
        }
      } else if (firstContact.address && typeof firstContact.address === 'string') {
        // 最后才退回纯字符串
        fullAddress = firstContact.address;
      }
    }
    
    console.log('客户地址信息:', {
      original: c.address,
      fromContact: firstContact && (firstContact.address || firstContact.region || firstContact.address_component),
      fullAddress: fullAddress
    });
    
    setOrderForm(prev => ({
      ...prev,
      customerId: c._id,
      customerName: c.name || "",
      customerPhone: phoneValue || "",
      customerAddress: fullAddress || "",
      // 重置预存状态
      usePrepaid: false,
      prepaidAmount: 0,
      prepaidProducts: [],
      prepaidType: 'amount'
    }));
    setShowCustomerSelector(false);
    setCustomerSearch('');
  };

  const getPrepaidRecordIcon = (record) => {
    return record.type === 'product' ? CubeIcon : CurrencyDollarIcon;
  };

  const getPrepaidRecordText = (record) => {
    if (record.type === 'product') {
      return `余额: ${record.balance}个`;
    } else {
      return `余额: ¥${record.balance.toFixed(2)}`;
    }
  };

  const isPrepaidRecordMatched = (record) => {
    if (record.type === 'product') {
      return cart.some(item => item.productId === record.productId);
    }
    return true;
  };

  const selectPrepaidRecord = (record) => {
    if (record.type === 'amount') {
      setOrderForm(prev => ({
        ...prev,
        usePrepaid: true,
        prepaidType: 'amount',
        prepaidAmount: record.balance,
        prepaidProducts: []
      }));
    } else {
      setOrderForm(prev => ({
        ...prev,
        usePrepaid: true,
        prepaidType: 'product',
        prepaidAmount: 0,
        prepaidProducts: [record]
      }));
    }
  };

  const cancelPrepaid = () => {
    setOrderForm(prev => ({
      ...prev,
      usePrepaid: false,
      prepaidAmount: 0,
      prepaidProducts: [],
      prepaidType: 'amount'
    }));
  };

  // 处理预存产品模式
  const handlePrepaidProductMode = () => {
    if (!orderForm.customerId) {
      alert('请先选择客户');
      return;
    }
    
    if (cart.length === 0) {
      alert('购物车为空，无法创建预存产品');
      return;
    }

    setCreatePrepaidMode(true);
    setPrepaidDeductionMode(false);
    
    const selectedProducts = cart.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.price,
      totalAmount: item.price * item.quantity
    }));
    
    setPrepaidProductData({
      selectedProducts,
      totalAmount: getTotalAmount()
    });
  };

  // 处理预存扣费模式
  const handlePrepaidDeductionMode = async () => {
    if (!orderForm.customerId) {
      alert('请先选择客户');
      return;
    }
    
    if (cart.length === 0) {
      alert('购物车为空，无法使用预存扣费');
      return;
    }

    try {
      const db = app.database();
      const totalAmount = getTotalAmount();
      
      // 检查客户的预存金额账户余额
      const amountResult = await db.collection('prepaidRecords')
        .where({
          customerId: orderForm.customerId,
          type: 'amount',
          status: 'active'
        })
        .get();
      
      // 计算总预存金额余额
      const totalPrepaidBalance = amountResult.data.reduce((sum, record) => sum + (record.balance || 0), 0);
      
      if (totalPrepaidBalance <= 0) {
        alert('该客户没有预存金额余额，无法使用预存扣费');
        return;
      }
      
      if (totalPrepaidBalance < totalAmount) {
        alert(`预存金额余额不足！\n订单总金额：¥${totalAmount.toFixed(2)}\n可用余额：¥${totalPrepaidBalance.toFixed(2)}\n差额：¥${(totalAmount - totalPrepaidBalance).toFixed(2)}`);
        return;
      }
      
      // 余额充足，设置预存扣费模式
      setOrderForm(prev => ({ 
        ...prev, 
        paymentMethod: 'prestore',
        usePrepaid: true,
        prepaidAmount: totalAmount, // 使用全部订单金额进行扣减
        prepaidProducts: [],
        prepaidType: "amount"
      }));
      setCreatePrepaidMode(false);
      setPrepaidDeductionMode(true);
      setPrepaidProductData({ selectedProducts: [], totalAmount: 0 });
      
      // 显示余额信息
      alert(`预存扣费模式已启用！\n订单总金额：¥${totalAmount.toFixed(2)}\n可用余额：¥${totalPrepaidBalance.toFixed(2)}\n扣减后余额：¥${(totalPrepaidBalance - totalAmount).toFixed(2)}`);
      
    } catch (error) {
      console.error('检查预存金额失败:', error);
      alert('检查预存金额失败，请重试');
    }
  };

  // 提交订单
  const submitOrder = async () => {
    try {
      await ensureLogin();
      
      if (!orderForm.customerId || !orderForm.customerName || !orderForm.customerPhone || !orderForm.customerAddress) {
        alert('请填写完整的客户信息');
        return;
      }

      if (cart.length === 0) {
        alert('购物车为空，无法下单');
        return;
      }

      for (const item of cart) {
        const product = products.find(p => p._id === item.productId);
        if (!product || product.stock < item.quantity) {
          alert(`商品 ${item.productName} 库存不足`);
          return;
        }
      }

      const db = app.database();
      const orderId = `ORD${Date.now()}`;
      const now = new Date();

      const orderData = {
        orderId,
        customerId: orderForm.customerId,
        customerName: orderForm.customerName,
        customerPhone: orderForm.customerPhone,
        customerAddress: orderForm.customerAddress,
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          totalAmount: item.price * item.quantity
        })),
        totalAmount: getTotalAmount(),
        paymentMethod: orderForm.paymentMethod,
        status: orderForm.paymentMethod === 'cash' || orderForm.paymentMethod === 'wechat' || orderForm.paymentMethod === 'alipay' ? '已付款' : '待发货',
        notes: orderForm.notes,
        createTime: now,
        updateTime: now
      };

      const stockUpdates = cart.map(item => 
        db.collection('products').doc(item.productId).update({
          stock: db.command.inc(-item.quantity)
        })
      );

      let prepaidUpdates = [];
      if (orderForm.usePrepaid) {
        if (orderForm.prepaidType === 'amount') {
          const prepaidRecord = prepaidRecords.find(r => r.type === 'amount' && r.balance >= orderForm.prepaidAmount);
          if (prepaidRecord) {
            prepaidUpdates.push(
              db.collection('prepaidRecords').doc(prepaidRecord._id).update({
                balance: db.command.inc(-orderForm.prepaidAmount)
              })
            );
          }
        } else if (orderForm.prepaidType === 'product') {
          for (const prepaidProduct of orderForm.prepaidProducts) {
            const cartItem = cart.find(item => item.productId === prepaidProduct.productId);
            if (cartItem) {
              const deductQuantity = Math.min(prepaidProduct.balance, cartItem.quantity);
              prepaidUpdates.push(
                db.collection('prepaidRecords').doc(prepaidProduct._id).update({
                  balance: db.command.inc(-deductQuantity)
                })
              );
            }
          }
        }
      }

      await Promise.all([
        db.collection('orders').add(orderData),
        ...stockUpdates,
        ...prepaidUpdates
      ]);

      console.log('订单创建成功');
      setOrderSuccess(true);
      setCart([]);
      setOrderForm({
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        paymentMethod: 'cash',
        notes: '',
        usePrepaid: false,
        prepaidAmount: 0,
        prepaidProducts: [],
        prepaidType: 'amount'
      });
      setCreatePrepaidMode(false);
      setPrepaidDeductionMode(false);
      setPrepaidProductData({ selectedProducts: [], totalAmount: 0 });
      
      // 关闭订单弹窗
      setShowOrderForm(false);
      
      const paymentStatus = orderForm.paymentMethod === 'cash' || orderForm.paymentMethod === 'wechat' || orderForm.paymentMethod === 'alipay' ? '已支付' : '待发货';
      alert(`订单创建成功！订单号：${orderId}，状态：${paymentStatus}`);
      
      // 刷新预存记录页面（如果存在）
      if (window.refreshPrepaidRecords) {
        window.refreshPrepaidRecords();
      }

    } catch (error) {
    setProducts([]);
      console.error('提交订单失败:', error);
      alert('提交订单失败，请重试');
    }
  };

  // 提交预存产品订单
  const submitPrepaidProductOrder = async () => {
    try {
      await ensureLogin();
      
      const db = app.database();
      const orderId = `ORD${Date.now()}`;
      const now = new Date();

      const orderData = {
        orderId,
        customerId: orderForm.customerId,
        customerName: orderForm.customerName,
        customerPhone: orderForm.customerPhone,
        customerAddress: orderForm.customerAddress,
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          totalAmount: item.price * item.quantity
        })),
        totalAmount: getTotalAmount(),
        paymentMethod: 'prepaid',
        status: '待发货',
        notes: orderForm.notes,
        createTime: now,
        updateTime: now
      };

      const stockUpdates = cart.map(item => 
        db.collection('products').doc(item.productId).update({
          stock: db.command.inc(-item.quantity)
        })
      );

      const prepaidRecords = cart.map(item => ({
        customerId: orderForm.customerId,
        customerName: orderForm.customerName,
        customerPhone: orderForm.customerPhone, // 修复：添加客户电话字段
        productId: item.productId,
        productName: item.productName,
        type: 'product',
        balance: item.quantity,
        unitPrice: item.price,
        totalAmount: item.price * item.quantity,
        source: '商城下单预存',
        status: 'active',
        createTime: now,
        updateTime: now
      }));

      await Promise.all([
        db.collection('orders').add(orderData),
        ...stockUpdates,
        ...prepaidRecords.map(record => db.collection('prepaidRecords').add(record))
      ]);
      
      setOrderSuccess(true);
      setCart([]);
      setOrderForm({
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        paymentMethod: 'cash',
        notes: '',
        usePrepaid: false,
        prepaidAmount: 0,
        prepaidProducts: [],
        prepaidType: 'amount'
      });
      setCreatePrepaidMode(false);
      setPrepaidDeductionMode(false);
      setPrepaidProductData({ selectedProducts: [], totalAmount: 0 });
      
      // 关闭订单弹窗
      setShowOrderForm(false);
      
      alert(`预存产品订单创建成功！已为 ${orderForm.customerName} 创建了 ${cart.length} 个预存产品记录`);
      
      // 刷新预存记录页面（如果存在）
      if (window.refreshPrepaidRecords) {
        window.refreshPrepaidRecords();
      }

    } catch (error) {
    setProducts([]);
      console.error('提交预存产品订单失败:', error);
      alert('提交预存产品订单失败，请重试');
    }
  };

  // 提交预存扣费订单
  const submitPrepaidDeductionOrder = async () => {
    try {
      await ensureLogin();
      
      const db = app.database();
      const totalAmount = getTotalAmount();
      
      // 获取客户的预存金额记录
      const amountResult = await db.collection('prepaidRecords')
        .where({
          customerId: orderForm.customerId,
          type: 'amount',
          status: 'active'
        })
        .orderBy('createTime', 'asc') // 按创建时间升序，优先使用较早的预存记录
        .get();
      
      // 计算总预存金额余额
      const totalPrepaidBalance = amountResult.data.reduce((sum, record) => sum + (record.balance || 0), 0);
      
      if (totalPrepaidBalance < totalAmount) {
        alert(`预存金额余额不足！\n订单总金额：¥${totalAmount.toFixed(2)}\n可用余额：¥${totalPrepaidBalance.toFixed(2)}`);
        return;
      }

      const orderId = `ORD${Date.now()}`;
      const now = new Date();

      const orderData = {
        orderId,
        customerId: orderForm.customerId,
        customerName: orderForm.customerName,
        customerPhone: orderForm.customerPhone,
        customerAddress: orderForm.customerAddress,
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          totalAmount: item.price * item.quantity
        })),
        totalAmount: totalAmount,
        actualAmount: 0, // 使用预存扣费，实付金额为0
        paymentMethod: 'prestore',
        status: '待发货',
        notes: orderForm.notes,
        createTime: now,
        updateTime: now
      };

      const stockUpdates = cart.map(item => 
        db.collection('products').doc(item.productId).update({
          stock: db.command.inc(-item.quantity)
        })
      );

      // 按时间顺序扣减预存金额
      const prepaidUpdates = [];
      let remainingAmount = totalAmount;
      
      for (const record of amountResult.data) {
        if (remainingAmount <= 0) break;
        
        const deductAmount = Math.min(remainingAmount, record.balance);
        if (deductAmount > 0) {
          prepaidUpdates.push(
            db.collection('prepaidRecords').doc(record._id).update({
              balance: db.command.inc(-deductAmount)
            })
          );
          remainingAmount -= deductAmount;
        }
      }

      await Promise.all([
        db.collection('orders').add(orderData),
        ...stockUpdates,
        ...prepaidUpdates
      ]);
      
      setOrderSuccess(true);
      setCart([]);
      setOrderForm({
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        paymentMethod: 'cash',
        notes: '',
        usePrepaid: false,
        prepaidAmount: 0,
        prepaidProducts: [],
        prepaidType: 'amount'
      });
      setCreatePrepaidMode(false);
      setPrepaidDeductionMode(false);
      setPrepaidProductData({ selectedProducts: [], totalAmount: 0 });
      
      // 关闭订单弹窗
      setShowOrderForm(false);
      
      alert(`预存扣费订单创建成功！\n订单号：${orderId}\n已为 ${orderForm.customerName} 扣减预存金额 ¥${totalAmount.toFixed(2)}`);
      
      // 刷新预存记录页面（如果存在）
      if (window.refreshPrepaidRecords) {
        window.refreshPrepaidRecords();
      }

    } catch (error) {
      console.error('提交预存扣费订单失败:', error);
      alert('提交预存扣费订单失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">商城下单</h1>
        <div className="text-sm text-base-content/60">
          购物车中有 {cart.length} 件商品
        </div>
      </div>

      {orderSuccess && (
        <div className="alert alert-success mb-6">
          <CheckCircleIcon className="w-6 h-6" />
          <div>
            <h3 className="font-bold">订单创建成功！</h3>
            <div className="text-sm">订单已提交，请等待处理</div>
          </div>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setOrderSuccess(false)}
          >
            关闭
          </button>
        </div>
      )}

      {/* 商品列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {products.map(product => (
          <div key={product._id} className="card bg-base-100 shadow-xl">
            <figure className="px-4 pt-4">
              <img 
                src={product.image || '/images/placeholder.png'} 
                alt={product.name}
                className="rounded-xl w-full h-48 object-cover"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">{product.name}</h2>
              <p className="text-base-content/60 line-clamp-2">{product.description}</p>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold text-primary">¥{product.price}</div>
                <div className="text-sm text-base-content/60">库存: {product.stock}</div>
              </div>
              <div className="card-actions justify-end">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                >
                  <PlusIcon className="w-4 h-4" />
                  加入购物车
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 购物车 */}
      {cart.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">购物车</h2>
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.productId} className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.productName}</h3>
                    <div className="text-sm text-base-content/60">¥{item.price} × {item.quantity}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      <MinusIcon className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center">{item.quantity}</span>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                    <button
                      className="btn btn-sm btn-error"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="divider"></div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">总计: ¥{getTotalAmount().toFixed(2)}</span>
              </div>
              
              <button
                className="btn btn-primary w-full"
                onClick={() => setShowOrderForm(true)}
                disabled={cart.length === 0}
              >
                <CreditCardIcon className="w-5 h-5" />
                立即下单
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 订单表单弹窗 */}
      {showOrderForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-6">商城下单</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 客户信息 */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold border-b pb-2">客户信息</h4>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">选择客户</span>
                    <span className="label-text-alt text-info">
                      可从客户库选择快速填充信息
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="客户姓名"
                        value={orderForm.customerName}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, customerName: e.target.value }))}
                      />
                    </div>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setShowCustomerSelector(true)}
                    >
                      <UserIcon className="w-4 h-4" />
                      选择客户
                    </button>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">客户姓名 *</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/50" />
                    <input
                      type="text"
                      className="input input-bordered w-full pl-10"
                      placeholder="请输入客户姓名"
                      value={orderForm.customerName}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, customerName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">联系电话 *</span>
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/50" />
                    <input
                      type="tel"
                      className="input input-bordered w-full pl-10"
                      placeholder="请输入联系电话"
                      value={orderForm.customerPhone}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">收货地址 *</span>
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-3 w-5 h-5 text-base-content/50" />
                    <textarea
                      className="textarea textarea-bordered w-full pl-10"
                      placeholder="请输入详细收货地址"
                      rows={3}
                      value={orderForm.customerAddress}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, customerAddress: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* 支付信息 */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold border-b pb-2">支付信息</h4>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">支付方式 *</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map(method => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.value}
                          type="button"
                          className={`btn btn-outline ${orderForm.paymentMethod === method.value ? 'btn-active' : ''}`}
                          onClick={() => {
                            if (method.value === "prestore") {
                              handlePrepaidDeductionMode();
                            } else {
                              setOrderForm(prev => ({ 
                                ...prev, 
                                paymentMethod: method.value,
                                usePrepaid: false,
                                prepaidAmount: 0,
                                prepaidProducts: [],
                                prepaidType: "amount"
                              }));
                              setCreatePrepaidMode(false);
                              setPrepaidDeductionMode(false);
                              setPrepaidProductData({ selectedProducts: [], totalAmount: 0 });
                            }
                          }}
                        >
                          <Icon className="w-4 h-4" />
                          {method.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 预存产品按钮 */}
                <div className="form-control">
                  <button
                    type="button"
                    className="btn btn-accent btn-lg"
                    onClick={handlePrepaidProductMode}
                  >
                    <GiftIcon className="w-5 h-5" />
                    预存产品
                  </button>
                </div>

                {/* 预存记录显示 */}
                {orderForm.customerId && prepaidRecords.length > 0 && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">预存记录</span>
                      <span className="label-text-alt text-info">
                        {cart.length > 0 ? '仅显示可用的预存记录' : '购物车为空，仅显示金额型预存'}
                      </span>
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {prepaidRecords.map(record => {
                        const Icon = getPrepaidRecordIcon(record);
                        const isMatched = isPrepaidRecordMatched(record);
                        return (
                          <div 
                            key={record._id} 
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              isMatched ? 'bg-base-200' : 'bg-base-300 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 text-primary" />
                              <div>
                                <div className="font-medium">{record.productName || '预存金额'}</div>
                                <div className="text-sm text-base-content/60">
                                  {getPrepaidRecordText(record)}
                                  {!isMatched && record.type === 'product' && (
                                    <span className="text-warning ml-2">(不在购物车中)</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              className={`btn btn-sm ${isMatched ? 'btn-primary' : 'btn-disabled'}`}
                              onClick={() => isMatched && selectPrepaidRecord(record)}
                              disabled={!isMatched}
                            >
                              使用
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 预存扣减状态显示 */}
                {orderForm.usePrepaid && (
                  <div className="alert alert-info">
                    <WalletIcon className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="font-medium">使用预存扣减</div>
                      <div className="text-sm">
                        {orderForm.prepaidType === 'amount' 
                          ? `扣减金额: ¥${orderForm.prepaidAmount.toFixed(2)}`
                          : `扣减产品: ${orderForm.prepaidProducts[0]?.productName || '未知产品'}`
                        }
                      </div>
                    </div>
                    <button 
                      className="btn btn-sm btn-ghost"
                      onClick={cancelPrepaid}
                    >
                      取消
                    </button>
                  </div>
                )}

                {/* 预存扣费模式状态显示 */}
                {prepaidDeductionMode && (
                  <div className="alert alert-success">
                    <WalletIcon className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="font-medium">预存扣费模式已启用</div>
                      <div className="text-sm">
                        订单总金额: ¥{getTotalAmount().toFixed(2)}<br/>
                        将使用预存金额全额抵扣
                      </div>
                    </div>
                    <button 
                      className="btn btn-sm btn-ghost"
                      onClick={() => {
                        setPrepaidDeductionMode(false);
                        setOrderForm(prev => ({ 
                          ...prev, 
                          paymentMethod: 'cash',
                          usePrepaid: false,
                          prepaidAmount: 0,
                          prepaidProducts: [],
                          prepaidType: "amount"
                        }));
                      }}
                    >
                      取消
                    </button>
                  </div>
                )}

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">备注信息</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered"
                    placeholder="请输入备注信息（选填）"
                    rows={3}
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowOrderForm(false)}
              >
                取消
              </button>
              
              {/* 根据模式显示不同的按钮 */}
              {createPrepaidMode && (
                <button
                  className="btn btn-accent"
                  onClick={submitPrepaidProductOrder}
                >
                  确定下单
                </button>
              )}
              
              {prepaidDeductionMode && (
                <button
                  className="btn btn-info"
                  onClick={submitPrepaidDeductionOrder}
                >
                  确定下单
                </button>
              )}
              
              {!createPrepaidMode && !prepaidDeductionMode && (
                <button
                  className="btn btn-primary"
                  onClick={submitOrder}
                >
                  确认下单
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 客户选择弹窗 */}
      {showCustomerSelector && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg mb-4">选择客户</h3>
            <div className="form-control mb-4">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="搜索客户姓名或电话"
                  className="input input-bordered w-full"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {customers.map(c => (
                <div key={c._id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div>
                    <div className="font-medium">{c.name || '未命名客户'}</div>
                    <div className="text-sm text-base-content/60">{c.phone || '无电话'}</div>
                    {c.address && (
                      <div className="text-sm text-base-content/60 line-clamp-1">
                        {(c.address.fullAddress || c.address.address) || ''}
                      </div>
                    )}
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => selectCustomer(c)}>选择</button>
                </div>
              ))}
              {customers.length === 0 && (
                <div className="text-center text-base-content/60 py-8">未找到客户</div>
              )}
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowCustomerSelector(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopOrderPage;
