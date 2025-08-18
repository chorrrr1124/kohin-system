import React, { useState, useEffect } from 'react';
import { 
  PhotoIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { initCloudBase } from '../utils/cloudbase';
import { createCosClient, getSignedUrl, COS_BUCKET, COS_REGION } from '../utils/cos';

// 本地临时存储 Key（无云端或云端异常时兜底）
const LOCAL_KEY = 'homepage_carousel_local';

const HomepageSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('carousel'); // 仅保留轮播图管理
  const [carouselList, setCarouselList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCarouselModal, setShowCarouselModal] = useState(false);
  const [editingCarousel, setEditingCarousel] = useState(null);
  const [cosClient, setCosClient] = useState(null);
  const [displayUrlMap, setDisplayUrlMap] = useState({});
  const [formPreviewUrl, setFormPreviewUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // 轮播图表单数据
  const [carouselForm, setCarouselForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    gradient: 'linear-gradient(135deg, rgba(76, 175, 80, 0.85) 0%, rgba(139, 195, 74, 0.85) 50%, rgba(205, 220, 57, 0.85) 100%)',
    sort: 0,
    status: 'active',
    link: ''
  });

  // 渐变色预设
  const gradientOptions = [
    {
      name: '绿色渐变',
      value: 'linear-gradient(135deg, rgba(76, 175, 80, 0.85) 0%, rgba(139, 195, 74, 0.85) 50%, rgba(205, 220, 57, 0.85) 100%)'
    },
    {
      name: '蓝色渐变',
      value: 'linear-gradient(135deg, rgba(33, 150, 243, 0.85) 0%, rgba(63, 81, 181, 0.85) 50%, rgba(103, 58, 183, 0.85) 100%)'
    },
    {
      name: '橙色渐变',
      value: 'linear-gradient(135deg, rgba(255, 152, 0, 0.85) 0%, rgba(255, 87, 34, 0.85) 50%, rgba(244, 67, 54, 0.85) 100%)'
    },
    {
      name: '紫色渐变',
      value: 'linear-gradient(135deg, rgba(156, 39, 176, 0.85) 0%, rgba(123, 31, 162, 0.85) 50%, rgba(81, 45, 168, 0.85) 100%)'
    },
    {
      name: '粉色渐变',
      value: 'linear-gradient(135deg, rgba(233, 30, 99, 0.85) 0%, rgba(236, 64, 122, 0.85) 50%, rgba(240, 98, 146, 0.85) 100%)'
    }
  ];

  // LocalStorage 读写助手
  const getLocalCarouselList = () => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      const list = JSON.parse(raw || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.error('读取本地轮播图失败:', e);
      return [];
    }
  };

  const setLocalCarouselList = (list) => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(list || []));
    } catch (e) {
      console.error('写入本地轮播图失败:', e);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      // 初始化 COS 客户端
      try {
        const client = createCosClient();
        setCosClient(client);
      } catch (e) {
        console.warn('COS 客户端初始化失败，将不提供直传/签名预览:', e);
      }
      
      // 确保云开发登录后再加载数据
      try {
        const app = initCloudBase();
        await app.auth().signInAnonymously();
        console.log('云开发登录成功');
      } catch (error) {
        console.warn('云开发登录失败:', error);
      }
      
      loadCarouselList();
    };
    
    initPage();
  }, []);

  // 根据 imageUrl 生成可显示的 URL（HTTP/HTTPS/DataURL 直接用；否则视为 COS Key 并签名）
  const resolveDisplayUrl = async (imageUrl) => {
    if (!imageUrl) return '';
    const lower = String(imageUrl).toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('data:')) {
      return imageUrl;
    }
    if (!cosClient) return '';
    try {
      const url = await getSignedUrl(cosClient, imageUrl, 600);
      return url;
    } catch (e) {
      console.warn('签名 URL 失败:', e);
      return '';
    }
  };

  const updateDisplayUrls = async (list) => {
    const map = {};
    await Promise.all(
      (list || []).map(async (item) => {
        const url = await resolveDisplayUrl(item.imageUrl);
        map[item._id] = url || item.imageUrl || '';
      })
    );
    setDisplayUrlMap(map);
  };

  // 表单内预览 URL
  useEffect(() => {
    (async () => {
      const url = await resolveDisplayUrl(carouselForm.imageUrl);
      setFormPreviewUrl(url || carouselForm.imageUrl || '');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carouselForm.imageUrl, cosClient]);

  // 加载轮播图列表（云端优先，失败则本地兜底）
  const loadCarouselList = async () => {
    try {
      setLoading(true);
      const app = initCloudBase();
      const db = app.database();
      
      const result = await db.collection('homepage_carousel')
        .orderBy('sort', 'asc')
        .orderBy('createTime', 'desc')
        .get();

      const list = result.data || [];
      setCarouselList(list);
      await updateDisplayUrls(list);
    } catch (error) {
      console.error('加载轮播图失败，使用本地临时数据:', error);
      const localList = getLocalCarouselList();
      setCarouselList(localList);
      await updateDisplayUrls(localList);
    } finally {
      setLoading(false);
    }
  };

  // 上传图片到 COS
  const uploadImageToCOS = async (file) => {
    if (!file) return '';
    if (!cosClient) throw new Error('COS 未初始化');
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const key = `carousel/${y}${m}${d}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    await new Promise((resolve, reject) => {
      cosClient.putObject(
        { Bucket: COS_BUCKET, Region: COS_REGION, Key: key, Body: file },
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    return key;
  };

  // 上传图片（保留，若无云存储不使用）
  const handleImageUpload = async (file) => {
    try {
      const app = initCloudBase();
      
      // 生成唯一文件名
      const timestamp = Date.now();
      const random = Math.random().toString(36).slice(2);
      const extension = file.name.split('.').pop();
      const cloudPath = `carousel/${timestamp}_${random}.${extension}`;

      const result = await app.uploadFile({
        cloudPath,
        filePath: file
      });

      return result.fileID;
    } catch (error) {
      console.error('图片上传失败:', error);
      throw new Error('图片上传失败: ' + error.message);
    }
  };

  // 保存轮播图（云端优先，失败则保存到本地）
  const saveCarousel = async () => {
    try {
      if (!carouselForm.title || !carouselForm.imageUrl) {
        alert('请填写标题和图片');
        return;
      }

      setLoading(true);
      const app = initCloudBase();
      const db = app.database();

      const carouselData = {
        ...carouselForm,
        sort: parseInt(carouselForm.sort) || 0,
        updateTime: new Date()
      };

      if (editingCarousel) {
        // 更新
        await db.collection('homepage_carousel')
          .doc(editingCarousel._id)
          .update(carouselData);
      } else {
        // 新增
        carouselData.createTime = new Date();
        await db.collection('homepage_carousel').add(carouselData);
      }

      await loadCarouselList();
      closeCarouselModal();
      alert(editingCarousel ? '轮播图更新成功' : '轮播图添加成功');
    } catch (error) {
      console.warn('云端保存失败，转为本地临时保存:', error);
      try {
        const now = new Date();
        const localData = {
          ...carouselForm,
          sort: parseInt(carouselForm.sort) || 0,
          updateTime: now,
          createTime: editingCarousel?.createTime || now,
          _id: editingCarousel?._id || `local_${Date.now()}_${Math.random().toString(36).slice(2)}`
        };
        const list = getLocalCarouselList();
        const idx = list.findIndex((i) => i._id === localData._id);
        if (idx >= 0) {
          list[idx] = localData;
        } else {
          list.push(localData);
        }
        setLocalCarouselList(list);
        setCarouselList(list);
        closeCarouselModal();
        alert('已临时保存到本地');
      } catch (e) {
        console.error('本地保存失败:', e);
        alert('保存失败: ' + e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // 删除轮播图（云端优先，失败则本地删除）
  const deleteCarousel = async (id) => {
    if (!confirm('确认删除这个轮播图吗？')) return;

    try {
      setLoading(true);
      const app = initCloudBase();
      const db = app.database();

      await db.collection('homepage_carousel').doc(id).remove();
      await loadCarouselList();
      alert('删除成功');
    } catch (error) {
      console.warn('云端删除失败，转为本地删除:', error);
      const list = getLocalCarouselList();
      const next = list.filter((i) => i._id !== id);
      setLocalCarouselList(next);
      setCarouselList(next);
      alert('已从本地临时数据中删除');
    } finally {
      setLoading(false);
    }
  };

  // 切换轮播图状态（云端优先，失败则本地切换）
  const toggleCarouselStatus = async (carousel) => {
    try {
      setLoading(true);
      const app = initCloudBase();
      const db = app.database();

      const newStatus = carousel.status === 'active' ? 'inactive' : 'active';
      await db.collection('homepage_carousel')
        .doc(carousel._id)
        .update({
          status: newStatus,
          updateTime: new Date()
        });

      await loadCarouselList();
    } catch (error) {
      console.warn('云端更新状态失败，转为本地切换:', error);
      const list = getLocalCarouselList();
      const idx = list.findIndex((i) => i._id === carousel._id);
      if (idx >= 0) {
        const newStatus = carousel.status === 'active' ? 'inactive' : 'active';
        list[idx] = { ...list[idx], status: newStatus, updateTime: new Date() };
        setLocalCarouselList(list);
        setCarouselList(list);
      }
    } finally {
      setLoading(false);
    }
  };

  // 打开轮播图编辑弹窗
  const openCarouselModal = (carousel = null) => {
    if (carousel) {
      setEditingCarousel(carousel);
      setCarouselForm({
        title: carousel.title || '',
        subtitle: carousel.subtitle || '',
        imageUrl: carousel.imageUrl || '',
        gradient: carousel.gradient || gradientOptions[0].value,
        sort: carousel.sort || 0,
        status: carousel.status || 'active',
        link: carousel.link || ''
      });
    } else {
      setEditingCarousel(null);
      setCarouselForm({
        title: '',
        subtitle: '',
        imageUrl: '',
        gradient: gradientOptions[0].value,
        sort: 0,
        status: 'active',
        link: ''
      });
    }
    setShowCarouselModal(true);
  };

  // 关闭轮播图弹窗
  const closeCarouselModal = () => {
    setShowCarouselModal(false);
    setEditingCarousel(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">轮播图管理</h1>
      </div>

      {/* 标签页 */}
      <div className="tabs tabs-boxed mb-6">
        <button 
          className={`tab ${activeTab === 'carousel' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('carousel')}
        >
          轮播图管理
        </button>
      </div>

      {/* 轮播图管理 */}
      {activeTab === 'carousel' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">轮播图列表</h2>
            <button 
              className="btn btn-primary"
              onClick={() => openCarouselModal()}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              添加轮播图
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {carouselList.map((carousel) => (
                <div key={carousel._id} className="card bg-base-100 shadow-xl">
                  <figure className="relative h-48">
                    <img 
                      src={displayUrlMap[carousel._id] || carousel.imageUrl} 
                      alt={carousel.title}
                      className="w-full h-full object-cover"
                    />
                    <div 
                      className="absolute inset-0 flex items-center justify-center text-white"
                      style={{ background: carousel.gradient }}
                    >
                      <div className="text-center">
                        <h3 className="text-lg font-bold">{carousel.title}</h3>
                        {carousel.subtitle && (
                          <p className="text-sm opacity-90">{carousel.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </figure>
                  <div className="card-body p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="badge badge-outline">排序: {carousel.sort}</div>
                      <div className={`badge ${carousel.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                        {carousel.status === 'active' ? '启用' : '禁用'}
                      </div>
                    </div>
                    <div className="card-actions justify-end">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleCarouselStatus(carousel)}
                      >
                        {carousel.status === 'active' ? (
                          <EyeSlashIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openCarouselModal(carousel)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => deleteCarousel(carousel._id)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 轮播图编辑弹窗 */}
      {showCarouselModal && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">
                {editingCarousel ? '编辑轮播图' : '添加轮播图'}
              </h3>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={closeCarouselModal}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">标题 *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={carouselForm.title}
                  onChange={(e) => setCarouselForm({...carouselForm, title: e.target.value})}
                  placeholder="请输入标题"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">副标题</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={carouselForm.subtitle}
                  onChange={(e) => setCarouselForm({...carouselForm, subtitle: e.target.value})}
                  placeholder="请输入副标题"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">图片</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered w-full mb-2"
                  value={carouselForm.imageUrl}
                  onChange={(e) => setCarouselForm({ ...carouselForm, imageUrl: e.target.value })}
                  placeholder="https://example.com/banner.jpg 或留空使用下方本地上传/COS上传"
                />
                <input
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered w-full"
                  disabled={uploadingImage}
                  onChange={async (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    setUploadingImage(true);
                    try {
                      // 优先上传到 COS（私有读，保存对象 Key）
                      const key = await uploadImageToCOS(file);
                      setCarouselForm({ ...carouselForm, imageUrl: key });
                    } catch (err) {
                      console.warn('COS 上传失败，转为本地 Base64 预览:', err);
                      try {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setCarouselForm({ ...carouselForm, imageUrl: String(reader.result || '') });
                        };
                        reader.readAsDataURL(file);
                      } catch {}
                    } finally {
                      setUploadingImage(false);
                    }
                  }}
                />
                {formPreviewUrl && (
                  <img src={formPreviewUrl} alt="预览" className="mt-2 h-32 object-cover rounded" />
                )}
                <p className="text-xs text-base-content/70 mt-1">
                  私有读策略：优先上传到 COS 并保存对象 Key（例如 carousel/20250810/xxx.jpg）；后台预览使用临时签名 URL。也可直接填入公开 URL；若 COS 不可用则临时使用 Base64 预览。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">排序</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={carouselForm.sort}
                    onChange={(e) => setCarouselForm({...carouselForm, sort: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">状态</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={carouselForm.status}
                    onChange={(e) => setCarouselForm({...carouselForm, status: e.target.value})}
                  >
                    <option value="active">启用</option>
                    <option value="inactive">禁用</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">链接</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={carouselForm.link}
                  onChange={(e) => setCarouselForm({...carouselForm, link: e.target.value})}
                  placeholder="/pages/products/products?tag=hot"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">遮罩渐变</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={carouselForm.gradient}
                  onChange={(e) => setCarouselForm({...carouselForm, gradient: e.target.value})}
                >
                  {gradientOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-action">
              <button 
                className="btn btn-ghost"
                onClick={closeCarouselModal}
              >
                取消
              </button>
              <button 
                className="btn btn-primary"
                onClick={saveCarousel}
                disabled={loading || uploadingImage}
              >
                {loading || uploadingImage ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomepageSettingsPage;