  const fetchProducts = async () => {
    try {
      setLoading(true);
      await ensureLogin();
      const db = app.database();

      // 获取所有商品数据，不进行服务端筛选
      const result = await db.collection('shopProducts')
        .orderBy('createTime', 'desc')
        .get();

      setProducts(result.data);
    } catch (error) {
      console.error('获取商品列表失败:', error);
      alert('获取商品列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };
