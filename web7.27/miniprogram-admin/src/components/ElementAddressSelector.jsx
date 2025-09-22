import React, { useState, useEffect } from 'react';
import { Cascader } from 'antd';
import { regionData, codeToText } from 'element-china-area-data';

const ElementAddressSelector = ({ 
  value, 
  onChange, 
  placeholder = "请选择省市区",
  allowClear = true,
  size = "large",
  style = {},
  className = ""
}) => {
  const [selectedOptions, setSelectedOptions] = useState([]);

  // 当外部 value 变化时，同步内部状态
  useEffect(() => {
    if (value && Array.isArray(value)) {
      setSelectedOptions(value);
    } else {
      setSelectedOptions([]);
    }
  }, [value]);

  // 处理选择变化
  const handleChange = (value, selectedOptions) => {
    setSelectedOptions(value || []);
    
    if (onChange) {
      // 返回选中的值数组
      onChange(value || []);
    }
  };

  // 获取显示文本
  const getDisplayText = (codes) => {
    if (!codes || codes.length === 0) return '';
    
    let location = "";
    for (let i = 0; i < codes.length; i++) {
      location += codeToText[codes[i]] || '';
    }
    return location;
  };

  // 根据代码获取文本
  const getTextByCode = (code) => {
    return codeToText[code] || '';
  };

  // 根据文本获取代码
  const getCodeByText = (text) => {
    // 这里需要实现反向查找，暂时返回空
    // 在实际使用中，可能需要维护一个反向映射表
    return '';
  };

  // 验证地址代码是否有效
  const validateAddressCode = (codes) => {
    if (!codes || codes.length === 0) return false;
    
    // 检查省份代码
    const province = regionData.find(p => p.value === codes[0]);
    if (!province) return false;
    
    // 检查城市代码
    if (codes.length > 1) {
      const city = province.children?.find(c => c.value === codes[1]);
      if (!city) return false;
      
      // 检查区县代码
      if (codes.length > 2) {
        const district = city.children?.find(d => d.value === codes[2]);
        if (!district) return false;
      }
    }
    
    return true;
  };

  return (
    <div className={`element-address-selector ${className}`} style={style}>
      <Cascader
        options={regionData}
        value={selectedOptions}
        onChange={handleChange}
        placeholder={placeholder}
        allowClear={allowClear}
        size={size}
        showSearch={{
          filter: (inputValue, path) => {
            return path.some(option => 
              option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1
            );
          }
        }}
        displayRender={(labels, selectedOptions) => {
          return labels.join(' / ');
        }}
        style={{ width: '100%' }}
      />
      
      {/* 调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          <div>选中值: {JSON.stringify(selectedOptions)}</div>
          <div>显示文本: {getDisplayText(selectedOptions)}</div>
        </div>
      )}
    </div>
  );
};

// 导出工具函数
export const AddressUtils = {
  // 根据代码获取完整地址文本
  getAddressText: (codes) => {
    if (!codes || codes.length === 0) return '';
    
    let location = "";
    for (let i = 0; i < codes.length; i++) {
      location += codeToText[codes[i]] || '';
    }
    return location;
  },

  // 根据代码获取文本
  getTextByCode: (code) => {
    return codeToText[code] || '';
  },

  // 解析地址字符串为代码数组
  parseAddress: (addressString) => {
    // 这里可以实现地址字符串解析为代码数组的逻辑
    // 暂时返回空数组
    return [];
  },

  // 获取所有省份
  getProvinces: () => {
    return regionData.map(province => ({
      code: province.value,
      name: province.label,
      children: province.children
    }));
  },

  // 根据省份代码获取城市
  getCitiesByProvince: (provinceCode) => {
    const province = regionData.find(p => p.value === provinceCode);
    if (province && province.children) {
      return province.children.map(city => ({
        code: city.value,
        name: city.label,
        children: city.children
      }));
    }
    return [];
  },

  // 根据城市代码获取区县
  getDistrictsByCity: (cityCode) => {
    for (const province of regionData) {
      if (province.children) {
        const city = province.children.find(c => c.value === cityCode);
        if (city && city.children) {
          return city.children.map(district => ({
            code: district.value,
            name: district.label
          }));
        }
      }
    }
    return [];
  },

  // 验证地址代码是否有效
  validateAddressCode: (codes) => {
    if (!codes || codes.length === 0) return false;
    
    // 检查省份代码
    const province = regionData.find(p => p.value === codes[0]);
    if (!province) return false;
    
    // 检查城市代码
    if (codes.length > 1) {
      const city = province.children?.find(c => c.value === codes[1]);
      if (!city) return false;
      
      // 检查区县代码
      if (codes.length > 2) {
        const district = city.children?.find(d => d.value === codes[2]);
        if (!district) return false;
      }
    }
    
    return true;
  },

  // 获取地址的层级信息
  getAddressLevel: (codes) => {
    if (!codes || codes.length === 0) return 'none';
    if (codes.length === 1) return 'province';
    if (codes.length === 2) return 'city';
    if (codes.length === 3) return 'district';
    return 'invalid';
  },

  // 搜索地址
  searchAddress: (keyword) => {
    const results = [];
    
    // 搜索省份
    regionData.forEach(province => {
      if (province.label.includes(keyword)) {
        results.push({
          type: 'province',
          code: province.value,
          name: province.label,
          level: 'province'
        });
      }
      
      // 搜索城市
      if (province.children) {
        province.children.forEach(city => {
          if (city.label.includes(keyword)) {
            results.push({
              type: 'city',
              code: city.value,
              name: city.label,
              provinceCode: province.value,
              provinceName: province.label,
              level: 'city'
            });
          }
          
          // 搜索区县
          if (city.children) {
            city.children.forEach(district => {
              if (district.label.includes(keyword)) {
                results.push({
                  type: 'district',
                  code: district.value,
                  name: district.label,
                  provinceCode: province.value,
                  provinceName: province.label,
                  cityCode: city.value,
                  cityName: city.label,
                  level: 'district'
                });
              }
            });
          }
        });
      }
    });
    
    return results;
  }
};

export default ElementAddressSelector;
