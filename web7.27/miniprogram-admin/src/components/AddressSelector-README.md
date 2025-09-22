# 省市区选择器组件

基于 `element-china-area-data` 和 Ant Design 的 Cascader 组件实现的省市区三级联动选择器。

## 安装依赖

```bash
npm install element-china-area-data
```

## 组件列表

### 1. ElementAddressSelector - 完整功能版本

包含完整的工具函数和调试信息，适合复杂场景使用。

```jsx
import ElementAddressSelector, { AddressUtils } from '../components/ElementAddressSelector';

// 基础使用
<ElementAddressSelector
  value={selectedAddress}
  onChange={handleAddressChange}
  placeholder="请选择省市区"
/>

// 获取地址文本
const addressText = AddressUtils.getAddressText(['440000', '440600', '440604']);
console.log(addressText); // "广东省佛山市禅城区"
```

### 2. SimpleAddressSelector - 简化版本

轻量级版本，适合简单场景使用。

```jsx
import SimpleAddressSelector from '../components/SimpleAddressSelector';

<SimpleAddressSelector
  value={selectedAddress}
  onChange={handleAddressChange}
  placeholder="请选择省市区"
/>
```

## 属性说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| value | Array | [] | 选中的地址代码数组 |
| onChange | Function | - | 选择变化时的回调函数 |
| placeholder | String | "请选择省市区" | 占位符文本 |
| allowClear | Boolean | true | 是否允许清空 |
| size | String | "large" | 组件大小 |
| style | Object | {} | 自定义样式 |
| className | String | "" | 自定义类名 |

## 工具函数 (AddressUtils)

### getAddressText(codes)
根据地址代码数组获取完整地址文本。

```jsx
const text = AddressUtils.getAddressText(['440000', '440600', '440604']);
// 返回: "广东省佛山市禅城区"
```

### getTextByCode(code)
根据单个代码获取文本。

```jsx
const text = AddressUtils.getTextByCode('440000');
// 返回: "广东省"
```

### getProvinces()
获取所有省份列表。

```jsx
const provinces = AddressUtils.getProvinces();
// 返回: [{ code: '440000', name: '广东省', children: [...] }, ...]
```

### getCitiesByProvince(provinceCode)
根据省份代码获取城市列表。

```jsx
const cities = AddressUtils.getCitiesByProvince('440000');
// 返回: [{ code: '440600', name: '佛山市', children: [...] }, ...]
```

### getDistrictsByCity(cityCode)
根据城市代码获取区县列表。

```jsx
const districts = AddressUtils.getDistrictsByCity('440600');
// 返回: [{ code: '440604', name: '禅城区' }, ...]
```

## 表单集成示例

```jsx
import { Form, Input, Button } from 'antd';
import ElementAddressSelector from '../components/ElementAddressSelector';

const AddressForm = () => {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    console.log('表单数据:', values);
    // values.address 是地址代码数组
    // 可以通过 AddressUtils.getAddressText(values.address) 获取文本
  };

  return (
    <Form form={form} onFinish={handleSubmit}>
      <Form.Item
        name="address"
        label="省市区"
        rules={[{ required: true, message: '请选择省市区' }]}
      >
        <ElementAddressSelector placeholder="请选择省市区" />
      </Form.Item>
      
      <Form.Item
        name="detail"
        label="详细地址"
        rules={[{ required: true, message: '请输入详细地址' }]}
      >
        <Input.TextArea placeholder="请输入详细地址" />
      </Form.Item>
      
      <Form.Item>
        <Button type="primary" htmlType="submit">
          保存
        </Button>
      </Form.Item>
    </Form>
  );
};
```

## 数据格式

### 地址代码格式
- 省份代码：6位数字，如 '440000'
- 城市代码：6位数字，如 '440600'
- 区县代码：6位数字，如 '440604'

### 数据结构
```javascript
// regionData 结构示例
[
  {
    value: '440000',
    label: '广东省',
    children: [
      {
        value: '440600',
        label: '佛山市',
        children: [
          { value: '440604', label: '禅城区' },
          { value: '440605', label: '南海区' },
          // ...
        ]
      },
      // ...
    ]
  },
  // ...
]
```

## 特性

- ✅ 基于 element-china-area-data 数据源，数据完整准确
- ✅ 支持三级联动选择（省-市-区）
- ✅ 支持搜索功能，可以快速定位
- ✅ 支持清空选择
- ✅ 提供完整的工具函数
- ✅ 支持表单集成
- ✅ 支持自定义样式
- ✅ 开发环境显示调试信息
- ✅ 响应式设计，适配不同屏幕尺寸

## 注意事项

1. 确保已安装 `element-china-area-data` 依赖
2. 确保已安装 Ant Design 的 Cascader 组件
3. 地址代码数组的顺序必须是 [省份, 城市, 区县]
4. 在开发环境中会显示调试信息，生产环境会自动隐藏
