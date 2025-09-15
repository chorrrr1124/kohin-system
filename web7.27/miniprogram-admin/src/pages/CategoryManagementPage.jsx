import React, { useState, useEffect } from 'react';
import cloudStorage from '../utils/cloudStorage';

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: '📁'
  });

  // 预定义的颜色选项
  const colorOptions = [
    { name: '蓝色', value: '#3b82f6' },
    { name: '绿色', value: '#10b981' },
    { name: '红色', value: '#ef4444' },
    { name: '黄色', value: '#f59e0b' },
    { name: '紫色', value: '#8b5cf6' },
    { name: '粉色', value: '#ec4899' },
    { name: '橙色', value: '#f97316' },
    { name: '青色', value: '#06b6d4' }
  ];

  // 预定义的图标选项
  const iconOptions = [
    '📁', '🖼️', '🎨', '📸', '🖌️', '🎭', '🌟', '💎',
    '🎪', '🎨', '🖼️', '📷', '🎯', '🎪', '🎨', '🖼️'
  ];

  // 加载分类列表
  const loadCategories = async () => {
    setLoading(true);
    try {
      const result = await cloudStorage.getCategories();
      setCategories(result);
    } catch (error) {
      console.error('❌ 加载分类失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 创建分类
  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      alert('请输入分类名称');
      return;
    }

    try {
      await cloudStorage.createCategory(newCategory);
      setNewCategory({ name: '', description: '', color: '#3b82f6', icon: '📁' });
      setShowAddModal(false);
      await loadCategories();
      console.log('✅ 分类创建成功');
    } catch (error) {
      console.error('❌ 创建分类失败:', error);
      alert('创建分类失败');
    }
  };

  // 更新分类
  const handleUpdateCategory = async (categoryId, updatedData) => {
    try {
      await cloudStorage.updateCategory(categoryId, updatedData);
      setEditingCategory(null);
      await loadCategories();
      console.log('✅ 分类更新成功');
    } catch (error) {
      console.error('❌ 更新分类失败:', error);
      alert('更新分类失败');
    }
  };

  // 删除分类
  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('确定要删除这个分类吗？删除后该分类下的图片将移至"未分类"')) {
      return;
    }

    try {
      await cloudStorage.deleteCategory(categoryId);
      await loadCategories();
      console.log('✅ 分类删除成功');
    } catch (error) {
      console.error('❌ 删除分类失败:', error);
      alert('删除分类失败');
    }
  };

  // 获取分类下的图片数量
  const getCategoryImageCount = async (categoryId) => {
    try {
      const result = await cloudStorage.getImagesByCategory(categoryId);
      return result.length;
    } catch (error) {
      console.error('获取分类图片数量失败:', error);
      return 0;
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">分类管理</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <span className="text-xl">+</span>
          添加分类
        </button>
      </div>

      {/* 分类列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{category.icon}</span>
                  <div>
                    <h3 className="card-title text-lg">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="btn btn-sm btn-outline"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="btn btn-sm btn-error"
                  >
                    删除
                  </button>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {category.imageCount || 0} 张图片
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 添加分类模态框 */}
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">添加分类</h3>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">分类名称</span>
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
                className="textarea textarea-bordered"
                placeholder="请输入分类描述"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              ></textarea>
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">选择图标</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewCategory({ ...newCategory, icon })}
                    className={`btn btn-sm ${newCategory.icon === icon ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">选择颜色</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewCategory({ ...newCategory, color: color.value })}
                    className={`btn btn-sm ${newCategory.color === color.value ? 'btn-primary' : 'btn-outline'}`}
                    style={{ backgroundColor: color.value, color: 'white' }}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-action">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn btn-ghost"
              >
                取消
              </button>
              <button
                onClick={handleCreateCategory}
                className="btn btn-primary"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑分类模态框 */}
      {editingCategory && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">编辑分类</h3>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">分类名称</span>
              </label>
              <input
                type="text"
                placeholder="请输入分类名称"
                className="input input-bordered"
                value={editingCategory.name}
                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
              />
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">分类描述</span>
              </label>
              <textarea
                className="textarea textarea-bordered"
                placeholder="请输入分类描述"
                value={editingCategory.description}
                onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
              ></textarea>
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">选择图标</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setEditingCategory({ ...editingCategory, icon })}
                    className={`btn btn-sm ${editingCategory.icon === icon ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">选择颜色</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setEditingCategory({ ...editingCategory, color: color.value })}
                    className={`btn btn-sm ${editingCategory.color === color.value ? 'btn-primary' : 'btn-outline'}`}
                    style={{ backgroundColor: color.value, color: 'white' }}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-action">
              <button
                onClick={() => setEditingCategory(null)}
                className="btn btn-ghost"
              >
                取消
              </button>
              <button
                onClick={() => handleUpdateCategory(editingCategory.id, editingCategory)}
                className="btn btn-primary"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagementPage;
