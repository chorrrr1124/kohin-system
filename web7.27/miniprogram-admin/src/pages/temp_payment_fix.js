// 修改支付方式按钮点击逻辑
onClick={() => {
  if (method.value === 'prepaid') {
    // 预存产品：直接确认下单并创建预存记录
    handlePrepaidProductMode();
  } else if (method.value === 'prestore') {
    // 预存扣费：检查并扣除预存库存
    handlePrepaidDeduction();
  } else {
    // 现金/微信/支付宝：跳转到订单页面，显示已支付状态
    setOrderForm(prev => ({ 
      ...prev, 
      paymentMethod: method.value,
      usePrepaid: false,
      prepaidAmount: 0,
      prepaidProducts: [],
      prepaidType: 'amount'
    }));
    setCreatePrepaidMode(false);
    setPrepaidProductData({ selectedProducts: [], totalAmount: 0 });
  }
}}
