import React, { useState } from 'react';
import AddressSelector from '../components/AddressSelector';
import CascaderAddressSelector from '../components/CascaderAddressSelector';
import SearchAddressSelector from '../components/SearchAddressSelector';
import TagAddressSelector from '../components/TagAddressSelector';
import AddressRecognizer from '../components/AddressRecognizer';
import { AddressUtils } from '../data/addressData';

const AddressSelectorDemo = () => {
  const [selectedAddress1, setSelectedAddress1] = useState([]);
  const [selectedAddress2, setSelectedAddress2] = useState([]);
  const [selectedAddress3, setSelectedAddress3] = useState([]);
  const [selectedAddress4, setSelectedAddress4] = useState([]);
  const [recognizedData, setRecognizedData] = useState(null);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">省市区选择器演示</h1>
      
      <div className="space-y-8">
        {/* 原始选择器 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">1. 原始选择器（网格布局）</h2>
          <p className="text-gray-600 mb-4">传统的网格布局选择器，支持省市区三级联动</p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">选择地址：</label>
            <AddressSelector
              value={selectedAddress1}
              onChange={setSelectedAddress1}
              placeholder="请选择省市区"
            />
          </div>
          <div className="text-sm text-gray-600">
            <div>选中值: {JSON.stringify(selectedAddress1)}</div>
            <div>地址文本: {AddressUtils.getAddressText(selectedAddress1)}</div>
          </div>
        </div>

        {/* 级联选择器 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">2. 级联选择器（Cascader）</h2>
          <p className="text-gray-600 mb-4">类似 Ant Design 的级联选择器，支持返回上一级操作</p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">选择地址：</label>
            <CascaderAddressSelector
              value={selectedAddress2}
              onChange={setSelectedAddress2}
              placeholder="请选择省市区"
            />
          </div>
          <div className="text-sm text-gray-600">
            <div>选中值: {JSON.stringify(selectedAddress2)}</div>
            <div>地址文本: {AddressUtils.getAddressText(selectedAddress2)}</div>
          </div>
        </div>

        {/* 搜索式选择器 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">3. 搜索式选择器</h2>
          <p className="text-gray-600 mb-4">支持搜索的扁平化选择器，可以快速找到目标地区</p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">选择地址：</label>
            <SearchAddressSelector
              value={selectedAddress3}
              onChange={setSelectedAddress3}
              placeholder="请选择省市区"
            />
          </div>
          <div className="text-sm text-gray-600">
            <div>选中值: {JSON.stringify(selectedAddress3)}</div>
            <div>地址文本: {AddressUtils.getAddressText(selectedAddress3)}</div>
          </div>
        </div>

        {/* 标签式选择器 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">4. 标签式选择器</h2>
          <p className="text-gray-600 mb-4">以标签形式展示选择器，支持独立清除每个级别</p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">选择地址：</label>
            <TagAddressSelector
              value={selectedAddress4}
              onChange={setSelectedAddress4}
              placeholder="请选择省市区"
            />
          </div>
          <div className="text-sm text-gray-600">
            <div>选中值: {JSON.stringify(selectedAddress4)}</div>
            <div>地址文本: {AddressUtils.getAddressText(selectedAddress4)}</div>
          </div>
        </div>

        {/* 地址识别器 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">5. 地址识别器</h2>
          <p className="text-gray-600 mb-4">智能识别地址文本，自动解析省市区县信息</p>
          <div className="mb-4">
            <AddressRecognizer
              onRecognize={(data) => {
                setRecognizedData(data);
                // 将识别结果转换为地址数组
                const addressArray = [];
                if (data.province) addressArray.push(data.province);
                if (data.city) addressArray.push(data.city);
                if (data.district) addressArray.push(data.district);
                setSelectedAddress1(addressArray);
              }}
              onClear={() => {
                setRecognizedData(null);
                setSelectedAddress1([]);
              }}
            />
          </div>
          {recognizedData && (
            <div className="text-sm text-gray-600">
              <div><strong>识别结果：</strong></div>
              <div>收货人: {recognizedData.name}</div>
              <div>联系电话: {recognizedData.phone}</div>
              <div>省份: {recognizedData.province}</div>
              <div>城市: {recognizedData.city}</div>
              <div>区县: {recognizedData.district}</div>
              <div>详细地址: {recognizedData.detail}</div>
              <div>完整地址: {recognizedData.fullAddress}</div>
            </div>
          )}
        </div>
      </div>

      {/* 使用说明 */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">使用说明</h3>
        <div className="space-y-2 text-blue-800">
          <p><strong>1. 原始选择器（默认）：</strong>现在使用级联选择器作为默认实现，适合需要明确选择流程的场景，支持返回操作</p>
          <p><strong>2. 级联选择器：</strong>类似 Ant Design 的级联选择器，支持返回上一级操作，包含全国所有省市区县数据</p>
          <p><strong>3. 搜索式选择器：</strong>适合选项较多或需要快速定位的场景，支持模糊搜索</p>
          <p><strong>4. 标签式选择器：</strong>适合需要灵活选择或清除的场景，选择状态清晰可见</p>
          <p><strong>5. 地址识别器：</strong>智能识别地址文本，自动解析省市区县信息，避免区县重复问题</p>
          <p className="mt-4 text-green-700"><strong>✨ 新特性：</strong>所有选择器现在都包含完整的全国省市区县数据，地址识别功能也已同步更新，修复了区县重复问题</p>
        </div>
      </div>
    </div>
  );
};

export default AddressSelectorDemo;
