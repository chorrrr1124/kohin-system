  const fetchCustomers = async () => {
    try {
      setLoading(true);
      await ensureLogin();
      const db = app.database();
      
      // 获取所有客户数据，不进行搜索筛选
      const result = await db.collection('customers')
        .orderBy('createTime', 'desc')
        .get();
      
      // 本地筛选逻辑
      let filteredCustomers = result.data;
      
      // 搜索筛选
      if (searchTerm) {
        filteredCustomers = filteredCustomers.filter(customer => {
          const name = customer.name || '';
          const phone = customer.phone || '';
          return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 phone.includes(searchTerm);
        });
      }
      
      // 性质筛选
      if (natureFilter) {
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.nature === natureFilter
        );
      }
      
      // 分页处理
      const total = filteredCustomers.length;
      setTotalPages(Math.ceil(total / pageSize));
      
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);
      
      setCustomers(paginatedCustomers);
