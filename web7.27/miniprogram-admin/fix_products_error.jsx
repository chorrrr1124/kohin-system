// 修复products未定义的问题
const loadProducts = async () => {
  try {
    const db = app.database();
    const result = await db.collection('products').get();
    // 确保result.data存在，如果不存在则使用空数组
    setProducts(result.data || []);
  } catch (error) {
    console.error('加载商品失败:', error);
    // 出错时也设置为空数组
    setProducts([]);
  } finally {
    setLoading(false);
  }
};

const loadCustomers = async () => {
  try {
    const db = app.database();
    const result = await db.collection('customers').get();
    // 确保result.data存在，如果不存在则使用空数组
    setCustomers(result.data || []);
  } catch (error) {
    console.error('加载客户失败:', error);
    // 出错时也设置为空数组
    setCustomers([]);
  }
};

const loadPrepaidRecords = async () => {
  try {
    const db = app.database();
    
    if (cart.length > 0) {
      const productIds = cart.map(item => item.productId);
      const result = await db.collection('prepaid_records')
        .where({
          customerId: orderForm.customerId,
          type: 'product',
          productId: db.command.in(productIds),
          status: 'active'
        })
        .get();
      // 确保result.data存在，如果不存在则使用空数组
      setPrepaidRecords(result.data || []);
    } else {
      const result = await db.collection('prepaid_records')
        .where({
          customerId: orderForm.customerId,
          status: 'active'
        })
        .get();
      // 确保result.data存在，如果不存在则使用空数组
      setPrepaidRecords(result.data || []);
    }
  } catch (error) {
    console.error('加载预存记录失败:', error);
    // 出错时也设置为空数组
    setPrepaidRecords([]);
  }
};
