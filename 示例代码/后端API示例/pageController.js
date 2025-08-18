const Page = require('../models/Page');
const ConfigVersion = require('../models/ConfigVersion');
const cacheService = require('../services/cacheService');
const notificationService = require('../services/notificationService');

class PageController {
  // 获取页面配置
  async getPageConfig(req, res) {
    try {
      const { pageId } = req.params;
      const { version } = req.query;
      
      // 从缓存获取
      const cacheKey = `page_${pageId}_${version || 'latest'}`;
      let config = await cacheService.get(cacheKey);
      
      if (!config) {
        // 从数据库获取
        const page = await Page.findById(pageId);
        if (!page) {
          return res.status(404).json({
            code: 404,
            message: 'Page not found'
          });
        }
        
        config = {
          page_id: page._id,
          config: page.layout,
          theme_id: page.theme_id,
          version: page.version
        };
        
        // 缓存配置
        await cacheService.set(cacheKey, config, 3600);
      }
      
      res.json({
        code: 200,
        message: 'success',
        data: config
      });
    } catch (error) {
      console.error('获取页面配置失败:', error);
      res.status(500).json({
        code: 500,
        message: error.message
      });
    }
  }
  
  // 更新页面配置
  async updatePageConfig(req, res) {
    try {
      const { pageId } = req.params;
      const { layout, theme_id, change_log } = req.body;
      
      // 验证配置格式
      if (!this.validateLayout(layout)) {
        return res.status(400).json({
          code: 400,
          message: 'Invalid layout configuration'
        });
      }
      
      // 保存历史版本
      const page = await Page.findById(pageId);
      if (page) {
        await ConfigVersion.create({
          page_id: pageId,
          version: page.version,
          config_snapshot: page.layout,
          change_log: change_log || 'Configuration update',
          created_by: req.user?.id || 'system'
        });
      }
      
      // 生成新版本号
      const newVersion = this.generateVersion(page?.version || '1.0.0');
      
      // 更新页面配置
      const updatedPage = await Page.findByIdAndUpdate(pageId, {
        layout,
        theme_id,
        version: newVersion,
        updated_at: new Date()
      }, { new: true, upsert: true });
      
      // 清除相关缓存
      await cacheService.deletePattern(`page_${pageId}_*`);
      
      // 通知小程序端更新
      await this.notifyConfigUpdate(pageId, newVersion);
      
      res.json({
        code: 200,
        message: 'Configuration updated successfully',
        data: {
          version: newVersion,
          updated_at: updatedPage.updated_at
        }
      });
    } catch (error) {
      console.error('更新页面配置失败:', error);
      res.status(500).json({
        code: 500,
        message: error.message
      });
    }
  }
  
  // 发布页面配置
  async publishPageConfig(req, res) {
    try {
      const { pageId } = req.params;
      
      await Page.findByIdAndUpdate(pageId, {
        status: 'published',
        published_at: new Date()
      });
      
      // 清除缓存，强制小程序端获取最新配置
      await cacheService.deletePattern(`page_${pageId}_*`);
      
      // 通知所有客户端更新
      await notificationService.broadcast('config_published', {
        page_id: pageId,
        timestamp: new Date()
      });
      
      res.json({
        code: 200,
        message: 'Page published successfully'
      });
    } catch (error) {
      console.error('发布页面配置失败:', error);
      res.status(500).json({
        code: 500,
        message: error.message
      });
    }
  }
  
  // 获取页面列表
  async getPageList(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const skip = (page - 1) * limit;
      
      const query = status ? { status } : {};
      
      const pages = await Page.find(query)
        .select('page_name page_path status version updated_at')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ updated_at: -1 });
        
      const total = await Page.countDocuments(query);
      
      res.json({
        code: 200,
        message: 'success',
        data: {
          pages,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('获取页面列表失败:', error);
      res.status(500).json({
        code: 500,
        message: error.message
      });
    }
  }
  
  // 回滚到指定版本
  async rollbackToVersion(req, res) {
    try {
      const { pageId, version } = req.params;
      
      // 获取指定版本的配置
      const versionRecord = await ConfigVersion.findOne({
        page_id: pageId,
        version: version
      });
      
      if (!versionRecord) {
        return res.status(404).json({
          code: 404,
          message: 'Version not found'
        });
      }
      
      // 保存当前版本作为备份
      const currentPage = await Page.findById(pageId);
      await ConfigVersion.create({
        page_id: pageId,
        version: currentPage.version,
        config_snapshot: currentPage.layout,
        change_log: `Backup before rollback to ${version}`,
        created_by: req.user?.id || 'system'
      });
      
      // 生成新版本号
      const newVersion = this.generateVersion(currentPage.version);
      
      // 更新为历史版本的配置
      await Page.findByIdAndUpdate(pageId, {
        layout: versionRecord.config_snapshot,
        version: newVersion,
        updated_at: new Date()
      });
      
      // 清除缓存
      await cacheService.deletePattern(`page_${pageId}_*`);
      
      // 通知更新
      await this.notifyConfigUpdate(pageId, newVersion);
      
      res.json({
        code: 200,
        message: 'Rollback successful',
        data: {
          version: newVersion,
          rolled_back_from: version
        }
      });
    } catch (error) {
      console.error('版本回滚失败:', error);
      res.status(500).json({
        code: 500,
        message: error.message
      });
    }
  }
  
  // 获取版本历史
  async getVersionHistory(req, res) {
    try {
      const { pageId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
      
      const versions = await ConfigVersion.find({ page_id: pageId })
        .select('version change_log created_by created_at')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ created_at: -1 });
        
      const total = await ConfigVersion.countDocuments({ page_id: pageId });
      
      res.json({
        code: 200,
        message: 'success',
        data: {
          versions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('获取版本历史失败:', error);
      res.status(500).json({
        code: 500,
        message: error.message
      });
    }
  }
  
  // 验证布局配置
  validateLayout(layout) {
    if (!layout || typeof layout !== 'object') {
      return false;
    }
    
    if (!layout.components || !Array.isArray(layout.components)) {
      return false;
    }
    
    return layout.components.every(component => {
      return component.id && 
             component.type && 
             component.position &&
             typeof component.position.x === 'number' &&
             typeof component.position.y === 'number' &&
             typeof component.position.width === 'number' &&
             typeof component.position.height === 'number' &&
             component.config &&
             typeof component.config === 'object';
    });
  }
  
  // 生成版本号
  generateVersion(currentVersion) {
    try {
      const parts = currentVersion.split('.').map(Number);
      parts[2]++; // 增加修订号
      return parts.join('.');
    } catch (error) {
      return '1.0.1';
    }
  }
  
  // 通知配置更新
  async notifyConfigUpdate(pageId, version) {
    try {
      await notificationService.broadcast('config_updated', {
        page_id: pageId,
        version: version,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('通知配置更新失败:', error);
    }
  }
}

module.exports = new PageController(); 