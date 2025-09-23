import React from 'react';
import CascaderAddressSelector from './CascaderAddressSelector';

// 使用级联选择器作为默认的地址选择器
const AddressSelector = (props) => {
  return <CascaderAddressSelector {...props} />;
};

export default AddressSelector;
