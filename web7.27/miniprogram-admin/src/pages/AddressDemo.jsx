import React, { useState } from 'react';
import { Card, Form, Input, Button, Space, message, Divider } from 'antd';
import ElementAddressSelector, { AddressUtils } from '../components/ElementAddressSelector';
import AddressFormExample from '../components/AddressFormExample';

const AddressDemo = () => {
  const [form] = Form.useForm();
  const [selectedAddress, setSelectedAddress] = useState([]);
  const [addressText, setAddressText] = useState('');

  // 处理地址选择
  const handleAddressChange = (value) => {
    setSelectedAddress(value);
    const text = AddressUtils.getAddressText(value);
    setAddressText(text);
    console.log('选中的地址代码:', value);
    console.log('选中的地址文本:', text);
  };

  // 处理表单提交
  const handleSubmit = (values) => {
    console.log('表单数据:', values);
    message.success('地址信息已保存！');
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setSelectedAddress([]);
    setAddressText('');
  };

  // 填充示例数据
  const fillExampleData = () => {
    const exampleAddress = ['440000', '440600', '440604']; // 广东省佛山市禅城区
    setSelectedAddress(exampleAddress);
    const text = AddressUtils.getAddressText(exampleAddress);
    setAddressText(text);
    form.setFieldsValue({
      address: exampleAddress,
      detail: '桂城瀚天科技城B2区3号楼'
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card title="省市区选择器演示" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <h4>基础用法</h4>
            <ElementAddressSelector
              value={selectedAddress}
              onChange={handleAddressChange}
              placeholder="请选择省市区"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <h4>当前选择结果</h4>
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
              <div><strong>地址代码:</strong> {JSON.stringify(selectedAddress)}</div>
              <div><strong>地址文本:</strong> {addressText}</div>
            </div>
          </div>

          <Divider />

          <div>
            <h4>表单集成示例</h4>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                address: selectedAddress,
                detail: ''
              }}
            >
              <Form.Item
                name="address"
                label="省市区"
                rules={[{ required: true, message: '请选择省市区' }]}
              >
                <ElementAddressSelector
                  placeholder="请选择省市区"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="detail"
                label="详细地址"
                rules={[{ required: true, message: '请输入详细地址' }]}
              >
                <Input.TextArea
                  placeholder="请输入详细地址，如街道、门牌号等"
                  rows={3}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    保存地址
                  </Button>
                  <Button onClick={handleReset}>
                    重置
                  </Button>
                  <Button onClick={fillExampleData}>
                    填充示例数据
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>

          <Divider />

          <div>
            <h4>工具函数演示</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Button 
                  onClick={() => {
                    const provinces = AddressUtils.getProvinces();
                    console.log('所有省份:', provinces.slice(0, 5)); // 只显示前5个
                    message.info(`共找到 ${provinces.length} 个省份`);
                  }}
                >
                  获取所有省份
                </Button>
              </div>

              <div>
                <Button 
                  onClick={() => {
                    const cities = AddressUtils.getCitiesByProvince('440000'); // 广东省
                    console.log('广东省的城市:', cities);
                    message.info(`广东省共有 ${cities.length} 个城市`);
                  }}
                >
                  获取广东省城市
                </Button>
              </div>

              <div>
                <Button 
                  onClick={() => {
                    const districts = AddressUtils.getDistrictsByCity('440600'); // 佛山市
                    console.log('佛山市的区县:', districts);
                    message.info(`佛山市共有 ${districts.length} 个区县`);
                  }}
                >
                  获取佛山区县
                </Button>
              </div>

              <div>
                <Button 
                  onClick={() => {
                    const isValid = AddressUtils.validateAddressCode(['440000', '440600', '440604']);
                    console.log('地址代码验证结果:', isValid);
                    message.info(`地址代码验证: ${isValid ? '有效' : '无效'}`);
                  }}
                >
                  验证地址代码
                </Button>
              </div>

              <div>
                <Button 
                  onClick={() => {
                    const level = AddressUtils.getAddressLevel(['440000', '440600', '440604']);
                    console.log('地址层级:', level);
                    message.info(`地址层级: ${level}`);
                  }}
                >
                  获取地址层级
                </Button>
              </div>

              <div>
                <Button 
                  onClick={() => {
                    const results = AddressUtils.searchAddress('佛山');
                    console.log('搜索结果:', results);
                    message.info(`搜索"佛山"找到 ${results.length} 个结果`);
                  }}
                >
                  搜索地址
                </Button>
              </div>
            </Space>
          </div>
        </Space>
      </Card>

      <Card title="组件特性">
        <ul>
          <li>✅ 基于 element-china-area-data 数据源</li>
          <li>✅ 支持三级联动选择（省-市-区）</li>
          <li>✅ 支持搜索功能</li>
          <li>✅ 支持清空选择</li>
          <li>✅ 提供完整的工具函数</li>
          <li>✅ 支持表单集成</li>
          <li>✅ 支持自定义样式</li>
          <li>✅ 开发环境显示调试信息</li>
          <li>✅ 地址代码验证功能</li>
          <li>✅ 地址层级检测</li>
          <li>✅ 地址搜索功能</li>
          <li>✅ 省份、城市、区县数据查询</li>
        </ul>
      </Card>

      <Card title="表单集成示例" style={{ marginTop: '24px' }}>
        <AddressFormExample />
      </Card>
    </div>
  );
};

export default AddressDemo;
