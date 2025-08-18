/**
 * 首页管理 Web API 示例
 * 用于外部Web应用调用小程序云函数管理首页内容
 * 
 * 使用方法:
 * 1. 配置小程序云开发环境ID和云函数名称
 * 2. 通过HTTP API或SDK调用相应的方法
 * 3. 处理返回结果并更新UI
 */

class HomepageAPI {
  constructor(config) {
    this.appId = config.appId; // 小程序AppID
    this.env = config.env; // 云开发环境ID
    this.apiBase = config.apiBase || 'https://api.weixin.qq.com'; // 微信API基础地址
    this.accessToken = config.accessToken; // 访问令牌
  }

  /**
   * 获取轮播图列表
   * @param {Object} params - 查询参数
   * @param {string} params.status - 状态筛选 (active/inactive)
   * @param {number} params.limit - 返回数量限制
   * @returns {Promise} 轮播图列表
   */
  async getCarouselImages(params = {}) {
    try {
      const result = await this.callCloudFunction('homepageManagement', {
        action: 'getCarousel',
        params
      });

      if (result.success) {
        return {
          success: true,
          data: result.data,
          total: result.total
        };
      } else {
        throw new Error(result.error || '获取轮播图失败');
      }
    } catch (error) {
      console.error('获取轮播图列表失败:', error);
      throw error;
    }
  }

  /**
   * 上传轮播图图片
   * @param {File|string} file - 文件对象或base64字符串
   * @param {string} fileName - 文件名
   * @returns {Promise} 上传结果
   */
  async uploadCarouselImage(file, fileName) {
    try {
      let fileContent;
      
      if (typeof file === 'string') {
        // base64字符串
        fileContent = file.replace(/^data:image\/[a-z]+;base64,/, '');
      } else if (file instanceof File) {
        // 文件对象转base64
        fileContent = await this.fileToBase64(file);
        fileName = fileName || file.name;
      } else {
        throw new Error('不支持的文件类型');
      }

      const result = await this.callCloudFunction('homepageManagement', {
        action: 'uploadImage',
        data: {
          fileContent,
          fileName
        }
      });

      if (result.success) {
        return {
          success: true,
          fileID: result.data.fileID,
          cloudPath: result.data.cloudPath
        };
      } else {
        throw new Error(result.error || '图片上传失败');
      }
    } catch (error) {
      console.error('上传轮播图图片失败:', error);
      throw error;
    }
  }

  /**
   * 添加轮播图
   * @param {Object} data - 轮播图数据
   * @param {string} data.title - 标题
   * @param {string} data.subtitle - 副标题
   * @param {string} data.imageUrl - 图片URL
   * @param {string} data.gradient - 渐变色
   * @param {number} data.sort - 排序
   * @param {string} data.status - 状态
   * @returns {Promise} 添加结果
   */
  async addCarouselImage(data) {
    try {
      const result = await this.callCloudFunction('homepageManagement', {
        action: 'addCarousel',
        data
      });

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: result.message
        };
      } else {
        throw new Error(result.error || '添加轮播图失败');
      }
    } catch (error) {
      console.error('添加轮播图失败:', error);
      throw error;
    }
  }

  /**
   * 更新轮播图
   * @param {string} id - 轮播图ID
   * @param {Object} data - 更新数据
   * @returns {Promise} 更新结果
   */
  async updateCarouselImage(id, data) {
    try {
      const result = await this.callCloudFunction('homepageManagement', {
        action: 'updateCarousel',
        id,
        data
      });

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: result.message
        };
      } else {
        throw new Error(result.error || '更新轮播图失败');
      }
    } catch (error) {
      console.error('更新轮播图失败:', error);
      throw error;
    }
  }

  /**
   * 删除轮播图
   * @param {string} id - 轮播图ID
   * @returns {Promise} 删除结果
   */
  async deleteCarouselImage(id) {
    try {
      const result = await this.callCloudFunction('homepageManagement', {
        action: 'deleteCarousel',
        id
      });

      if (result.success) {
        return {
          success: true,
          message: result.message
        };
      } else {
        throw new Error(result.error || '删除轮播图失败');
      }
    } catch (error) {
      console.error('删除轮播图失败:', error);
      throw error;
    }
  }

  /**
   * 获取推广内容
   * @returns {Promise} 推广内容
   */
  async getPromoContent() {
    try {
      const result = await this.callCloudFunction('homepageManagement', {
        action: 'getPromo'
      });

      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        throw new Error(result.error || '获取推广内容失败');
      }
    } catch (error) {
      console.error('获取推广内容失败:', error);
      throw error;
    }
  }

  /**
   * 更新推广内容
   * @param {Object} data - 推广内容数据
   * @returns {Promise} 更新结果
   */
  async updatePromoContent(data) {
    try {
      const result = await this.callCloudFunction('homepageManagement', {
        action: 'updatePromo',
        data
      });

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: result.message
        };
      } else {
        throw new Error(result.error || '更新推广内容失败');
      }
    } catch (error) {
      console.error('更新推广内容失败:', error);
      throw error;
    }
  }

  /**
   * 调用云函数
   * @param {string} functionName - 云函数名称
   * @param {Object} data - 传递给云函数的数据
   * @returns {Promise} 云函数执行结果
   */
  async callCloudFunction(functionName, data) {
    try {
      // 这里需要根据实际的云开发API调用方式来实现
      // 示例使用HTTP API方式
      const response = await fetch(`${this.apiBase}/tcb/invokeCloudFunction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          env: this.env,
          name: functionName,
          data: JSON.stringify(data)
        })
      });

      const result = await response.json();
      
      if (result.errcode === 0) {
        return JSON.parse(result.resp_data);
      } else {
        throw new Error(result.errmsg || '云函数调用失败');
      }
    } catch (error) {
      console.error('云函数调用失败:', error);
      throw error;
    }
  }

  /**
   * 将文件转换为base64
   * @param {File} file - 文件对象
   * @returns {Promise<string>} base64字符串
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

// 使用示例
const api = new HomepageAPI({
  appId: 'your-mini-program-appid',
  env: 'your-cloud-env-id',
  accessToken: 'your-access-token'
});

// 获取轮播图列表
api.getCarouselImages({ status: 'active' })
  .then(result => {
    console.log('轮播图列表:', result.data);
  })
  .catch(error => {
    console.error('获取失败:', error);
  });

// 上传并添加轮播图
async function uploadAndAddCarousel(file, carouselData) {
  try {
    // 1. 上传图片
    const uploadResult = await api.uploadCarouselImage(file);
    
    // 2. 添加轮播图记录
    const addResult = await api.addCarouselImage({
      ...carouselData,
      imageUrl: uploadResult.fileID
    });
    
    console.log('轮播图添加成功:', addResult);
    return addResult;
  } catch (error) {
    console.error('操作失败:', error);
    throw error;
  }
}

// 导出API类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HomepageAPI;
} else if (typeof window !== 'undefined') {
  window.HomepageAPI = HomepageAPI;
} 