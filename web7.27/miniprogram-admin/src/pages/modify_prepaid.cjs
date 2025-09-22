const fs = require('fs');

// 读取文件
let content = fs.readFileSync('ShopOrderPage.jsx', 'utf8');

// 在第47行后添加新的状态定义
const oldStatePattern = `  const [showPrepaidSelector, setShowPrepaidSelector] = useState(false);

  // 支付方式选项`;

const newStatePattern = `  const [showPrepaidSelector, setShowPrepaidSelector] = useState(false);

  // 预存产品创建相关状态
  const [createPrepaidMode, setCreatePrepaidMode] = useState(false); // 是否处于创建预存产品模式
  const [prepaidProductData, setPrepaidProductData] = useState({
    selectedProducts: [], // 选中的商品
    totalAmount: 0 // 预存总金额
  });

  // 支付方式选项`;

content = content.replace(oldStatePattern, newStatePattern);

// 修改支付方式选择逻辑，为"预存产品"添加特殊处理
const oldPaymentMethodPattern = `                          onClick={() => {
                            setOrderForm(prev => ({ 
                              ...prev, 
                              paymentMethod: method.value,
                              // 切换支付方式时重置预存状态
                              usePrepaid: false,
                              prepaidAmount: 0,
                              prepaidProducts: [],
                              prepaidType: 'amount'
                            }));
                          }}`;

const newPaymentMethodPattern = `                          onClick={() => {
                            // 如果选择预存产品，进入创建预存产品模式
                            if (method.value === 'prepaid') {
                              handlePrepaidProductMode();
                            } else {
                              setOrderForm(prev => ({ 
                                ...prev, 
                                paymentMethod: method.value,
                                // 切换支付方式时重置预存状态
                                usePrepaid: false,
                                prepaidAmount: 0,
                                prepaidProducts: [],
                                prepaidType: 'amount'
                              }));
                              setCreatePrepaidMode(false);
                              setPrepaidProductData({ selectedProducts: [], totalAmount: 0 });
                            }
                          }}`;

content = content.replace(oldPaymentMethodPattern, newPaymentMethodPattern);

// 在提交订单函数前添加新的函数
const submitOrderPattern = `  // 提交订单
  const submitOrder = async () => {`;

const newFunctionPattern = `  // 处理预存产品模式
  const handlePrepaidProductMode = () => {
    if (!orderForm.customerId || !orderForm.customerName) {
      alert('请先选择客户');
      return;
    }
    
    if (cart.length === 0) {
      alert('购物车为空，无法创建预存产品');
      return;
    }
    
    setCreatePrepaidMode(true);
    setOrderForm(prev => ({ 
      ...prev, 
      paymentMethod: 'prepaid',
      usePrepaid: false,
      prepaidAmount: 0,
      prepaidProducts: [],
      prepaidType: 'product'
    }));
    
    // 初始化预存产品数据
    setPrepaidProductData({
      selectedProducts: cart.map(item => ({
        productId: item._id,
        productName: item.name,
        price: item.price,
        quantity: item.quantity,
        selected: true
      })),
      totalAmount: calculateTotal()
    });
  };

  // 创建预存产品记录
  const createPrepaidProductRecords = async () => {
    try {
      await ensureLogin();
      const db = app.database();
      
      const selectedProducts = prepaidProductData.selectedProducts.filter(p => p.selected);
      if (selectedProducts.length === 0) {
        alert('请至少选择一个商品作为预存产品');
        return false;
      }
      
      // 为每个选中的商品创建预存记录
      const createPromises = selectedProducts.map(async (product) => {
        const prepaidRecord = {
          customerId: orderForm.customerId,
          customerName: orderForm.customerName,
          customerPhone: orderForm.customerPhone,
          productId: product.productId,
          productName: product.productName,
          type: 'product',
          balance: product.quantity,
          originalBalance: product.quantity,
          unitPrice: product.price,
          totalAmount: product.price * product.quantity,
          createTime: new Date(),
          updateTime: new Date(),
          source: '商城下单预存',
          status: 'active'
        };
        
        return db.collection('prepaidRecords').add(prepaidRecord);
      });
      
      await Promise.all(createPromises);
      
      console.log('预存产品记录创建成功');
      alert(\`成功为 \${orderForm.customerName} 创建了 \${selectedProducts.length} 个预存产品记录\`);
      
      // 重置状态
      setCreatePrepaidMode(false);
      setPrepaidProductData({ selectedProducts: [], totalAmount: 0 });
      setOrderForm(prev => ({
        ...prev,
        paymentMethod: 'cash',
        usePrepaid: false,
        prepaidAmount: 0,
        prepaidProducts: [],
        prepaidType: 'amount'
      }));
      
      // 重新获取预存记录
      if (orderForm.customerId) {
        fetchPrepaidRecords(orderForm.customerId);
      }
      
      return true;
    } catch (error) {
      console.error('创建预存产品记录失败:', error);
      alert('创建预存产品记录失败，请重试');
      return false;
    }
  };

  // 切换预存产品选择状态
  const togglePrepaidProductSelection = (productId) => {
    setPrepaidProductData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(product => 
        product.productId === productId 
          ? { ...product, selected: !product.selected }
          : product
      )
    }));
  };

  // 取消预存产品创建模式
  const cancelPrepaidMode = () => {
    setCreatePrepaidMode(false);
    setPrepaidProductData({ selectedProducts: [], totalAmount: 0 });
    setOrderForm(prev => ({
      ...prev,
      paymentMethod: 'cash',
      usePrepaid: false,
      prepaidAmount: 0,
      prepaidProducts: [],
      prepaidType: 'amount'
    }));
  };

  // 提交订单
  const submitOrder = async () => {`;

content = content.replace(submitOrderPattern, newFunctionPattern);

// 写入文件
fs.writeFileSync('ShopOrderPage.jsx', content);
console.log('文件修改完成');
