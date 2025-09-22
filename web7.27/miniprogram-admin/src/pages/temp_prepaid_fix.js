// 处理预存产品模式 - 直接确认下单并创建预存记录
const handlePrepaidProductMode = async () => {
  if (!orderForm.customerId || !orderForm.customerName) {
    alert('请先选择客户');
    return;
  }
  
  if (cart.length === 0) {
    alert('购物车为空，无法创建预存产品');
    return;
  }
  
  // 直接确认下单并创建预存记录
  await submitPrepaidProductOrder();
};

// 提交预存产品订单
const submitPrepaidProductOrder = async () => {
  if (!orderForm.customerName || !orderForm.customerPhone || !orderForm.customerAddress) {
    alert('请填写完整的客户信息');
    return;
  }

  if (cart.length === 0) {
    alert('购物车为空');
    return;
  }

  try {
    await ensureLogin();
    const db = app.database();

    const now = new Date();
    const id = 'ORD' + now.getTime();

    const orderData = {
      id,
      customerId: orderForm.customerId || '',
      customerName: orderForm.customerName,
      customerPhone: orderForm.customerPhone,
      address: {
        name: orderForm.customerName,
        phone: orderForm.customerPhone,
        fullAddress: orderForm.customerAddress
      },
      notes: orderForm.notes,
      items: cart.map(item => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity,
        snapshot: {
          name: item.name,
          price: item.price,
          image: item.image,
          category: item.category || '',
        }
      })),
      totalAmount: calculateTotal(),
      actualAmount: calculateTotal(),
      paymentMethod: 'prepaid',
      prepaidAmount: 0,
      prepaidType: 'product',
      prepaidProducts: [],
      status: 'pending_shipment', // 预存产品订单直接待发货
      createTime: now,
      updateTime: now,
      remark: orderForm.notes || ''
    };

    // 1. 先创建订单
    console.log('创建预存产品订单...');
    await db.collection('orders').add(orderData);
    console.log('订单创建成功');

    // 2. 使用云函数扣减库存
    console.log('扣减库存...');
    const stockSuccess = await updateStock(cart, id);
    if (!stockSuccess) {
      console.warn('库存扣减失败，订单已创建但可能存在问题');
      alert('库存扣减失败，请检查订单状态');
      return;
    }

    // 3. 为每个商品创建预存记录
    console.log('创建预存产品记录...');
    const createPromises = cart.map(async (item) => {
      const prepaidRecord = {
        customerId: orderForm.customerId,
        customerName: orderForm.customerName,
        customerPhone: orderForm.customerPhone,
        productId: item._id,
        productName: item.name,
        type: 'product',
        balance: item.quantity,
        originalBalance: item.quantity,
        unitPrice: item.price,
        totalAmount: item.price * item.quantity,
        createTime: now,
        updateTime: now,
        source: '商城下单预存',
        status: 'active'
      };
      
      return db.collection('prepaidRecords').add(prepaidRecord);
    });
    
    await Promise.all(createPromises);
    console.log('预存产品记录创建成功');
    
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
    setShowOrderForm(false);
    
    alert(`预存产品订单创建成功！已为 ${orderForm.customerName} 创建了 ${cart.length} 个预存产品记录`);
    
    setTimeout(() => setOrderSuccess(false), 3000);
  } catch (error) {
    console.error('提交预存产品订单失败:', error);
    alert('提交预存产品订单失败，请重试');
  }
};

// 处理预存扣费 - 检查并扣除预存库存
const handlePrepaidDeduction = async () => {
  if (!orderForm.customerId || !orderForm.customerName) {
    alert('请先选择客户');
    return;
  }
  
  if (cart.length === 0) {
    alert('购物车为空');
    return;
  }

  try {
    await ensureLogin();
    const db = app.database();

    // 检查客户是否有足够的预存产品
    const prepaidQuery = await db.collection('prepaidRecords')
      .where({
        customerId: orderForm.customerId,
        type: 'product',
        status: 'active'
      })
      .get();

    const prepaidRecords = prepaidQuery.data;
    
    // 检查购物车中的每个商品是否有对应的预存记录
    const insufficientProducts = [];
    for (const cartItem of cart) {
      const prepaidRecord = prepaidRecords.find(record => 
        record.productId === cartItem._id && record.balance >= cartItem.quantity
      );
      
      if (!prepaidRecord) {
        const availableBalance = prepaidRecords
          .filter(record => record.productId === cartItem._id)
          .reduce((sum, record) => sum + record.balance, 0);
        
        insufficientProducts.push({
          productName: cartItem.name,
          required: cartItem.quantity,
          available: availableBalance
        });
      }
    }

    if (insufficientProducts.length > 0) {
      const message = insufficientProducts.map(item => 
        `${item.productName}: 需要${item.required}个，可用${item.available}个`
      ).join('\n');
      alert(`预存产品不足：\n${message}`);
      return;
    }

    // 所有商品都有足够的预存，直接确认下单
    await submitPrepaidDeductionOrder();
    
  } catch (error) {
    console.error('检查预存产品失败:', error);
    alert('检查预存产品失败，请重试');
  }
};

// 提交预存扣费订单
const submitPrepaidDeductionOrder = async () => {
  if (!orderForm.customerName || !orderForm.customerPhone || !orderForm.customerAddress) {
    alert('请填写完整的客户信息');
    return;
  }

  if (cart.length === 0) {
    alert('购物车为空');
    return;
  }

  try {
    await ensureLogin();
    const db = app.database();

    const now = new Date();
    const id = 'ORD' + now.getTime();

    const orderData = {
      id,
      customerId: orderForm.customerId || '',
      customerName: orderForm.customerName,
      customerPhone: orderForm.customerPhone,
      address: {
        name: orderForm.customerName,
        phone: orderForm.customerPhone,
        fullAddress: orderForm.customerAddress
      },
      notes: orderForm.notes,
      items: cart.map(item => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity,
        snapshot: {
          name: item.name,
          price: item.price,
          image: item.image,
          category: item.category || '',
        }
      })),
      totalAmount: calculateTotal(),
      actualAmount: 0, // 预存扣费，实际支付为0
      paymentMethod: 'prestore',
      prepaidAmount: calculateTotal(),
      prepaidType: 'product',
      prepaidProducts: cart.map(item => ({
        productId: item._id,
        productName: item.name,
        balance: item.quantity
      })),
      status: 'pending_shipment', // 预存扣费订单直接待发货
      createTime: now,
      updateTime: now,
      remark: orderForm.notes || ''
    };

    // 1. 先创建订单
    console.log('创建预存扣费订单...');
    await db.collection('orders').add(orderData);
    console.log('订单创建成功');

    // 2. 使用云函数扣减库存
    console.log('扣减库存...');
    const stockSuccess = await updateStock(cart, id);
    if (!stockSuccess) {
      console.warn('库存扣减失败，订单已创建但可能存在问题');
      alert('库存扣减失败，请检查订单状态');
      return;
    }

    // 3. 扣减预存产品数量
    console.log('扣减预存产品...');
    for (const cartItem of cart) {
      const prepaidQuery = await db.collection('prepaidRecords')
        .where({
          customerId: orderForm.customerId,
          productId: cartItem._id,
          type: 'product',
          status: 'active'
        })
        .orderBy('createTime', 'asc')
        .get();

      const prepaidRecords = prepaidQuery.data;
      let remainingQuantity = cartItem.quantity;

      // 按时间顺序扣减预存记录
      for (const record of prepaidRecords) {
        if (remainingQuantity <= 0) break;
        
        const deductQuantity = Math.min(remainingQuantity, record.balance);
        remainingQuantity -= deductQuantity;

        await db.collection('prepaidRecords').doc(record._id).update({
          balance: record.balance - deductQuantity,
          updateTime: now
        });
      }
    }
    console.log('预存产品扣减成功');
    
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
    setShowOrderForm(false);
    
    alert(`预存扣费订单创建成功！已为 ${orderForm.customerName} 扣减预存产品`);
    
    setTimeout(() => setOrderSuccess(false), 3000);
  } catch (error) {
    console.error('提交预存扣费订单失败:', error);
    alert('提交预存扣费订单失败，请重试');
  }
};
