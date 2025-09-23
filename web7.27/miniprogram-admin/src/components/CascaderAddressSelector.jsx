import React, { useState, useEffect } from 'react';
import { addressData, districtsData, AddressUtils } from '../data/addressData';

const CascaderAddressSelector = ({ 
  value = [], 
  onChange, 
  placeholder = "请选择省市区",
  style = {},
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0); // 0: 省份, 1: 城市, 2: 区县
  const [selectedPath, setSelectedPath] = useState([]); // 当前选择路径
  const [currentOptions, setCurrentOptions] = useState([]);

  // 初始化当前选项
  useEffect(() => {
    if (currentLevel === 0) {
      setCurrentOptions(addressData.provinces);
    } else if (currentLevel === 1 && selectedPath[0]) {
      const province = addressData.provinces.find(p => p.name === selectedPath[0]);
      if (province) {
        setCurrentOptions(addressData.cities[province.code] || []);
      }
    } else if (currentLevel === 2 && selectedPath[1]) {
      const province = addressData.provinces.find(p => p.name === selectedPath[0]);
      if (province) {
        const city = addressData.cities[province.code]?.find(c => c.name === selectedPath[1]);
        if (city) {
          setCurrentOptions(districtsData[city.code] || []);
        }
      }
    }
  }, [currentLevel, selectedPath]);

  // 处理选项点击
  const handleOptionClick = (option) => {
    const newPath = [...selectedPath];
    newPath[currentLevel] = option.name;
    
    // 截断后续路径
    newPath.splice(currentLevel + 1);
    
    setSelectedPath(newPath);
    
    if (currentLevel < 2) {
      // 进入下一级
      setCurrentLevel(currentLevel + 1);
    } else {
      // 完成选择
      const finalValue = newPath.filter(Boolean);
      onChange && onChange(finalValue);
      setIsOpen(false);
      setCurrentLevel(0);
      setSelectedPath([]);
    }
  };

  // 处理返回上一级
  const handleBack = () => {
    if (currentLevel > 0) {
      setCurrentLevel(currentLevel - 1);
      const newPath = [...selectedPath];
      newPath.splice(currentLevel);
      setSelectedPath(newPath);
    } else {
      setIsOpen(false);
    }
  };

  // 处理关闭
  const handleClose = () => {
    setIsOpen(false);
    setCurrentLevel(0);
    setSelectedPath([]);
  };

  // 获取显示文本
  const getDisplayText = () => {
    if (value && value.length > 0) {
      return value.join('');
    }
    return placeholder;
  };

  // 清空选择
  const handleClear = (e) => {
    e.stopPropagation();
    onChange && onChange([]);
  };

  return (
    <div className={`relative ${className}`} style={style}>
      {/* 输入框 */}
      <div 
        className="input input-bordered w-full cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
          {getDisplayText()}
        </span>
        <div className="flex items-center space-x-1">
          {value.length > 0 && (
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              onClick={handleClear}
            >
              ✕
            </button>
          )}
          <span className="text-gray-400">
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* 下拉面板 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
          {/* 面包屑导航 */}
          <div className="flex items-center p-3 border-b border-gray-100">
            {currentLevel > 0 && (
              <button
                type="button"
                className="flex items-center text-blue-600 hover:text-blue-800 mr-3"
                onClick={handleBack}
              >
                <span className="mr-1">←</span>
                返回
              </button>
            )}
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              {selectedPath.map((item, index) => (
                <React.Fragment key={index}>
                  <span className="text-blue-600">{item}</span>
                  {index < selectedPath.length - 1 && <span>/</span>}
                </React.Fragment>
              ))}
            </div>
            <button
              type="button"
              className="ml-auto text-gray-400 hover:text-gray-600"
              onClick={handleClose}
            >
              ✕
            </button>
          </div>

          {/* 选项列表 */}
          <div className="max-h-60 overflow-y-auto">
            {currentOptions.length > 0 ? (
              currentOptions.map((option) => (
                <div
                  key={option.code}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleOptionClick(option)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">{option.name}</span>
                    {currentLevel < 2 && (
                      <span className="text-gray-400">→</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                暂无数据
              </div>
            )}
          </div>
        </div>
      )}

      {/* 遮罩层 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={handleClose}
        />
      )}
    </div>
  );
};

export default CascaderAddressSelector;