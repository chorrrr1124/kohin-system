import React, { useState, useEffect } from 'react';
import cloudStorage from '../utils/cloudStorage';

const CategoryManagement = ({ onCategoryUpdate }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });

  // 预定义的颜色选项
  const colorOptions = [
    { name: '蓝色', value: '#3b82f6' },
    { name: '绿色', value: '#10b981' },
    { name: '紫色', value: '#8b5cf6' },
    { name: '红色', value: '#ef4444' },
    { name: '橙色', value: '#f59e0b' },
    { name: '粉色', value: '#ec4899' },
    { name: '青色', value: '#06b6d4' },
    { name: '灰色', value: '#6b7280' }
  ];

  // 加载分类列表
  const loadCategories = async () => {
    setLoading(true);
    try {
      console.log('开始加载分类...');
      const result = await cloudStorage.getCategories();
      console.log('分类加载结果:', result);
      
      if (result && result.length > 0) {
        setCategories(result);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('加载分类失败:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // 创建分类
  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      alert('请输入分类名称');
      return;
    }

    setLoading(true);
    try {
      const result = await cloudStorage.createCategory({
        name: newCategory.name.trim(),
        description: newCategory.description.trim(),
        color: newCategory.color,
        folderPath: `images/${newCategory.name.trim().toLowerCase().replace(/\s+/g, '-')}/`
      });

      if (result) {
        setShowCreateModal(false);
        setNewCategory({ name: '', description: '', color: '#3b82f6' });
        await loadCategories();
        if (onCategoryUpdate) {
          onCategoryUpdate();
        }
        alert('分类创建成功！');
      } else {
        alert('创建失败');
      }
    } catch (error) {
      console.error('创建分类失败:', error);
      alert('创建失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 编辑分类
  const handleEditCategory = async (category) => {
    const newName = prompt('请输入新的分类名称:', category.name);
    if (!newName || newName.trim() === category.name) return;

    setLoading(true);
    try {
      const result = await cloudStorage.updateCategory(category._id, {
        name: newName.trim(),
        folderPath: `images/${newName.trim().toLowerCase().replace(/\s+/g, '-')}/`
      });

      if (result) {
        await loadCategories();
        if (onCategoryUpdate) {
          onCategoryUpdate();
        }
        alert('分类更新成功！');
      } else {
        alert('更新失败');
      }
    } catch (error) {
      console.error('更新分类失败:', error);
      alert('更新失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 删除分类
  const handleDeleteCategory = async (category) => {
    if (!confirm(`确定要删除分类"${category.name}"吗？\n\n注意：这将删除该分类下的所有图片！`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await cloudStorage.deleteCategory(category._id);

      if (result) {
        await loadCategories();
        if (onCategoryUpdate) {
          onCategoryUpdate();
        }
        alert('分类删除成功！');
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('删除分类失败:', error);
      alert('删除失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">分类管理</h1>
          <p className="text-gray-600">管理云存储中的图片分类文件夹</p>
        </div>

        {/* 操作按钮 */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加分类
          </button>
          
          <button
            onClick={loadCategories}
            className="btn btn-outline"
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>
        </div>

        {/* 调试信息 */}
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">调试信息</h3>
          <p className="text-xs text-yellow-700">分类数量: {categories.length}</p>
          <p className="text-xs text-yellow-700">加载状态: {loading ? '加载中' : '已完成'}</p>
          <p className="text-xs text-yellow-700">分类数据: {JSON.stringify(categories, null, 2)}</p>
        </div>

        {/* 分类列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category._id} className="card bg-white shadow-md">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {category.name}
                    </h3>
                  </div>
                  <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </div>
                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                      <li>
                        <button onClick={() => handleEditCategory(category)}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          重命名
                        </button>
                      </li>
                      <li>
                        <button 
                          onClick={() => handleDeleteCategory(category)}
                          className="text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          删除
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
                
                {category.description && (
                  <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                )}
                
                <div className="text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                    文件夹: {category.folderPath}
                  </div>
                  <div className="flex items-center mt-1">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    图片数量: {category.imageCount || 0}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {categories.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无分类</h3>
            <p className="text-gray-500 mb-4">创建第一个分类来开始管理你的图片</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              创建分类
            </button>
          </div>
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4 text-gray-500">加载中...</p>
          </div>
        )}
      </div>

      {/* 创建分类模态框 */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">创建新分类</h3>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">分类名称 *</span>
              </label>
              <input
                type="text"
                placeholder="请输入分类名称"
                className="input input-bordered"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">分类描述</span>
              </label>
              <textarea
                placeholder="请输入分类描述（可选）"
                className="textarea textarea-bordered"
                rows={3}
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              />
            </div>

            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text">分类颜色</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    className={`btn btn-sm ${
                      newCategory.color === color.value ? 'btn-primary' : 'btn-outline'
                    }`}
                    onClick={() => setNewCategory({ ...newCategory, color: color.value })}
                    style={{ backgroundColor: newCategory.color === color.value ? color.value : undefined }}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowCreateModal(false)}
                disabled={loading}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateCategory}
                disabled={loading || !newCategory.name.trim()}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    创建中...
                  </>
                ) : (
                  '创建'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
