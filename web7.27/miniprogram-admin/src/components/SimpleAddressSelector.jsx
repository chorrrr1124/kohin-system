import React, { useState, useEffect } from 'react';
import { Cascader } from 'antd';
import { regionData, codeToText } from 'element-china-area-data';

const SimpleAddressSelector = ({ 
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

  return (
    <div className={`simple-address-selector ${className}`} style={style}>
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
    </div>
  );
};

export default SimpleAddressSelector;
