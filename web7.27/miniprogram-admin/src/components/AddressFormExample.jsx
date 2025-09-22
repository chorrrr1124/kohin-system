import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Space } from 'antd';
import ElementAddressSelector from './ElementAddressSelector';

const AddressFormExample = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 处理表单提交
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      console.log('表单数据:', values);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('地址信息保存成功！');
      
      // 可以在这里调用实际的API保存数据
      // await saveAddress(values);
      
    } catch (error) {
      message.error('保存失败，请重试');
      console.error('保存错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
  };

  // 填充示例数据
  const fillExample = () => {
    form.setFieldsValue({
      name: '张三',
      phone: '13800138000',
      address: ['440000', '440600', '440604'], // 广东省佛山市禅城区
      detail: '桂城瀚天科技城B2区3号楼'
    });
  };

  return (
    <Card title="地址选择器表单集成示例" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          name: '',
          phone: '',
          address: [],
          detail: ''
        }}
      >
        <Form.Item
          name="name"
          label="收货人姓名"
          rules={[
            { required: true, message: '请输入收货人姓名' },
            { min: 2, message: '姓名至少2个字符' }
          ]}
        >
          <Input placeholder="请输入收货人姓名" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="联系电话"
          rules={[
            { required: true, message: '请输入联系电话' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
          ]}
        >
          <Input placeholder="请输入手机号码" />
        </Form.Item>

        <Form.Item
          name="address"
          label="省市区"
          rules={[
            { required: true, message: '请选择省市区' },
            { 
              validator: (_, value) => {
                if (!value || value.length === 0) {
                  return Promise.reject(new Error('请选择省市区'));
                }
                if (value.length < 3) {
                  return Promise.reject(new Error('请选择完整的省市区'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <ElementAddressSelector
            placeholder="请选择省市区"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="detail"
          label="详细地址"
          rules={[
            { required: true, message: '请输入详细地址' },
            { min: 5, message: '详细地址至少5个字符' }
          ]}
        >
          <Input.TextArea
            placeholder="请输入详细地址，如街道、门牌号、小区名称等"
            rows={3}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
            >
              保存地址
            </Button>
            <Button onClick={handleReset}>
              重置
            </Button>
            <Button onClick={fillExample}>
              填充示例
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddressFormExample;
