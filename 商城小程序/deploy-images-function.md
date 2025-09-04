# 云函数部署说明

## 部署 getImages 云函数

由于命令行部署遇到问题，请使用微信开发者工具手动部署：

### 步骤 1: 在微信开发者工具中部署
1. 打开微信开发者工具
2. 在左侧文件树中找到 `cloudfunctions/getImages` 文件夹
3. 右键点击 `getImages` 文件夹
4. 选择 "上传并部署：云端安装依赖"
5. 等待部署完成

### 步骤 2: 验证部署
部署完成后，可以在云开发控制台查看云函数是否创建成功。

### 步骤 3: 测试功能
1. 重新编译小程序
2. 进入首页，查看轮播图是否正常显示
3. 进入商品页面，查看商品图片是否正常显示

## 云存储图片结构

云函数中预设的图片路径结构：
- 轮播图: `/images/banners/banner1.jpg`, `banner2.jpg`, `banner3.jpg`
- 商品图片: `/images/products/product1.jpg` 到 `product6.jpg`
- 分类图标: `/images/categories/electronics.jpg`, `clothing.jpg`, `home.jpg`, `sports.jpg`
- 默认图片: `/images/placeholder.jpg`, `/images/default-product.jpg`

## 注意事项

1. 确保云开发环境ID正确
2. 确保云存储中有对应的图片文件
3. 如果图片不存在，系统会自动使用默认的SVG占位图
4. 云函数返回的是临时访问链接，有效期通常为1小时 