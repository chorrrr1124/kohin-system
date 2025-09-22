// 修改提交订单逻辑
const submitOrder = async () => {
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
    const _ = db.command;

    const now = new Date();
    const id = 'ORD' + now.getTime();

    // 检查预存余额（如果是预存支付）
    if (orderForm.paymentMethod === 'prestore' && orderForm.usePrepaid && orderForm.prepaidType === 'amount') {
      const totalPrepaidBalance = prepaidRecords
        .filter(record => record.type === 'amount')
        .reduce((sum, record) => sum + record.balance, 0);
      if (totalPrepaidBalance < orderForm.prepaidAmount) {
        alert('预存余额不足');
        return;
      }
    }

    // 检查预存产品（如果是预存产品支付）
    if (orderForm.paymentMethod === 'prepaid' && orderForm.usePrepaid && orderForm.prepaidType === 'product') {
      const selectedProduct = orderForm.prepaidProducts[0];
      if (!selectedProduct || selectedProduct.balance <= 0) {
        alert('预存产品余额不足');
        return;
      }
    }

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
      actualAmount: calculateActualAmount(),
      paymentMethod: orderForm.paymentMethod,
      prepaidAmount: orderForm.usePrepaid ? orderForm.prepaidAmount : 0,
      prepaidType: orderForm.prepaidType,
      prepaidProducts: orderForm.prepaidProducts,
      // 现金/微信/支付宝支付时显示已支付状态
      status: ['cash', 'wechat', 'alipay'].includes(orderForm.paymentMethod) ? 'paid' : 'pending',
      createTime: now,
      updateTime: now,
      remark: orderForm.notes || ''
    };

    // 1. 先创建订单
    console.log('创建订单...');
    await db.collection('orders').add(orderData);
    console.log('订单创建成功');

    // 2. 使用云函数扣减库存（事务保证一致性）
    console.log('扣减库存...');
    const stockSuccess = await updateStock(cart, id);
    if (!stockSuccess) {
      console.warn('库存扣减失败，订单已创建但可能存在问题');
      alert('库存扣减失败，请检查订单状态');
      return;
    }

    // 3. 如果是预存扣费，扣减预存余额
    if (orderForm.paymentMethod === 'prestore' && orderForm.usePrepaid && orderForm.prepaidType === 'amount') {
      console.log('扣减预存金额...');
      const prepaidSuccess = await updatePrepaidBalance(
        orderForm.customerId,
        orderForm.customerPhone,
        orderForm.prepaidAmount,
        id,
        'amount'
      );
      if (!prepaidSuccess) {
        console.warn('预存金额扣减失败，但订单和库存扣减已成功');
      }
    }

    // 4. 如果是预存产品，扣减预存产品数量
    if (orderForm.paymentMethod === 'prepaid' && orderForm.usePrepaid && orderForm.prepaidType === 'product') {
      console.log('扣减预存产品...');
      const selectedProduct = orderForm.prepaidProducts[0];
      const prepaidSuccess = await updatePrepaidBalance(
        orderForm.customerId,
        orderForm.customerPhone,
        1, // 扣减1个产品
        id,
        'product'
      );
      if (!prepaidSuccess) {
        console.warn('预存产品扣减失败，但订单和库存扣减已成功');
      }
    }
    
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
    
    // 如果是现金/微信/支付宝支付，跳转到订单页面
    if (['cash', 'wechat', 'alipay'].includes(orderForm.paymentMethod)) {
      // 这里可以添加跳转到订单页面的逻辑
      // 或者显示订单详情
      alert(`订单创建成功！订单号：${id}，状态：已支付`);
    }
    
    setTimeout(() => setOrderSuccess(false), 3000);
  } catch (error) {
    console.error('提交订单失败:', error);
    alert('提交订单失败，请重试');
  }
};
