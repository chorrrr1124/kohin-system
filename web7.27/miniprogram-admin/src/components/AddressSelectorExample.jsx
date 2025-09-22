import React, { useState } from 'react';
import { Form, Input, Button, Card, Space, message } from 'antd';
import SimpleAddressSelector from './SimpleAddressSelector';
import { AddressUtils } from './ElementAddressSelector';

const AddressSelectorExample = () => {
  const [form] = Form.useForm();
  const [selectedAddress, setSelectedAddress] = useState([]);

  // 处理地址选择
  const handleAddressChange = (value) => {
    setSelectedAddress(value);
    console.log('选中的地址代码:', value);
    console.log('选中的地址文本:', AddressUtils.getAddressText(value));
  };

  // 处理表单提交
  const handleSubmit = (values) => {
    console.log('表单数据:', values);
    console.log('地址文本:', AddressUtils.getAddressText(values.address));
    message.success('地址信息已保存！');
  };

  // 填充示例数据
  const fillExampleData = () => {
    const exampleAddress = ['440000', '440600', '440604']; // 广东省佛山市禅城区
    setSelectedAddress(exampleAddress);
    form.setFieldsValue({
      address: exampleAddress,
      detail: '桂城瀚天科技城B2区3号楼'
    });
  };

  return (
    <Card title="地址选择器使用示例" style={{ maxWidth: '600px', margin: '0 auto' }}>
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
          <SimpleAddressSelector
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
            <Button onClick={fillExampleData}>
              填充示例数据
            </Button>
            <Button onClick={() => form.resetFields()}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {/* 显示当前选择结果 */}
      {selectedAddress.length > 0 && (
        <Card size="small" style={{ marginTop: '16px', background: '#f5f5f5' }}>
          <h4>当前选择结果：</h4>
          <p><strong>地址代码：</strong> {JSON.stringify(selectedAddress)}</p>
          <p><strong>地址文本：</strong> {AddressUtils.getAddressText(selectedAddress)}</p>
        </Card>
      )}
    </Card>
  );
};

export default AddressSelectorExample;
