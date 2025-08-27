// 测试数据初始化脚本
// 在微信开发者工具的控制台中运行此脚本来初始化商城数据

// 初始化商城商品数据
function initShopProducts() {
  const db = wx.cloud.database();
  
  const testProducts = [
    {
      name: '苹果 iPhone 15',
      price: 5999,
      originalPrice: 6999,
      description: '全新iPhone 15，搭载A17芯片，支持USB-C接口',
      stock: 50,
      category: '数码',
      type: '手机',
      images: ['/images/placeholder.svg'],
      image: '/images/placeholder.svg',
      onSale: true,
      brand: 'Apple',
      specification: '128GB 粉色',
      sales: 120,
      createTime: new Date(),
      updateTime: new Date()
    },
    {
      name: '华为 Mate 60 Pro',
      price: 6999,
      originalPrice: 7999,
      description: '华为Mate 60 Pro，麒麟9000S芯片，卫星通话',
      stock: 30,
      category: '数码',
      type: '手机',
      images: ['/images/placeholder.svg'],
      image: '/images/placeholder.svg',
      onSale: true,
      brand: '华为',
      specification: '256GB 雅川青',
      sales: 85,
      createTime: new Date(),
      updateTime: new Date()
    },
    {
      name: '小米14 Ultra',
      price: 4999,
      originalPrice: 5999,
      description: '小米14 Ultra，徕卡影像，骁龙8 Gen3',
      stock: 25,
      category: '数码',
      type: '手机',
      images: ['/images/placeholder.svg'],
      image: '/images/placeholder.svg',
      onSale: true,
      brand: '小米',
      specification: '512GB 钛金属',
      sales: 95,
      createTime: new Date(),
      updateTime: new Date()
    },
    {
      name: 'Nike Air Max 270',
      price: 899,
      originalPrice: 1299,
      description: 'Nike Air Max 270运动鞋，舒适透气',
      stock: 100,
      category: '服装',
      type: '鞋子',
      images: ['/images/placeholder.svg'],
      image: '/images/placeholder.svg',
      onSale: true,
      brand: 'Nike',
      specification: '42码 黑白配色',
      sales: 200,
      createTime: new Date(),
      updateTime: new Date()
    },
    {
      name: 'Adidas 三叶草卫衣',
      price: 599,
      originalPrice: 799,
      description: 'Adidas经典三叶草卫衣，纯棉材质',
      stock: 80,
      category: '服装',
      type: '上衣',
      images: ['/images/placeholder.svg'],
      image: '/images/placeholder.svg',
      onSale: true,
      brand: 'Adidas',
      specification: 'L码 黑色',
      sales: 150,
      createTime: new Date(),
      updateTime: new Date()
    },
    {
      name: '戴森V15吸尘器',
      price: 3999,
      originalPrice: 4999,
      description: '戴森V15无线吸尘器，激光探测微尘',
      stock: 15,
      category: '家居',
      type: '家电',
      images: ['/images/placeholder.svg'],
      image: '/images/placeholder.svg',
      onSale: true,
      brand: 'Dyson',
      specification: '标准版 金色',
      sales: 45,
      createTime: new Date(),
      updateTime: new Date()
    },
    {
      name: '雅诗兰黛小棕瓶',
      price: 680,
      originalPrice: 880,
      description: '雅诗兰黛小棕瓶精华，抗衰老修护',
      stock: 60,
      category: '美妆',
      type: '护肤',
      images: ['/images/placeholder.svg'],
      image: '/images/placeholder.svg',
      onSale: true,
      brand: '雅诗兰黛',
      specification: '50ml',
      sales: 180,
      createTime: new Date(),
      updateTime: new Date()
    },
    {
      name: 'SK-II神仙水',
      price: 1299,
      originalPrice: 1599,
      description: 'SK-II神仙水，改善肌肤质感',
      stock: 40,
      category: '美妆',
      type: '护肤',
      images: ['/images/placeholder.svg'],
      image: '/images/placeholder.svg',
      onSale: true,
      brand: 'SK-II',
      specification: '230ml',
      sales: 120,
      createTime: new Date(),
      updateTime: new Date()
    }
  ];
  
  // 批量添加商品
  testProducts.forEach((product, index) => {
    db.collection('shopProducts').add({
      data: product,
      success: res => {
        console.log(`商品 ${product.name} 添加成功:`, res._id);
      },
      fail: err => {
        console.error(`商品 ${product.name} 添加失败:`, err);
      }
    });
  });
}

// 初始化轮播图数据
function initBanners() {
  const db = wx.cloud.database();
  
  const testBanners = [
    {
      title: '新品上市',
      image: '/images/banner1.jpg',
      link: '/pages/products/products',
      sort: 1,
      isActive: true,
      createTime: new Date()
    },
    {
      title: '限时优惠',
      image: '/images/banner2.jpg', 
      link: '/pages/products/products?category=数码',
      sort: 2,
      isActive: true,
      createTime: new Date()
    },
    {
      title: '品牌特卖',
      image: '/images/banner3.jpg',
      link: '/pages/products/products?category=服装',
      sort: 3,
      isActive: true,
      createTime: new Date()
    }
  ];
  
  testBanners.forEach(banner => {
    db.collection('banners').add({
      data: banner,
      success: res => {
        console.log(`轮播图 ${banner.title} 添加成功:`, res._id);
      },
      fail: err => {
        console.error(`轮播图 ${banner.title} 添加失败:`, err);
      }
    });
  });
}

// 初始化商品分类数据
function initCategories() {
  const db = wx.cloud.database();
  
  const testCategories = [
    {
      name: '数码',
      icon: '/images/category-digital.png',
      sort: 1,
      isActive: true,
      createTime: new Date()
    },
    {
      name: '服装',
      icon: '/images/category-clothing.png',
      sort: 2,
      isActive: true,
      createTime: new Date()
    },
    {
      name: '家居',
      icon: '/images/category-home.png',
      sort: 3,
      isActive: true,
      createTime: new Date()
    },
    {
      name: '美妆',
      icon: '/images/category-beauty.png',
      sort: 4,
      isActive: true,
      createTime: new Date()
    }
  ];
  
  testCategories.forEach(category => {
    db.collection('categories').add({
      data: category,
      success: res => {
        console.log(`分类 ${category.name} 添加成功:`, res._id);
      },
      fail: err => {
        console.error(`分类 ${category.name} 添加失败:`, err);
      }
    });
  });
}

// 使用方法：
// 1. 在微信开发者工具中打开商城小程序
// 2. 打开调试器控制台
// 3. 复制粘贴以下代码并执行：

console.log('开始初始化测试数据...');
initShopProducts();
initBanners();
initCategories();
console.log('测试数据初始化完成！');

// 或者单独执行某个初始化函数：
// initShopProducts(); // 只初始化商品数据
// initBanners();     // 只初始化轮播图数据
// initCategories();  // 只初始化分类数据