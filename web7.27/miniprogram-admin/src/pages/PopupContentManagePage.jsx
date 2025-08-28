import React, { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  GiftIcon,
  PhoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { app, ensureLogin } from '../utils/cloudbase';
import { ContentLoading, CardLoading } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const PopupContentManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('privacy');
  const [popupContent, setPopupContent] = useState({
    privacy: {
      title: '温馨提示',
      greeting: '亲爱的用户,欢迎使用丘大叔柠檬茶小程序',
      agreementIntro: '我们依据相关法律法规制定了《丘大叔柠檬茶用户协议》和《丘大叔柠檬茶隐私协议》,请您在使用我们的产品前仔细阅读并充分理解相关条款,以了解您的权利。',
      necessaryInfo: '根据《常见类型移动互联网应用程序必要个人信息范围规定》,丘大叔柠檬茶小程序属于网上购物类,基本功能为"购买商品",必要个人信息包括:注册用户移动电话号码;收货人姓名(名称)、地址、联系电话;支付时间、支付金额、支付渠道等支付信息。',
      minimalPrinciple: '我们严格遵循最小必要原则,在法律规定的必要信息范围内及与实现业务相关联的个人信息范围内处理个人信息。您可以通过《丘大叔柠檬茶用户隐私政策》了解我们处理您个人信息的情况,以及您所享有的相关权利。如您是未成年人,请您和您的监护人仔细阅读本政策,并在征得您的监护人授权同意的前提下使用我们的服务或向我们提供个人信息。',
      agreementScope: '您同意《丘大叔柠檬茶用户隐私政策》仅代表您已了解应用提供的功能,以及功能运行所需的必要个人信息,并不代表您已同意我们可以收集非必要个人信息,非必要个人信息会根据您的明确同意进行收集。'
    },
    benefit: {
      title: '注册福利',
      greeting: '欢迎加入丘大叔柠檬茶',
      benefitIntro: '新会员专享福利',
      benefitDetails: '21元优惠券包',
      benefitDescription: '包含多种优惠券，让您享受更多优惠',
      privacyNote: '我已阅读并同意《用户协议》和《隐私政策》',
      loginButton: '手机号一键登录',
      skipButton: '暂时跳过'
    },
    phone: {
      title: '获取手机号',
      greeting: '申请获取并验证手机号',
      description: '为了提供更好的服务，我们需要获取您的手机号',
      currentPhone: '当前微信绑定号码',
      allowButton: '允许',
      rejectButton: '不允许',
      otherPhoneButton: '使用其它号码'
    }
  });

  // 获取弹窗内容
  const fetchPopupContent = async () => {
    try {
      setLoading(true);
      await ensureLogin();
      
      const db = app.database();
      const result = await db.collection('popupContent').doc('main').get();
      
      if (result.data && result.data.length > 0) {
        const data = result.data[0];
        setPopupContent(data.content || popupContent);
      }
    } catch (error) {
      console.error('获取弹窗内容失败:', error);
      addToast('获取弹窗内容失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 保存弹窗内容
  const savePopupContent = async () => {
    try {
      setSaving(true);
      await ensureLogin();
      
      const db = app.database();
      await db.collection('popupContent').doc('main').set({
        content: popupContent,
        updateTime: new Date()
      });
      
      addToast('弹窗内容保存成功！', 'success');
    } catch (error) {
      console.error('保存弹窗内容失败:', error);
      addToast('保存弹窗内容失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 更新弹窗内容
  const updatePopupContent = (tab, field, value) => {
    setPopupContent(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [field]: value
      }
    }));
  };

  // 重置为默认内容
  const resetToDefault = () => {
    const defaultContent = {
      privacy: {
        title: '温馨提示',
        greeting: '亲爱的用户,欢迎使用丘大叔柠檬茶小程序',
        agreementIntro: '我们依据相关法律法规制定了《丘大叔柠檬茶用户协议》和《丘大叔柠檬茶隐私协议》,请您在使用我们的产品前仔细阅读并充分理解相关条款,以了解您的权利。',
        necessaryInfo: '根据《常见类型移动互联网应用程序必要个人信息范围规定》,丘大叔柠檬茶小程序属于网上购物类,基本功能为"购买商品",必要个人信息包括:注册用户移动电话号码;收货人姓名(名称)、地址、联系电话;支付时间、支付金额、支付渠道等支付信息。',
        minimalPrinciple: '我们严格遵循最小必要原则,在法律规定的必要信息范围内及与实现业务相关联的个人信息范围内处理个人信息。您可以通过《丘大叔柠檬茶用户隐私政策》了解我们处理您个人信息的情况,以及您所享有的相关权利。如您是未成年人,请您和您的监护人仔细阅读本政策,并在征得您的监护人授权同意的前提下使用我们的服务或向我们提供个人信息。',
        agreementScope: '您同意《丘大叔柠檬茶用户隐私政策》仅代表您已了解应用提供的功能,以及功能运行所需的必要个人信息,并不代表您已同意我们可以收集非必要个人信息,非必要个人信息会根据您的明确同意进行收集。'
      },
      benefit: {
        title: '注册福利',
        greeting: '欢迎加入丘大叔柠檬茶',
        benefitIntro: '新会员专享福利',
        benefitDetails: '21元优惠券包',
        benefitDescription: '包含多种优惠券，让您享受更多优惠',
        privacyNote: '我已阅读并同意《用户协议》和《隐私政策》',
        loginButton: '手机号一键登录',
        skipButton: '暂时跳过'
      },
      phone: {
        title: '获取手机号',
        greeting: '申请获取并验证手机号',
        description: '为了提供更好的服务，我们需要获取您的手机号',
        currentPhone: '当前微信绑定号码',
        allowButton: '允许',
        rejectButton: '不允许',
        otherPhoneButton: '使用其它号码'
      }
    };
    
    setPopupContent(defaultContent);
    addToast('已重置为默认内容', 'info');
  };

  // 预览弹窗内容
  const previewPopup = (type) => {
    const content = popupContent[type];
    let previewText = '';
    
    switch (type) {
      case 'privacy':
        previewText = `${content.title}\n\n${content.greeting}\n\n${content.agreementIntro}\n\n• ${content.necessaryInfo}\n\n• ${content.minimalPrinciple}\n\n• ${content.agreementScope}`;
        break;
      case 'benefit':
        previewText = `${content.title}\n\n${content.greeting}\n\n${content.benefitIntro}\n\n${content.benefitDetails}\n\n${content.benefitDescription}\n\n${content.privacyNote}`;
        break;
      case 'phone':
        previewText = `${content.title}\n\n${content.greeting}\n\n${content.description}\n\n${content.currentPhone}`;
        break;
      default:
        previewText = '预览内容';
    }
    
    alert(`弹窗预览 (${content.title}):\n\n${previewText}`);
  };

  useEffect(() => {
    fetchPopupContent();
  }, []);

  if (loading) {
    return <ContentLoading />;
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-primary" />
            弹窗内容管理
          </h1>
          <p className="text-base-content/70 mt-2">
            管理小程序登录弹窗的文本内容，包括隐私政策、注册福利和手机号授权等弹窗
          </p>
        </div>

        {/* 标签页导航 */}
        <div className="tabs tabs-boxed bg-base-100 mb-6">
          <button
            className={`tab ${activeTab === 'privacy' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <ShieldCheckIcon className="w-4 h-4 mr-2" />
            隐私政策弹窗
          </button>
          <button
            className={`tab ${activeTab === 'benefit' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('benefit')}
          >
            <GiftIcon className="w-4 h-4 mr-2" />
            注册福利弹窗
          </button>
          <button
            className={`tab ${activeTab === 'phone' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('phone')}
          >
            <PhoneIcon className="w-4 h-4 mr-2" />
            手机号授权弹窗
          </button>
        </div>

        {/* 内容编辑区域 */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6">
          {/* 隐私政策弹窗 */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center">
                  <ShieldCheckIcon className="w-6 h-6 mr-2 text-primary" />
                  隐私政策弹窗内容
                </h2>
                <button
                  onClick={() => previewPopup('privacy')}
                  className="btn btn-outline btn-sm"
                >
                  预览弹窗
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">弹窗标题</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={popupContent.privacy.title}
                    onChange={(e) => updatePopupContent('privacy', 'title', e.target.value)}
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">欢迎语</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={popupContent.privacy.greeting}
                    onChange={(e) => updatePopupContent('privacy', 'greeting', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">协议介绍</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  value={popupContent.privacy.agreementIntro}
                  onChange={(e) => updatePopupContent('privacy', 'agreementIntro', e.target.value)}
                ></textarea>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">必要个人信息说明</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  value={popupContent.privacy.necessaryInfo}
                  onChange={(e) => updatePopupContent('privacy', 'necessaryInfo', e.target.value)}
                ></textarea>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">最小必要原则</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  value={popupContent.privacy.minimalPrinciple}
                  onChange={(e) => updatePopupContent('privacy', 'minimalPrinciple', e.target.value)}
                ></textarea>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">协议范围说明</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  value={popupContent.privacy.agreementScope}
                  onChange={(e) => updatePopupContent('privacy', 'agreementScope', e.target.value)}
                ></textarea>
              </div>
            </div>
          )}

          {/* 注册福利弹窗 */}
          {activeTab === 'benefit' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center">
                  <GiftIcon className="w-6 h-6 mr-2 text-primary" />
                  注册福利弹窗内容
                </h2>
                <button
                  onClick={() => previewPopup('benefit')}
                  className="btn btn-outline btn-sm"
                >
                  预览弹窗
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">弹窗标题</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={popupContent.benefit.title}
                    onChange={(e) => updatePopupContent('benefit', 'title', e.target.value)}
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">欢迎语</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={popupContent.benefit.greeting}
                    onChange={(e) => updatePopupContent('benefit', 'greeting', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">福利介绍</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={popupContent.benefit.benefitIntro}
                    onChange={(e) => updatePopupContent('benefit', 'benefitIntro', e.target.value)}
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">福利详情</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={popupContent.benefit.benefitDetails}
                    onChange={(e) => updatePopupContent('benefit', 'benefitDetails', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">福利描述</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-20"
                  value={popupContent.benefit.benefitDescription}
                  onChange={(e) => updatePopupContent('benefit', 'benefitDescription', e.target.value)}
                ></textarea>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">隐私条款文本</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={popupContent.benefit.privacyNote}
                    onChange={(e) => updatePopupContent('benefit', 'privacyNote', e.target.value)}
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">登录按钮文本</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={popupContent.benefit.loginButton}
                    onChange={(e) => updatePopupContent('benefit', 'loginButton', e.target.value)}
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">跳过按钮文本</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={popupContent.benefit.skipButton}
                    onChange={(e) => updatePopupContent('benefit', 'skipButton', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 手机号授权弹窗 */}
          {activeTab === 'phone' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center">
                  <PhoneIcon className="w-6 h-6 mr-2 text-primary" />
                  手机号授权弹窗内容
                </h2>
                <button
                  onClick={() => previewPopup('phone')}
                  className="btn btn-outline btn-sm"
                >
                  预览弹窗
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">弹窗标题</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={popupContent.phone.title}
                    onChange={(e) => updatePopupContent('phone', 'title', e.target.value)}
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">欢迎语</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={popupContent.phone.greeting}
                    onChange={(e) => updatePopupContent('phone', 'greeting', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">说明文字</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-20"
                  value={popupContent.phone.description}
                  onChange={(e) => updatePopupContent('phone', 'description', e.target.value)}
                ></textarea>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">当前手机号标签</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={popupContent.phone.currentPhone}
                    onChange={(e) => updatePopupContent('phone', 'currentPhone', e.target.value)}
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">允许按钮文本</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={popupContent.phone.allowButton}
                    onChange={(e) => updatePopupContent('phone', 'allowButton', e.target.value)}
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">拒绝按钮文本</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={popupContent.phone.rejectButton}
                    onChange={(e) => updatePopupContent('phone', 'rejectButton', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">其他手机号按钮文本</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={popupContent.phone.otherPhoneButton}
                  onChange={(e) => updatePopupContent('phone', 'otherPhoneButton', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="flex gap-2">
              <button
                onClick={resetToDefault}
                className="btn btn-outline"
              >
                重置为默认
              </button>
              <button
                onClick={fetchPopupContent}
                className="btn btn-outline"
              >
                重新加载
              </button>
            </div>
            
            <button
              onClick={savePopupContent}
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  保存中...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  保存内容
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupContentManagePage; 