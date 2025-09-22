  const handlePrepaidDeduction = async () => {
    if (!orderForm.customerId) {
      alert('请先选择客户');
      return;
    }
    
    if (cart.length === 0) {
      alert('购物车为空，无法使用预存扣费');
      return;
    }

    try {
      // 检查客户是否有预存产品
      const db = app.database();
      const productIds = cart.map(item => item.productId);
      
      const result = await db.collection('prepaid_records')
        .where({
          customerId: orderForm.customerId,
          type: 'product',
          productId: db.command.in(productIds),
          status: 'active'
        })
        .get();
      
      if (result.data.length > 0) {
        // 有预存产品，设置预存扣费模式
        setOrderForm(prev => ({ 
          ...prev, 
          paymentMethod: 'prestore',
          usePrepaid: false,
          prepaidAmount: 0,
          prepaidProducts: [],
          prepaidType: "amount"
        }));
        setCreatePrepaidMode(false);
        setPrepaidDeductionMode(true);
        setPrepaidProductData({ selectedProducts: [], totalAmount: 0 });
      } else {
        alert('该客户没有可用的预存产品，无法使用预存扣费');
      }
    } catch (error) {
      console.error('检查预存产品失败:', error);
      alert('检查预存产品失败，请重试');
    }
  };
