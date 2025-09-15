  // 保存图片信息到数据库
  async saveImageInfo(images) {
    try {
      if (!this.initialized) {
        await this.init();
      }

      console.log('💾 保存图片信息到数据库:', images);

      const result = await this.app.callFunction({
        name: 'cloudStorageManagerV2',
        data: {
          action: 'saveImageInfo',
          data: {
            images: images
          }
        }
      });

      if (result.result && result.result.success) {
        console.log('✅ 图片信息保存成功');
        return result.result;
      } else {
        throw new Error('保存图片信息失败: ' + (result.result?.error || '未知错误'));
      }
    } catch (error) {
      console.error('❌ 保存图片信息失败:', error);
      throw error;
    }
  }
