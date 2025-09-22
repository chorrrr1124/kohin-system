const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event;
  
  try {
    if (action === 'updateCustomerTypes') {
      // 获取所有客户
      const customersResult = await db.collection('customers').get();
      const customers = customersResult.data;
      
      // 获取所有预存记录
      const prepaidResult = await db.collection('prepaidRecords').get();
      const prepaidRecords = prepaidResult.data;
      
      // 按客户ID分组预存记录
      const customerPrepaidMap = {};
      prepaidRecords.forEach(record => {
        if (record.customerId) {
          if (!customerPrepaidMap[record.customerId]) {
            customerPrepaidMap[record.customerId] = [];
          }
          customerPrepaidMap[record.customerId].push(record);
        }
      });
      
      const updatePromises = [];
      let updatedCount = 0;
      
      for (const customer of customers) {
        const customerPrepaidRecords = customerPrepaidMap[customer._id] || [];
        
        if (customerPrepaidRecords.length > 0) {
          // 检查是否有有效的预存记录
          const hasActiveRecords = customerPrepaidRecords.some(record => {
            return record.balance && record.balance > 0;
          });
          
          if (hasActiveRecords) {
            // 判断预存类型
            const hasProductPrepaid = customerPrepaidRecords.some(record => 
              record.type === "product" || record.type === "产品预存"
            );
            const hasAmountPrepaid = customerPrepaidRecords.some(record => 
              record.type === "money" || record.type === "金额预存" || record.balance > 0
            );
            
            let newType = '';
            if (hasProductPrepaid && !hasAmountPrepaid) {
              newType = '产品预存客户';
            } else if (hasAmountPrepaid && !hasProductPrepaid) {
              newType = '金额预存客户';
            } else if (hasProductPrepaid && hasAmountPrepaid) {
              newType = '产品预存客户'; // 优先显示产品预存
            } else {
              newType = '预存客户'; // 默认预存客户
            }
            
            // 如果客户类型需要更新
            if (customer.nature !== newType || customer.type !== newType) {
              console.log(`更新客户 ${customer.name} 类型: ${customer.nature} -> ${newType}`);
              
              updatePromises.push(
                db.collection('customers').doc(customer._id).update({
                  data: {
                    nature: newType,
                    type: newType,
                    natureCategory: '预存客户',
                    updateTime: new Date()
                  }
                })
              );
              updatedCount++;
            }
          }
        } else if (customer.nature === '预存客户' || customer.type === '预存客户') {
          // 如果没有预存记录但标记为预存客户，改为零售客户
          console.log(`客户 ${customer.name} 没有预存记录，改为零售客户`);
          
          updatePromises.push(
            db.collection('customers').doc(customer._id).update({
              data: {
                nature: '零售客户',
                type: '零售客户',
                natureCategory: '零售客户',
                updateTime: new Date()
              }
            })
          );
          updatedCount++;
        }
      }
      
      // 执行所有更新
      await Promise.all(updatePromises);
      
      return {
        success: true,
        message: `成功更新 ${updatedCount} 个客户的类型`,
        updatedCount
      };
    }
    
    return {
      success: false,
      message: '未知操作'
    };
    
  } catch (error) {
    console.error('更新客户类型失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
};
