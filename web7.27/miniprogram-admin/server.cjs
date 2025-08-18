const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

// COS图片数据存储文件
const COS_IMAGES_DATA_FILE = path.join(__dirname, 'cos-images.json');

const app = express();
const PORT = process.env.PORT || 3001;

// 小程序图片目录路径
const MINIPROGRAM_IMAGES_PATH = 'c:\\Users\\chor\\Desktop\\code\\finish\\商城小程序\\images';

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 确保目录存在
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// COS图片数据管理
const loadCosImagesData = () => {
  try {
    if (fs.existsSync(COS_IMAGES_DATA_FILE)) {
      const data = fs.readFileSync(COS_IMAGES_DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('加载COS图片数据失败:', error);
  }
  return [];
};

const saveCosImagesData = (data) => {
  try {
    fs.writeFileSync(COS_IMAGES_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('保存COS图片数据失败:', error);
  }
};

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || 'general';
    const uploadPath = path.join(MINIPROGRAM_IMAGES_PATH, category);
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 保持原文件名，如果重复则添加时间戳
    const originalName = file.originalname;
    const uploadPath = path.join(MINIPROGRAM_IMAGES_PATH, req.body.category || 'general');
    const fullPath = path.join(uploadPath, originalName);
    
    if (fs.existsSync(fullPath)) {
      const ext = path.extname(originalName);
      const name = path.basename(originalName, ext);
      const timestamp = Date.now();
      cb(null, `${name}_${timestamp}${ext}`);
    } else {
      cb(null, originalName);
    }
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  }
});

// 递归读取目录中的所有图片文件
const readImagesFromDirectory = async (dirPath, category = '') => {
  const images = [];
  
  try {
    if (!fs.existsSync(dirPath)) {
      return images;
    }
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        // 递归读取子目录
        const subCategory = category ? `${category}/${item}` : item;
        const subImages = await readImagesFromDirectory(itemPath, subCategory);
        images.push(...subImages);
      } else if (stat.isFile()) {
        // 检查是否为图片文件
        const ext = path.extname(item).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(ext)) {
          const relativePath = path.relative(MINIPROGRAM_IMAGES_PATH, itemPath);
          images.push({
            id: Buffer.from(itemPath).toString('base64'), // 使用路径的base64作为ID
            name: item,
            category: category || path.basename(path.dirname(itemPath)),
            size: stat.size,
            uploadDate: stat.mtime.toISOString().split('T')[0],
            url: `/images/${relativePath.replace(/\\/g, '/')}`,
            path: itemPath,
            fullPath: itemPath
          });
        }
      }
    }
  } catch (error) {
    console.error('读取目录失败:', error);
  }
  
  return images;
};

// API路由

// 获取所有图片（包括本地和COS）
app.get('/api/images', async (req, res) => {
  try {
    // 获取本地图片
    const localImages = await readImagesFromDirectory(MINIPROGRAM_IMAGES_PATH);
    
    // 获取COS图片
    const cosImages = loadCosImagesData();
    
    // 合并图片列表
    const allImages = [...localImages, ...cosImages];
    
    res.json({
      success: true,
      data: allImages,
      total: allImages.length,
      local: localImages.length,
      cos: cosImages.length
    });
  } catch (error) {
    console.error('获取图片列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取图片列表失败',
      error: error.message
    });
  }
});

// 按分类获取图片
app.get('/api/images/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const categoryPath = path.join(MINIPROGRAM_IMAGES_PATH, category);
    const images = await readImagesFromDirectory(categoryPath, category);
    
    res.json({
      success: true,
      data: images,
      total: images.length
    });
  } catch (error) {
    console.error('获取分类图片失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分类图片失败',
      error: error.message
    });
  }
});

// 上传单个图片到COS
app.post('/api/images/upload', (req, res) => {
  try {
    const { cosUrl, cosKey, originalName, category, size } = req.body;
    
    if (!cosUrl || !cosKey) {
      return res.status(400).json({
        success: false,
        message: 'COS URL和Key是必需的'
      });
    }
    
    // 加载现有的COS图片数据
    const cosImages = loadCosImagesData();
    
    const imageInfo = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: path.basename(cosKey),
      originalName: originalName || path.basename(cosKey),
      category: category || 'general',
      size: size || 0,
      cosUrl: cosUrl,
      cosKey: cosKey,
      url: cosUrl,
      uploadDate: new Date().toISOString().split('T')[0],
      source: 'cos'
    };
    
    // 添加到COS图片数据中
    cosImages.push(imageInfo);
    saveCosImagesData(cosImages);
    
    res.json({
      success: true,
      message: '图片信息保存成功',
      data: imageInfo
    });
  } catch (error) {
    console.error('保存COS图片信息失败:', error);
    res.status(500).json({
      success: false,
      message: '保存COS图片信息失败',
      error: error.message
    });
  }
});

// 上传单个图片到本地（保留原有功能）
app.post('/api/images/upload-local', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }
    
    const imageInfo = {
      id: Buffer.from(req.file.path).toString('base64'),
      name: req.file.filename,
      originalName: req.file.originalname,
      category: req.body.category || 'general',
      size: req.file.size,
      path: req.file.path,
      url: `/images/${req.body.category || 'general'}/${req.file.filename}`,
      uploadDate: new Date().toISOString().split('T')[0],
      source: 'local'
    };
    
    res.json({
      success: true,
      message: '图片上传成功',
      data: imageInfo
    });
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({
      success: false,
      message: '图片上传失败',
      error: error.message
    });
  }
});

// 批量上传图片到COS
app.post('/api/images/upload-multiple', (req, res) => {
  try {
    const { images } = req.body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有提供图片数据'
      });
    }
    
    // 加载现有的COS图片数据
    const cosImages = loadCosImagesData();
    
    const uploadedImages = images.map(img => {
      const imageInfo = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: path.basename(img.cosKey),
        originalName: img.originalName || path.basename(img.cosKey),
        category: img.category || 'general',
        size: img.size || 0,
        cosUrl: img.cosUrl,
        cosKey: img.cosKey,
        url: img.cosUrl,
        uploadDate: new Date().toISOString().split('T')[0],
        source: 'cos'
      };
      
      cosImages.push(imageInfo);
      return imageInfo;
    });
    
    saveCosImagesData(cosImages);
    
    res.json({
      success: true,
      message: `成功保存 ${uploadedImages.length} 张图片信息`,
      data: uploadedImages
    });
  } catch (error) {
    console.error('批量保存COS图片信息失败:', error);
    res.status(500).json({
      success: false,
      message: '批量保存失败',
      error: error.message
    });
  }
});

// 批量上传图片到本地（保留原有功能）
app.post('/api/images/upload-multiple-local', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }
    
    const uploadedImages = req.files.map(file => ({
      id: Buffer.from(file.path).toString('base64'),
      name: file.filename,
      originalName: file.originalname,
      category: req.body.category || 'general',
      size: file.size,
      path: file.path,
      url: `/images/${req.body.category || 'general'}/${file.filename}`,
      uploadDate: new Date().toISOString().split('T')[0],
      source: 'local'
    }));
    
    res.json({
      success: true,
      message: `成功上传 ${uploadedImages.length} 张图片`,
      data: uploadedImages
    });
  } catch (error) {
    console.error('批量上传失败:', error);
    res.status(500).json({
      success: false,
      message: '批量上传失败',
      error: error.message
    });
  }
});

// 删除图片
app.delete('/api/images/:imageId', (req, res) => {
  try {
    const { imageId } = req.params;
    const imagePath = Buffer.from(imageId, 'base64').toString();
    
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      res.json({
        success: true,
        message: '图片删除成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }
  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json({
      success: false,
      message: '删除图片失败',
      error: error.message
    });
  }
});

// 批量删除图片
app.delete('/api/images/batch', (req, res) => {
  try {
    const { imageIds } = req.body;
    
    if (!imageIds || !Array.isArray(imageIds)) {
      return res.status(400).json({
        success: false,
        message: '无效的图片ID列表'
      });
    }
    
    let deletedCount = 0;
    const errors = [];
    
    imageIds.forEach(imageId => {
      try {
        const imagePath = Buffer.from(imageId, 'base64').toString();
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          deletedCount++;
        }
      } catch (error) {
        errors.push(`删除图片 ${imageId} 失败: ${error.message}`);
      }
    });
    
    res.json({
      success: true,
      message: `成功删除 ${deletedCount} 张图片`,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('批量删除失败:', error);
    res.status(500).json({
      success: false,
      message: '批量删除失败',
      error: error.message
    });
  }
});

// 获取分类列表
app.get('/api/images/categories', async (req, res) => {
  try {
    const categories = [];
    const items = fs.readdirSync(MINIPROGRAM_IMAGES_PATH);
    
    // 添加"全部"分类
    const allImages = await readImagesFromDirectory(MINIPROGRAM_IMAGES_PATH);
    categories.push({
      id: 'all',
      name: '全部',
      count: allImages.length
    });
    
    // 添加各个子目录作为分类
    for (const item of items) {
      const itemPath = path.join(MINIPROGRAM_IMAGES_PATH, item);
      if (fs.statSync(itemPath).isDirectory()) {
        const categoryImages = await readImagesFromDirectory(itemPath, item);
        categories.push({
          id: item,
          name: item,
          count: categoryImages.length
        });
      }
    }
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败',
      error: error.message
    });
  }
});

// 静态文件服务 - 提供图片访问
app.use('/images', express.static(MINIPROGRAM_IMAGES_PATH));

// 错误处理中间件
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制（最大10MB）'
      });
    }
  }
  
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: error.message
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`图片管理API服务器运行在 http://localhost:${PORT}`);
  console.log(`小程序图片目录: ${MINIPROGRAM_IMAGES_PATH}`);
  
  // 确保图片目录存在
  ensureDirectoryExists(MINIPROGRAM_IMAGES_PATH);
});

module.exports = app;