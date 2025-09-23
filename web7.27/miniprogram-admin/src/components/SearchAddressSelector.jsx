import React, { useState, useEffect, useMemo } from 'react';

// 中国省市区数据（扁平化结构，便于搜索）
const flatRegionData = [
  // 北京市
  { code: '110101', name: '北京市 东城区', province: '北京市', city: '北京市', district: '东城区' },
  { code: '110102', name: '北京市 西城区', province: '北京市', city: '北京市', district: '西城区' },
  { code: '110105', name: '北京市 朝阳区', province: '北京市', city: '北京市', district: '朝阳区' },
  { code: '110106', name: '北京市 丰台区', province: '北京市', city: '北京市', district: '丰台区' },
  { code: '110107', name: '北京市 石景山区', province: '北京市', city: '北京市', district: '石景山区' },
  { code: '110108', name: '北京市 海淀区', province: '北京市', city: '北京市', district: '海淀区' },
  { code: '110109', name: '北京市 门头沟区', province: '北京市', city: '北京市', district: '门头沟区' },
  { code: '110111', name: '北京市 房山区', province: '北京市', city: '北京市', district: '房山区' },
  { code: '110112', name: '北京市 通州区', province: '北京市', city: '北京市', district: '通州区' },
  { code: '110113', name: '北京市 顺义区', province: '北京市', city: '北京市', district: '顺义区' },
  { code: '110114', name: '北京市 昌平区', province: '北京市', city: '北京市', district: '昌平区' },
  { code: '110115', name: '北京市 大兴区', province: '北京市', city: '北京市', district: '大兴区' },
  { code: '110116', name: '北京市 怀柔区', province: '北京市', city: '北京市', district: '怀柔区' },
  { code: '110117', name: '北京市 平谷区', province: '北京市', city: '北京市', district: '平谷区' },
  { code: '110118', name: '北京市 密云区', province: '北京市', city: '北京市', district: '密云区' },
  { code: '110119', name: '北京市 延庆区', province: '北京市', city: '北京市', district: '延庆区' },

  // 上海市
  { code: '310101', name: '上海市 黄浦区', province: '上海市', city: '上海市', district: '黄浦区' },
  { code: '310104', name: '上海市 徐汇区', province: '上海市', city: '上海市', district: '徐汇区' },
  { code: '310105', name: '上海市 长宁区', province: '上海市', city: '上海市', district: '长宁区' },
  { code: '310106', name: '上海市 静安区', province: '上海市', city: '上海市', district: '静安区' },
  { code: '310107', name: '上海市 普陀区', province: '上海市', city: '上海市', district: '普陀区' },
  { code: '310109', name: '上海市 虹口区', province: '上海市', city: '上海市', district: '虹口区' },
  { code: '310110', name: '上海市 杨浦区', province: '上海市', city: '上海市', district: '杨浦区' },
  { code: '310112', name: '上海市 闵行区', province: '上海市', city: '上海市', district: '闵行区' },
  { code: '310113', name: '上海市 宝山区', province: '上海市', city: '上海市', district: '宝山区' },
  { code: '310114', name: '上海市 嘉定区', province: '上海市', city: '上海市', district: '嘉定区' },
  { code: '310115', name: '上海市 浦东新区', province: '上海市', city: '上海市', district: '浦东新区' },
  { code: '310116', name: '上海市 金山区', province: '上海市', city: '上海市', district: '金山区' },
  { code: '310117', name: '上海市 松江区', province: '上海市', city: '上海市', district: '松江区' },
  { code: '310118', name: '上海市 青浦区', province: '上海市', city: '上海市', district: '青浦区' },
  { code: '310120', name: '上海市 奉贤区', province: '上海市', city: '上海市', district: '奉贤区' },
  { code: '310151', name: '上海市 崇明区', province: '上海市', city: '上海市', district: '崇明区' },

  // 广东省
  { code: '440103', name: '广东省 广州市 荔湾区', province: '广东省', city: '广州市', district: '荔湾区' },
  { code: '440104', name: '广东省 广州市 越秀区', province: '广东省', city: '广州市', district: '越秀区' },
  { code: '440105', name: '广东省 广州市 海珠区', province: '广东省', city: '广州市', district: '海珠区' },
  { code: '440106', name: '广东省 广州市 天河区', province: '广东省', city: '广州市', district: '天河区' },
  { code: '440111', name: '广东省 广州市 白云区', province: '广东省', city: '广州市', district: '白云区' },
  { code: '440112', name: '广东省 广州市 黄埔区', province: '广东省', city: '广州市', district: '黄埔区' },
  { code: '440113', name: '广东省 广州市 番禺区', province: '广东省', city: '广州市', district: '番禺区' },
  { code: '440114', name: '广东省 广州市 花都区', province: '广东省', city: '广州市', district: '花都区' },
  { code: '440115', name: '广东省 广州市 南沙区', province: '广东省', city: '广州市', district: '南沙区' },
  { code: '440117', name: '广东省 广州市 从化区', province: '广东省', city: '广州市', district: '从化区' },
  { code: '440118', name: '广东省 广州市 增城区', province: '广东省', city: '广州市', district: '增城区' },

  { code: '440303', name: '广东省 深圳市 罗湖区', province: '广东省', city: '深圳市', district: '罗湖区' },
  { code: '440304', name: '广东省 深圳市 福田区', province: '广东省', city: '深圳市', district: '福田区' },
  { code: '440305', name: '广东省 深圳市 南山区', province: '广东省', city: '深圳市', district: '南山区' },
  { code: '440306', name: '广东省 深圳市 宝安区', province: '广东省', city: '深圳市', district: '宝安区' },
  { code: '440307', name: '广东省 深圳市 龙岗区', province: '广东省', city: '深圳市', district: '龙岗区' },
  { code: '440308', name: '广东省 深圳市 盐田区', province: '广东省', city: '深圳市', district: '盐田区' },
  { code: '440309', name: '广东省 深圳市 龙华区', province: '广东省', city: '深圳市', district: '龙华区' },
  { code: '440310', name: '广东省 深圳市 坪山区', province: '广东省', city: '深圳市', district: '坪山区' },
  { code: '440311', name: '广东省 深圳市 光明区', province: '广东省', city: '深圳市', district: '光明区' },

  { code: '440604', name: '广东省 佛山市 禅城区', province: '广东省', city: '佛山市', district: '禅城区' },
  { code: '440605', name: '广东省 佛山市 南海区', province: '广东省', city: '佛山市', district: '南海区' },
  { code: '440606', name: '广东省 佛山市 顺德区', province: '广东省', city: '佛山市', district: '顺德区' },
  { code: '440607', name: '广东省 佛山市 三水区', province: '广东省', city: '佛山市', district: '三水区' },
  { code: '440608', name: '广东省 佛山市 高明区', province: '广东省', city: '佛山市', district: '高明区' },

  // 江苏省
  { code: '320102', name: '江苏省 南京市 玄武区', province: '江苏省', city: '南京市', district: '玄武区' },
  { code: '320104', name: '江苏省 南京市 秦淮区', province: '江苏省', city: '南京市', district: '秦淮区' },
  { code: '320105', name: '江苏省 南京市 建邺区', province: '江苏省', city: '南京市', district: '建邺区' },
  { code: '320106', name: '江苏省 南京市 鼓楼区', province: '江苏省', city: '南京市', district: '鼓楼区' },
  { code: '320111', name: '江苏省 南京市 浦口区', province: '江苏省', city: '南京市', district: '浦口区' },
  { code: '320113', name: '江苏省 南京市 栖霞区', province: '江苏省', city: '南京市', district: '栖霞区' },
  { code: '320114', name: '江苏省 南京市 雨花台区', province: '江苏省', city: '南京市', district: '雨花台区' },
  { code: '320115', name: '江苏省 南京市 江宁区', province: '江苏省', city: '南京市', district: '江宁区' },
  { code: '320116', name: '江苏省 南京市 六合区', province: '江苏省', city: '南京市', district: '六合区' },
  { code: '320117', name: '江苏省 南京市 溧水区', province: '江苏省', city: '南京市', district: '溧水区' },
  { code: '320118', name: '江苏省 南京市 高淳区', province: '江苏省', city: '南京市', district: '高淳区' },

  { code: '320505', name: '江苏省 苏州市 虎丘区', province: '江苏省', city: '苏州市', district: '虎丘区' },
  { code: '320506', name: '江苏省 苏州市 吴中区', province: '江苏省', city: '苏州市', district: '吴中区' },
  { code: '320507', name: '江苏省 苏州市 相城区', province: '江苏省', city: '苏州市', district: '相城区' },
  { code: '320508', name: '江苏省 苏州市 姑苏区', province: '江苏省', city: '苏州市', district: '姑苏区' },
  { code: '320509', name: '江苏省 苏州市 吴江区', province: '江苏省', city: '苏州市', district: '吴江区' },
  { code: '320581', name: '江苏省 苏州市 常熟市', province: '江苏省', city: '苏州市', district: '常熟市' },
  { code: '320582', name: '江苏省 苏州市 张家港市', province: '江苏省', city: '苏州市', district: '张家港市' },
  { code: '320583', name: '江苏省 苏州市 昆山市', province: '江苏省', city: '苏州市', district: '昆山市' },
  { code: '320585', name: '江苏省 苏州市 太仓市', province: '江苏省', city: '苏州市', district: '太仓市' },

  // 浙江省
  { code: '330102', name: '浙江省 杭州市 上城区', province: '浙江省', city: '杭州市', district: '上城区' },
  { code: '330105', name: '浙江省 杭州市 拱墅区', province: '浙江省', city: '杭州市', district: '拱墅区' },
  { code: '330106', name: '浙江省 杭州市 西湖区', province: '浙江省', city: '杭州市', district: '西湖区' },
  { code: '330108', name: '浙江省 杭州市 滨江区', province: '浙江省', city: '杭州市', district: '滨江区' },
  { code: '330109', name: '浙江省 杭州市 萧山区', province: '浙江省', city: '杭州市', district: '萧山区' },
  { code: '330110', name: '浙江省 杭州市 余杭区', province: '浙江省', city: '杭州市', district: '余杭区' },
  { code: '330111', name: '浙江省 杭州市 富阳区', province: '浙江省', city: '杭州市', district: '富阳区' },
  { code: '330112', name: '浙江省 杭州市 临安区', province: '浙江省', city: '杭州市', district: '临安区' },
  { code: '330113', name: '浙江省 杭州市 临平区', province: '浙江省', city: '杭州市', district: '临平区' },
  { code: '330114', name: '浙江省 杭州市 钱塘区', province: '浙江省', city: '杭州市', district: '钱塘区' },
  { code: '330122', name: '浙江省 杭州市 桐庐县', province: '浙江省', city: '杭州市', district: '桐庐县' },
  { code: '330127', name: '浙江省 杭州市 淳安县', province: '浙江省', city: '杭州市', district: '淳安县' },
  { code: '330182', name: '浙江省 杭州市 建德市', province: '浙江省', city: '杭州市', district: '建德市' },

  { code: '330203', name: '浙江省 宁波市 海曙区', province: '浙江省', city: '宁波市', district: '海曙区' },
  { code: '330205', name: '浙江省 宁波市 江北区', province: '浙江省', city: '宁波市', district: '江北区' },
  { code: '330206', name: '浙江省 宁波市 北仑区', province: '浙江省', city: '宁波市', district: '北仑区' },
  { code: '330211', name: '浙江省 宁波市 镇海区', province: '浙江省', city: '宁波市', district: '镇海区' },
  { code: '330212', name: '浙江省 宁波市 鄞州区', province: '浙江省', city: '宁波市', district: '鄞州区' },
  { code: '330213', name: '浙江省 宁波市 奉化区', province: '浙江省', city: '宁波市', district: '奉化区' },
  { code: '330225', name: '浙江省 宁波市 象山县', province: '浙江省', city: '宁波市', district: '象山县' },
  { code: '330226', name: '浙江省 宁波市 宁海县', province: '浙江省', city: '宁波市', district: '宁海县' },
  { code: '330281', name: '浙江省 宁波市 余姚市', province: '浙江省', city: '宁波市', district: '余姚市' },
  { code: '330282', name: '浙江省 宁波市 慈溪市', province: '浙江省', city: '宁波市', district: '慈溪市' },

  // 海南省
  { code: '460105', name: '海南省 海口市 秀英区', province: '海南省', city: '海口市', district: '秀英区' },
  { code: '460106', name: '海南省 海口市 龙华区', province: '海南省', city: '海口市', district: '龙华区' },
  { code: '460107', name: '海南省 海口市 琼山区', province: '海南省', city: '海口市', district: '琼山区' },
  { code: '460108', name: '海南省 海口市 美兰区', province: '海南省', city: '海口市', district: '美兰区' },

  // 四川省
  { code: '510104', name: '四川省 成都市 锦江区', province: '四川省', city: '成都市', district: '锦江区' },
  { code: '510105', name: '四川省 成都市 青羊区', province: '四川省', city: '成都市', district: '青羊区' },
  { code: '510106', name: '四川省 成都市 金牛区', province: '四川省', city: '成都市', district: '金牛区' },
  { code: '510107', name: '四川省 成都市 武侯区', province: '四川省', city: '成都市', district: '武侯区' },
  { code: '510108', name: '四川省 成都市 成华区', province: '四川省', city: '成都市', district: '成华区' },
  { code: '510112', name: '四川省 成都市 龙泉驿区', province: '四川省', city: '成都市', district: '龙泉驿区' },
  { code: '510113', name: '四川省 成都市 青白江区', province: '四川省', city: '成都市', district: '青白江区' },
  { code: '510114', name: '四川省 成都市 新都区', province: '四川省', city: '成都市', district: '新都区' },
  { code: '510115', name: '四川省 成都市 温江区', province: '四川省', city: '成都市', district: '温江区' },
  { code: '510116', name: '四川省 成都市 双流区', province: '四川省', city: '成都市', district: '双流区' },
  { code: '510117', name: '四川省 成都市 郫都区', province: '四川省', city: '成都市', district: '郫都区' },
  { code: '510118', name: '四川省 成都市 新津区', province: '四川省', city: '成都市', district: '新津区' },
  { code: '510121', name: '四川省 成都市 金堂县', province: '四川省', city: '成都市', district: '金堂县' },
  { code: '510129', name: '四川省 成都市 大邑县', province: '四川省', city: '成都市', district: '大邑县' },
  { code: '510131', name: '四川省 成都市 蒲江县', province: '四川省', city: '成都市', district: '蒲江县' },
  { code: '510181', name: '四川省 成都市 都江堰市', province: '四川省', city: '成都市', district: '都江堰市' },
  { code: '510182', name: '四川省 成都市 彭州市', province: '四川省', city: '成都市', district: '彭州市' },
  { code: '510183', name: '四川省 成都市 邛崃市', province: '四川省', city: '成都市', district: '邛崃市' },
  { code: '510184', name: '四川省 成都市 崇州市', province: '四川省', city: '成都市', district: '崇州市' },
  { code: '510185', name: '四川省 成都市 简阳市', province: '四川省', city: '成都市', district: '简阳市' }
];

const SearchAddressSelector = ({ value, onChange, placeholder = "请选择省市区" }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // 过滤搜索结果
  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return flatRegionData.slice(0, 20); // 默认显示前20个
    
    return flatRegionData.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.province.includes(searchTerm) ||
      item.city.includes(searchTerm) ||
      item.district.includes(searchTerm)
    ).slice(0, 50); // 最多显示50个结果
  }, [searchTerm]);

  // 获取显示文本
  const getDisplayText = () => {
    if (selectedItem) {
      return selectedItem.name;
    }
    return placeholder;
  };

  // 处理选择
  const handleSelect = (item) => {
    setSelectedItem(item);
    setSearchTerm('');
    setIsOpen(false);
    onChange([item.province, item.city, item.district]);
  };

  // 处理输入变化
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // 处理输入框点击
  const handleInputClick = () => {
    setIsOpen(true);
  };

  // 处理外部点击
  const handleClickOutside = (e) => {
    if (!e.target.closest('.address-selector')) {
      setIsOpen(false);
    }
  };

  // 初始化
  useEffect(() => {
    if (value && Array.isArray(value) && value.length >= 3) {
      const [province, city, district] = value;
      const item = flatRegionData.find(item => 
        item.province === province && 
        item.city === city && 
        item.district === district
      );
      if (item) {
        setSelectedItem(item);
      }
    }
  }, [value]);

  // 添加点击外部关闭功能
  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="relative address-selector">
      <div 
        className="input input-bordered cursor-pointer flex items-center justify-between"
        onClick={handleInputClick}
      >
        <span className={selectedItem ? 'text-gray-900' : 'text-gray-500'}>
          {getDisplayText()}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
          {/* 搜索框 */}
          <div className="p-3 border-b">
            <div className="relative">
              <input
                type="text"
                className="input input-bordered w-full pr-10"
                placeholder="搜索省市区..."
                value={searchTerm}
                onChange={handleInputChange}
                autoFocus
              />
              <svg 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* 搜索结果 */}
          <div className="max-h-64 overflow-y-auto">
            {filteredResults.length > 0 ? (
              filteredResults.map(item => (
                <button
                  key={item.code}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSelect(item)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-900 font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        {item.province} {item.city} {item.district}
                      </div>
                    </div>
                    {selectedItem && selectedItem.code === item.code && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                {searchTerm ? '未找到匹配的地区' : '请输入搜索关键词'}
              </div>
            )}
          </div>

          {/* 底部提示 */}
          <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t">
            支持搜索省份、城市、区县名称
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAddressSelector;
